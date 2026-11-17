
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function clean(value: unknown, max = 1000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function verifyUser(token: string) {
  const result = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!result.ok) return null;

  const user = await result.json();
  return user?.id ? user : null;
}

async function dbRequest(
  path: string,
  token: string,
  options: RequestInit = {}
) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });
}

// GET: Institution owner can view their own inquiries.
export async function GET(request: NextRequest) {
  try {
    const token = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return response({ error: "Authentication required." }, 401);
    }

    const user = await verifyUser(token);

    if (!user) {
      return response({ error: "Invalid authentication." }, 401);
    }

    const institutionId = clean(
      request.nextUrl.searchParams.get("institution_id"),
      36
    );

    if (!UUID_REGEX.test(institutionId)) {
      return response({ error: "Valid institution_id is required." }, 400);
    }

    const institutionResult = await dbRequest(
      `institutions?id=eq.${institutionId}&owner_user_id=eq.${user.id}&select=id`,
      token
    );

    if (!institutionResult.ok) {
      return response({ error: "Unable to verify institution ownership." }, 400);
    }

    const institutions = await institutionResult.json();

    if (!institutions.length) {
      return response({ error: "Institution not found or access denied." }, 403);
    }

    const inquiriesResult = await dbRequest(
      `institution_inquiries?institution_id=eq.${institutionId}&select=*&order=created_at.desc`,
      token
    );

    if (!inquiriesResult.ok) {
      return response({ error: "Unable to load inquiries." }, 400);
    }

    return response({ inquiries: await inquiriesResult.json() });
  } catch {
    return response({ error: "Something went wrong." }, 500);
  }
}

// POST: Students can submit admission inquiries.
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return response({ error: "Invalid JSON request." }, 400);
    }

    const institutionId = clean(body.institution_id, 36);
    const campusId = clean(body.campus_id, 36);
    const programId = clean(body.program_id, 36);

    const studentName = clean(body.student_name, 100);
    const studentEmail = clean(body.student_email, 254);
    const studentPhone = clean(body.student_phone, 30);
    const message = clean(body.message, 2000);

    if (!UUID_REGEX.test(institutionId)) {
      return response({ error: "Valid institution_id is required." }, 400);
    }

    if (
      !studentName ||
      !studentPhone ||
      !message ||
      studentName.length < 2 ||
      studentPhone.length < 7 ||
      message.length < 5
    ) {
      return response(
        { error: "Please provide a valid name, phone number and message." },
        400
      );
    }

    if (studentEmail && !validEmail(studentEmail)) {
      return response({ error: "Invalid email address." }, 400);
    }

    if (campusId && !UUID_REGEX.test(campusId)) {
      return response({ error: "Invalid campus_id." }, 400);
    }

    if (programId && !UUID_REGEX.test(programId)) {
      return response({ error: "Invalid program_id." }, 400);
    }

    // Optional authentication. Never trust a user ID supplied in the body.
    const authToken = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");

    let studentUserId: string | null = null;
    let insertToken = SUPABASE_ANON_KEY;

    if (authToken) {
      const user = await verifyUser(authToken);

      if (!user) {
        return response({ error: "Invalid authentication." }, 401);
      }

      studentUserId = user.id;
      insertToken = authToken;
    }

    // Confirm the institution is publicly approved and active.
    const institutionResult = await dbRequest(
      `institutions?id=eq.${institutionId}&verification_status=eq.approved&is_active=eq.true&select=id`,
      SUPABASE_ANON_KEY
    );

    if (!institutionResult.ok) {
      return response({ error: "Unable to verify institution." }, 400);
    }

    const institutions = await institutionResult.json();

    if (!institutions.length) {
      return response(
        { error: "This institution is not currently accepting public inquiries." },
        404
      );
    }

    // If a campus is selected, it must belong to this institution.
    if (campusId) {
      const campusResult = await dbRequest(
        `institution_campuses?id=eq.${campusId}&institution_id=eq.${institutionId}&is_active=eq.true&select=id`,
        SUPABASE_ANON_KEY
      );

      if (!campusResult.ok) {
        return response({ error: "Unable to verify campus." }, 400);
      }

      const campuses = await campusResult.json();

      if (!campuses.length) {
        return response({ error: "Invalid or inactive campus." }, 400);
      }
    }

    // If a program is selected, verify its institution and campus.
    if (programId) {
      const programResult = await dbRequest(
        `institution_programs?id=eq.${programId}&institution_id=eq.${institutionId}&is_active=eq.true&select=id,campus_id`,
        SUPABASE_ANON_KEY
      );

      if (!programResult.ok) {
        return response({ error: "Unable to verify program." }, 400);
      }

      const programs = await programResult.json();

      if (!programs.length) {
        return response({ error: "Invalid or inactive program." }, 400);
      }

      const program = programs[0];

      if (program.campus_id && program.campus_id !== campusId) {
        return response(
          { error: "Please select the campus associated with this program." },
          400
        );
      }
    }

    const inquiry = {
      institution_id: institutionId,
      campus_id: campusId || null,
      program_id: programId || null,
      student_user_id: studentUserId,
      student_name: studentName,
      student_email: studentEmail || null,
      student_phone: studentPhone,
      message,
      status: "new",
      admin_notes: null,
    };

    const insertResult = await dbRequest(
      "institution_inquiries",
      insertToken,
      {
        method: "POST",
        headers: {
          Prefer: "return=representation",
        },
        body: JSON.stringify(inquiry),
      }
    );

    if (!insertResult.ok) {
      const error = await insertResult.json().catch(() => null);
      console.error("Education inquiry insert failed:", error);

      return response(
        { error: "Unable to submit inquiry. Please try again." },
        400
      );
    }

    const inserted = await insertResult.json();

    return response(
      {
        message: "Admission inquiry submitted successfully.",
        inquiry: inserted?.[0] ?? null,
      },
      201
    );
  } catch (error) {
    console.error("Education inquiry API error:", error);
    return response({ error: "Something went wrong." }, 500);
  }
}

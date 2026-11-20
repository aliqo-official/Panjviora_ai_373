
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_STATUSES = [
  "new",
  "contacted",
  "in_review",
  "accepted",
  "rejected",
  "closed",
] as const;

type InquiryStatus = (typeof ALLOWED_STATUSES)[number];

const INQUIRY_FIELDS =
  "id,institution_id,campus_id,program_id,student_user_id,student_name,student_email,student_phone,message,status,admin_notes,created_at,updated_at";

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function clean(value: unknown, max = 1000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function verifyUser(token: string) {
  const result = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY!,
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
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });
}

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() || null;
}

// GET: Institution owners can view only their own inquiries.
export async function GET(request: NextRequest) {
  try {
    if (!isConfigured()) {
      return response({ error: "Server configuration error." }, 500);
    }

    const token = getBearerToken(request);

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
      return response(
        { error: "Valid institution_id is required." },
        400
      );
    }

    const institutionResult = await dbRequest(
      `institutions?id=eq.${institutionId}&owner_user_id=eq.${user.id}&select=id`,
      token
    );

    if (!institutionResult.ok) {
      return response(
        { error: "Unable to verify institution ownership." },
        502
      );
    }

    const institutions = await institutionResult.json();

    if (!institutions.length) {
      return response(
        { error: "Institution not found or access denied." },
        403
      );
    }

    const inquiriesResult = await dbRequest(
      `institution_inquiries?institution_id=eq.${institutionId}&select=${INQUIRY_FIELDS}&order=created_at.desc`,
      token
    );

    if (!inquiriesResult.ok) {
      console.error(
        "Education inquiry GET failed:",
        await inquiriesResult.text()
      );

      return response({ error: "Unable to load inquiries." }, 502);
    }

    const inquiries = await inquiriesResult.json();

    // Collect unique campus and program IDs.
    const campusIds = [
      ...new Set(
        inquiries
          .map((item: { campus_id: string | null }) => item.campus_id)
          .filter((id: string | null): id is string => Boolean(id))
      ),
    ];

    const programIds = [
      ...new Set(
        inquiries
          .map((item: { program_id: string | null }) => item.program_id)
          .filter((id: string | null): id is string => Boolean(id))
      ),
    ];

    const campusNames = new Map<string, string>();
    const programNames = new Map<string, string>();

    // Fetch campus names belonging to this institution.
    if (campusIds.length > 0) {
      const campusResult = await dbRequest(
        `institution_campuses?id=in.(${campusIds.join(",")})&institution_id=eq.${institutionId}&select=id,campus_name`,
        token
      );

      if (!campusResult.ok) {
        console.error(
          "Education campus lookup failed:",
          await campusResult.text()
        );

        return response({ error: "Unable to load campus names." }, 502);
      }

      const campuses = await campusResult.json();

      for (const campus of campuses) {
        campusNames.set(campus.id, campus.campus_name);
      }
    }

    // Fetch program names belonging to this institution.
    if (programIds.length > 0) {
      const programResult = await dbRequest(
        `institution_programs?id=in.(${programIds.join(",")})&institution_id=eq.${institutionId}&select=id,program_name`,
        token
      );

      if (!programResult.ok) {
        console.error(
          "Education program lookup failed:",
          await programResult.text()
        );

        return response({ error: "Unable to load program names." }, 502);
      }

      const programs = await programResult.json();

      for (const program of programs) {
        programNames.set(program.id, program.program_name);
      }
    }

    // Return inquiries with readable campus and program names.
    const inquiriesWithNames = inquiries.map(
      (item: {
        campus_id: string | null;
        program_id: string | null;
        [key: string]: unknown;
      }) => ({
        ...item,
        campus_name: item.campus_id
          ? campusNames.get(item.campus_id) || null
          : null,
        program_name: item.program_id
          ? programNames.get(item.program_id) || null
          : null,
      })
    );

    return response({
      inquiries: inquiriesWithNames,
    });
  } catch (error) {
    console.error("Education inquiry GET error:", error);
    return response({ error: "Something went wrong." }, 500);
  }
}

// POST: Students can submit admission inquiries.
export async function POST(request: NextRequest) {
  try {
    if (!isConfigured()) {
      return response({ error: "Server configuration error." }, 500);
    }

    let body: Record<string, unknown>;

    try {
      const parsed = await request.json();

      if (!isObject(parsed)) {
        return response({ error: "Invalid JSON request." }, 400);
      }

      body = parsed;
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
      return response(
        { error: "Valid institution_id is required." },
        400
      );
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
        {
          error:
            "Please provide a valid name, phone number and message.",
        },
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

    // Optional student authentication.
    // Never trust a student_user_id supplied in the request body.
    const authToken = getBearerToken(request);

    let studentUserId: string | null = null;
    let insertToken = SUPABASE_ANON_KEY!;

    if (authToken) {
      const user = await verifyUser(authToken);

      if (!user) {
        return response({ error: "Invalid authentication." }, 401);
      }

      studentUserId = user.id;
      insertToken = authToken;
    }

    // Verify approved and active institution.
    const institutionResult = await dbRequest(
      `institutions?id=eq.${institutionId}&verification_status=eq.approved&is_active=eq.true&select=id`,
      SUPABASE_ANON_KEY!
    );

    if (!institutionResult.ok) {
      return response({ error: "Unable to verify institution." }, 502);
    }

    const institutions = await institutionResult.json();

    if (!institutions.length) {
      return response(
        {
          error:
            "This institution is not currently accepting public inquiries.",
        },
        404
      );
    }

    // Verify selected campus belongs to the institution.
    if (campusId) {
      const campusResult = await dbRequest(
        `institution_campuses?id=eq.${campusId}&institution_id=eq.${institutionId}&is_active=eq.true&select=id`,
        SUPABASE_ANON_KEY!
      );

      if (!campusResult.ok) {
        return response({ error: "Unable to verify campus." }, 502);
      }

      const campuses = await campusResult.json();

      if (!campuses.length) {
        return response(
          { error: "Invalid or inactive campus." },
          400
        );
      }
    }

    // Verify selected program and its campus association.
    if (programId) {
      const programResult = await dbRequest(
        `institution_programs?id=eq.${programId}&institution_id=eq.${institutionId}&is_active=eq.true&select=id,campus_id`,
        SUPABASE_ANON_KEY!
      );

      if (!programResult.ok) {
        return response({ error: "Unable to verify program." }, 502);
      }

      const programs = await programResult.json();

      if (!programs.length) {
        return response(
          { error: "Invalid or inactive program." },
          400
        );
      }

      const program = programs[0];

      if (program.campus_id && program.campus_id !== campusId) {
        return response(
          {
            error:
              "Please select the campus associated with this program.",
          },
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
          // Do not request returned student data from the public endpoint.
          Prefer: "return=minimal",
        },
        body: JSON.stringify(inquiry),
      }
    );

    
if (!insertResult.ok) {
  const insertErrorText = await insertResult.text();

  if (insertErrorText.includes("DUPLICATE_INQUIRY")) {
    return response(
      {
        error:
          "You have already submitted an inquiry to this institution within the last 24 hours. Please wait for the institution to respond.",
      },
      409
    );
  }

  console.error(
    "Education inquiry insert failed:",
    insertErrorText
  );

  return response(
    {
      error: "Unable to submit inquiry. Please try again.",
    },
    400
  );
}


    return response(
      {
        message: "Admission inquiry submitted successfully.",
      },
      201
    );
  } catch (error) {
    console.error("Education inquiry POST error:", error);
    return response({ error: "Something went wrong." }, 500);
  }
}

// PATCH: Institution owners can update inquiry status and admin notes.
export async function PATCH(request: NextRequest) {
  try {
    if (!isConfigured()) {
      return response({ error: "Server configuration error." }, 500);
    }

    const token = getBearerToken(request);

    if (!token) {
      return response({ error: "Authentication required." }, 401);
    }

    const user = await verifyUser(token);

    if (!user) {
      return response({ error: "Invalid authentication." }, 401);
    }

    let body: Record<string, unknown>;

    try {
      const parsed = await request.json();

      if (!isObject(parsed)) {
        return response({ error: "Invalid JSON request." }, 400);
      }

      body = parsed;
    } catch {
      return response({ error: "Invalid JSON request." }, 400);
    }

    const allowedKeys = [
      "inquiry_id",
      "institution_id",
      "status",
      "admin_notes",
    ];

    if (Object.keys(body).some((key) => !allowedKeys.includes(key))) {
      return response(
        { error: "Request contains unsupported fields." },
        400
      );
    }

    const inquiryId = clean(body.inquiry_id, 36);
    const institutionId = clean(body.institution_id, 36);

    if (
      !UUID_REGEX.test(inquiryId) ||
      !UUID_REGEX.test(institutionId)
    ) {
      return response(
        { error: "Valid inquiry_id and institution_id are required." },
        400
      );
    }

    const hasStatus = Object.prototype.hasOwnProperty.call(
      body,
      "status"
    );

    const hasNotes = Object.prototype.hasOwnProperty.call(
      body,
      "admin_notes"
    );

    if (!hasStatus && !hasNotes) {
      return response(
        { error: "Provide a status or admin_notes update." },
        400
      );
    }

    const updates: Record<string, unknown> = {};

    if (hasStatus) {
      if (
        typeof body.status !== "string" ||
        !ALLOWED_STATUSES.includes(body.status as InquiryStatus)
      ) {
        return response(
          {
            error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(", ")}.`,
          },
          400
        );
      }

      updates.status = body.status;
    }

    if (hasNotes) {
      if (
        body.admin_notes !== null &&
        typeof body.admin_notes !== "string"
      ) {
        return response(
          { error: "admin_notes must be text or null." },
          400
        );
      }

      if (typeof body.admin_notes === "string") {
        if (body.admin_notes.length > 2000) {
          return response(
            { error: "Admin notes cannot exceed 2000 characters." },
            400
          );
        }

        updates.admin_notes = body.admin_notes.trim() || null;
      } else {
        updates.admin_notes = null;
      }
    }

    // Verify institution ownership.
    const institutionResult = await dbRequest(
      `institutions?id=eq.${institutionId}&owner_user_id=eq.${user.id}&select=id`,
      token
    );

    if (!institutionResult.ok) {
      return response(
        { error: "Unable to verify institution ownership." },
        502
      );
    }

    const institutions = await institutionResult.json();

    if (!institutions.length) {
      return response(
        { error: "Institution not found or access denied." },
        403
      );
    }

    updates.updated_at = new Date().toISOString();

    const updateResult = await dbRequest(
      `institution_inquiries?id=eq.${inquiryId}&institution_id=eq.${institutionId}&select=${INQUIRY_FIELDS}`,
      token,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      }
    );

    if (!updateResult.ok) {
      console.error(
        "Education inquiry update failed:",
        await updateResult.text()
      );

      return response(
        { error: "Unable to update inquiry. Please try again." },
        400
      );
    }

    const updatedInquiries = await updateResult.json();

    if (!updatedInquiries.length) {
      return response(
        {
          error:
            "Inquiry not found or you do not have permission to update it.",
        },
        404
      );
    }

    return response({
      message: "Admission inquiry updated successfully.",
      inquiry: updatedInquiries[0],
    });
  } catch (error) {
    console.error("Education inquiry PATCH error:", error);
    return response({ error: "Something went wrong." }, 500);
  }
}


import { NextRequest, NextResponse } from "next/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AuthData = {
  supabaseUrl: string;
  supabaseKey: string;
  token: string;
  user: { id: string };
};

async function getAuth(
  request: NextRequest,
  required: boolean
): Promise<AuthData | null | "invalid"> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return required ? null : {
      supabaseUrl,
      supabaseKey,
      token: supabaseKey,
      user: { id: "" },
    };
  }

  if (!authorization.startsWith("Bearer ")) return "invalid";

  const token = authorization.slice(7).trim();
  if (!token) return "invalid";

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return "invalid";

  const user = await response.json();
  if (!user?.id) return "invalid";

  return { supabaseUrl, supabaseKey, token, user };
}

async function restGet(
  auth: AuthData,
  path: string
) {
  return fetch(`${auth.supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: auth.supabaseKey,
      Authorization: `Bearer ${auth.token}`,
    },
    cache: "no-store",
  });
}

// GET: Owner views inquiries for their institution
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth(request, true);

    if (!auth || auth === "invalid") {
      return NextResponse.json(
        { error: "Please login with a valid account" },
        { status: 401 }
      );
    }

    const institutionId = request.nextUrl.searchParams
      .get("institution_id")
      ?.trim();

    if (!institutionId || !UUID_PATTERN.test(institutionId)) {
      return NextResponse.json(
        { error: "A valid institution ID is required" },
        { status: 400 }
      );
    }

    const ownerResponse = await restGet(
      auth,
      `institutions?select=id&id=eq.${encodeURIComponent(
        institutionId
      )}&owner_user_id=eq.${encodeURIComponent(auth.user.id)}&limit=1`
    );

    if (!ownerResponse.ok) {
      return NextResponse.json(
        { error: "Unable to verify institution ownership" },
        { status: 500 }
      );
    }

    const ownerData = await ownerResponse.json();

    if (!Array.isArray(ownerData) || ownerData.length === 0) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    const response = await restGet(
      auth,
      `institution_inquiries?select=*&institution_id=eq.${encodeURIComponent(
        institutionId
      )}&order=created_at.desc`
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to load admission inquiries" },
        { status: response.status }
      );
    }

    return NextResponse.json({ inquiries: data });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to the database" },
      { status: 500 }
    );
  }
}

// POST: Student or parent submits an admission inquiry
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth(request, false);

    if (!auth || auth === "invalid") {
      return NextResponse.json(
        { error: "Invalid login session" },
        { status: 401 }
      );
    }

    let body: Record<string, unknown>;

    try {
      const parsed = await request.json();

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json(
          { error: "Invalid inquiry data" },
          { status: 400 }
        );
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request" },
        { status: 400 }
      );
    }

    const institutionId = String(body.institution_id || "").trim();
    const campusId = body.campus_id
      ? String(body.campus_id).trim()
      : null;
    const programId = body.program_id
      ? String(body.program_id).trim()
      : null;

    const studentName = String(body.student_name || "").trim();
    const studentPhone = String(body.student_phone || "").trim();
    const message = String(body.message || "").trim();
    const studentEmail = body.student_email
      ? String(body.student_email).trim()
      : null;

    if (
      !UUID_PATTERN.test(institutionId) ||
      !studentName ||
      !studentPhone ||
      !message
    ) {
      return NextResponse.json(
        {
          error:
            "Institution, student name, phone and message are required",
        },
        { status: 400 }
      );
    }

    if (
      studentName.length > 150 ||
      studentPhone.length > 30 ||
      message.length > 3000
    ) {
      return NextResponse.json(
        { error: "One or more fields exceed the allowed length" },
        { status: 400 }
      );
    }

    if (
      (campusId && !UUID_PATTERN.test(campusId)) ||
      (programId && !UUID_PATTERN.test(programId))
    ) {
      return NextResponse.json(
        { error: "Invalid campus or program ID" },
        { status: 400 }
      );
    }

    if (
      studentEmail &&
      (
        studentEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)
      )
    ) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Verify that the institution is approved and active.
    const institutionResponse = await restGet(
      auth,
      `institutions?select=id&id=eq.${encodeURIComponent(
        institutionId
      )}&verification_status=eq.approved&is_active=eq.true&limit=1`
    );

    if (!institutionResponse.ok) {
      return NextResponse.json(
        { error: "Unable to verify institution" },
        { status: 500 }
      );
    }

    const institutionData = await institutionResponse.json();

    if (!Array.isArray(institutionData) || institutionData.length === 0) {
      return NextResponse.json(
        { error: "Institution is unavailable for admission inquiries" },
        { status: 404 }
      );
    }

    // Verify that the campus belongs to this institution.
    if (campusId) {
      const campusResponse = await restGet(
        auth,
        `institution_campuses?select=id&id=eq.${encodeURIComponent(
          campusId
        )}&institution_id=eq.${encodeURIComponent(
          institutionId
        )}&is_active=eq.true&limit=1`
      );

      if (!campusResponse.ok) {
        return NextResponse.json(
          { error: "Unable to verify campus" },
          { status: 500 }
        );
      }

      const campusData = await campusResponse.json();

      if (!Array.isArray(campusData) || campusData.length === 0) {
        return NextResponse.json(
          { error: "Campus does not belong to this institution" },
          { status: 400 }
        );
      }
    }

    // Verify that the program belongs to this institution.
    if (programId) {
      const programResponse = await restGet(
        auth,
        `institution_programs?select=id,campus_id&id=eq.${encodeURIComponent(
          programId
        )}&institution_id=eq.${encodeURIComponent(
          institutionId
        )}&is_active=eq.true&limit=1`
      );

      if (!programResponse.ok) {
        return NextResponse.json(
          { error: "Unable to verify program" },
          { status: 500 }
        );
      }

      const programData = await programResponse.json();

      if (!Array.isArray(programData) || programData.length === 0) {
        return NextResponse.json(
          { error: "Program does not belong to this institution or is inactive" },
          { status: 400 }
        );
      }

      const programCampusId = programData[0].campus_id;

      if (programCampusId && programCampusId !== campusId) {
        return NextResponse.json(
          { error: "Please select the campus assigned to this program" },
          { status: 400 }
        );
      }
    }

    const inquiry = {
      institution_id: institutionId,
      campus_id: campusId,
      program_id: programId,
      student_user_id: auth.user.id || null,
      student_name: studentName,
      student_email: studentEmail,
      student_phone: studentPhone,
      message,
      status: "new",
      admin_notes: null,
    };

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_inquiries`,
      {
        method: "POST",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(inquiry),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to submit admission inquiry" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        message: "Admission inquiry submitted successfully",
        inquiry: data[0],
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while submitting the inquiry" },
      { status: 500 }
    );
  }
}

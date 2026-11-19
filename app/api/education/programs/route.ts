
import { NextRequest, NextResponse } from "next/server";

const PROGRAM_TYPES = ["school_class", "course", "degree"];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AuthContext = {
  supabaseUrl: string;
  supabaseKey: string;
  token: string;
  user: { id: string };
};

async function verifyUser(
  request: NextRequest
): Promise<AuthContext | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get("authorization");

  if (!supabaseUrl || !supabaseKey) return null;
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice(7).trim();
  if (!token) return null;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const user = await response.json();
  if (!user?.id) return null;

  return { supabaseUrl, supabaseKey, token, user };
}

function optionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return null;

  const result = String(value).trim();
  return result ? result.slice(0, maxLength) : null;
}

function parseFee(value: unknown): number | null | undefined {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 9999999999) {
    return undefined;
  }

  return parsed;
}

async function readBody(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }

    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function verifyInstitutionOwnership(
  auth: AuthContext,
  institutionId: string
) {
  const response = await fetch(
    `${auth.supabaseUrl}/rest/v1/institutions?select=id&id=eq.${encodeURIComponent(institutionId)}&owner_user_id=eq.${encodeURIComponent(auth.user.id)}&limit=1`,
    {
      headers: {
        apikey: auth.supabaseKey,
        Authorization: `Bearer ${auth.token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return false;

  const data = await response.json();
  return Array.isArray(data) && data.length > 0;
}

async function verifyCampusBelongsToInstitution(
  auth: AuthContext,
  campusId: string,
  institutionId: string
) {
  const response = await fetch(
    `${auth.supabaseUrl}/rest/v1/institution_campuses?select=id&id=eq.${encodeURIComponent(campusId)}&institution_id=eq.${encodeURIComponent(institutionId)}&limit=1`,
    {
      headers: {
        apikey: auth.supabaseKey,
        Authorization: `Bearer ${auth.token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return false;

  const data = await response.json();
  return Array.isArray(data) && data.length > 0;
}

async function verifyProgramBelongsToInstitution(
  auth: AuthContext,
  programId: string,
  institutionId: string
) {
  const response = await fetch(
    `${auth.supabaseUrl}/rest/v1/institution_programs?select=id&id=eq.${encodeURIComponent(programId)}&institution_id=eq.${encodeURIComponent(institutionId)}&limit=1`,
    {
      headers: {
        apikey: auth.supabaseKey,
        Authorization: `Bearer ${auth.token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return false;

  const data = await response.json();
  return Array.isArray(data) && data.length > 0;
}

async function updateProgram(
  auth: AuthContext,
  programId: string,
  institutionId: string,
  updates: Record<string, unknown>
) {
  const response = await fetch(
    `${auth.supabaseUrl}/rest/v1/institution_programs?id=eq.${encodeURIComponent(programId)}&institution_id=eq.${encodeURIComponent(institutionId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: auth.supabaseKey,
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updates),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      program: null,
    };
  }

  return {
    success: true,
    status: 200,
    program: Array.isArray(data) ? data[0] : null,
  };
}

// GET: List programs belonging to the authenticated institution owner.
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUser(request);

    if (!auth) {
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

    if (!(await verifyInstitutionOwnership(auth, institutionId))) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_programs?select=*&institution_id=eq.${encodeURIComponent(institutionId)}&order=created_at.desc`,
      {
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.token}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to load institution programs" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      programs: Array.isArray(data) ? data : [],
    });
  } catch {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }
}

// POST: Add a class, course or degree program.
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Please login before adding a program" },
        { status: 401 }
      );
    }

    const body = await readBody(request);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON request" },
        { status: 400 }
      );
    }

    const institutionId = String(body.institution_id || "").trim();
    const campusId = optionalText(body.campus_id, 100);
    const programType = String(body.program_type || "").trim();
    const programName = String(body.program_name || "").trim();

    if (!UUID_PATTERN.test(institutionId)) {
      return NextResponse.json(
        { error: "A valid institution ID is required" },
        { status: 400 }
      );
    }

    if (
      !programName ||
      programName.length > 200 ||
      !PROGRAM_TYPES.includes(programType)
    ) {
      return NextResponse.json(
        { error: "Valid program name and type are required" },
        { status: 400 }
      );
    }

    if (campusId && !UUID_PATTERN.test(campusId)) {
      return NextResponse.json(
        { error: "Invalid campus ID" },
        { status: 400 }
      );
    }

    const feeMin = parseFee(body.fee_min);
    const feeMax = parseFee(body.fee_max);

    if (feeMin === undefined || feeMax === undefined) {
      return NextResponse.json(
        { error: "Fees must be valid non-negative numbers" },
        { status: 400 }
      );
    }

    if (feeMin !== null && feeMax !== null && feeMax < feeMin) {
      return NextResponse.json(
        { error: "Maximum fee cannot be less than minimum fee" },
        { status: 400 }
      );
    }

    if (!(await verifyInstitutionOwnership(auth, institutionId))) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    if (
      campusId &&
      !(await verifyCampusBelongsToInstitution(
        auth,
        campusId,
        institutionId
      ))
    ) {
      return NextResponse.json(
        { error: "Campus does not belong to this institution" },
        { status: 400 }
      );
    }

    const program = {
      institution_id: institutionId,
      campus_id: campusId,
      program_type: programType,
      program_name: programName,
      description: optionalText(body.description, 5000),
      eligibility: optionalText(body.eligibility, 2000),
      fee_min: feeMin,
      fee_max: feeMax,
      duration: optionalText(body.duration, 100),
      admission_open: body.admission_open === true,
      is_active: true,
    };

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_programs`,
      {
        method: "POST",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(program),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok || !data?.[0]?.id) {
      return NextResponse.json(
        { error: "Unable to create institution program" },
        { status: response.ok ? 500 : response.status }
      );
    }

    return NextResponse.json(
      {
        message: "Program added successfully",
        program: data[0],
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while creating the program" },
      { status: 500 }
    );
  }
}

// PATCH: Edit a program or change its active/admission status.
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Please login with a valid account" },
        { status: 401 }
      );
    }

    const body = await readBody(request);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON request" },
        { status: 400 }
      );
    }

    const programId = String(body.program_id || "").trim();
    const institutionId = String(body.institution_id || "").trim();

    if (
      !UUID_PATTERN.test(programId) ||
      !UUID_PATTERN.test(institutionId)
    ) {
      return NextResponse.json(
        { error: "Valid program and institution IDs are required" },
        { status: 400 }
      );
    }

    if (!(await verifyInstitutionOwnership(auth, institutionId))) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    if (
      !(await verifyProgramBelongsToInstitution(
        auth,
        programId,
        institutionId
      ))
    ) {
      return NextResponse.json(
        { error: "Program not found or access denied" },
        { status: 404 }
      );
    }

    // Status-only updates.
    if (typeof body.is_active === "boolean" &&
        body.program_name === undefined &&
        body.program_type === undefined) {
      const result = await updateProgram(
        auth,
        programId,
        institutionId,
        { is_active: body.is_active }
      );

      if (!result.success || !result.program) {
        return NextResponse.json(
          { error: "Unable to update program status" },
          { status: result.status }
        );
      }

      return NextResponse.json({
        message: "Program status updated successfully",
        program: result.program,
      });
    }

    const programName = String(body.program_name || "").trim();
    const programType = String(body.program_type || "").trim();
    const campusId = optionalText(body.campus_id, 100);

    if (
      !programName ||
      programName.length > 200 ||
      !PROGRAM_TYPES.includes(programType)
    ) {
      return NextResponse.json(
        { error: "Valid program name and type are required" },
        { status: 400 }
      );
    }

    if (campusId && !UUID_PATTERN.test(campusId)) {
      return NextResponse.json(
        { error: "Invalid campus ID" },
        { status: 400 }
      );
    }

    if (
      campusId &&
      !(await verifyCampusBelongsToInstitution(
        auth,
        campusId,
        institutionId
      ))
    ) {
      return NextResponse.json(
        { error: "Campus does not belong to this institution" },
        { status: 400 }
      );
    }

    const feeMin = parseFee(body.fee_min);
    const feeMax = parseFee(body.fee_max);

    if (feeMin === undefined || feeMax === undefined) {
      return NextResponse.json(
        { error: "Fees must be valid non-negative numbers" },
        { status: 400 }
      );
    }

    if (feeMin !== null && feeMax !== null && feeMax < feeMin) {
      return NextResponse.json(
        { error: "Maximum fee cannot be less than minimum fee" },
        { status: 400 }
      );
    }

    const updates = {
      campus_id: campusId,
      program_type: programType,
      program_name: programName,
      description: optionalText(body.description, 5000),
      eligibility: optionalText(body.eligibility, 2000),
      fee_min: feeMin,
      fee_max: feeMax,
      duration: optionalText(body.duration, 100),
      admission_open: body.admission_open === true,
    };

    const result = await updateProgram(
      auth,
      programId,
      institutionId,
      updates
    );

    if (!result.success || !result.program) {
      return NextResponse.json(
        { error: "Unable to update institution program" },
        { status: result.status }
      );
    }

    return NextResponse.json({
      message: "Program updated successfully",
      program: result.program,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while updating the program" },
      { status: 500 }
    );
  }
}

// DELETE: Permanently delete a program owned by the authenticated user.
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Please login with a valid account" },
        { status: 401 }
      );
    }

    const body = await readBody(request);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON request" },
        { status: 400 }
      );
    }

    const programId = String(body.program_id || "").trim();
    const institutionId = String(body.institution_id || "").trim();

    if (
      !UUID_PATTERN.test(programId) ||
      !UUID_PATTERN.test(institutionId)
    ) {
      return NextResponse.json(
        { error: "Valid program and institution IDs are required" },
        { status: 400 }
      );
    }

    if (!(await verifyInstitutionOwnership(auth, institutionId))) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    if (
      !(await verifyProgramBelongsToInstitution(
        auth,
        programId,
        institutionId
      ))
    ) {
      return NextResponse.json(
        { error: "Program not found or access denied" },
        { status: 404 }
      );
    }

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_programs?id=eq.${encodeURIComponent(programId)}&institution_id=eq.${encodeURIComponent(institutionId)}`,
      {
        method: "DELETE",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.token}`,
          Prefer: "return=representation",
        },
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to delete institution program" },
        { status: response.status }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Program could not be found or deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Program deleted successfully",
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while deleting the program" },
      { status: 500 }
    );
  }
}

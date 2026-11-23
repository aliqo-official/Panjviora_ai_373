
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const PROGRAM_TYPES = ["school_class", "course", "degree"];

const REQUEST_TIMEOUT_MS = 15000;

type AuthUser = {
  id: string;
  email?: string;
};

type AuthContext = {
  accessToken: string;
  user: AuthUser;
};

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function optionalText(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;

  const cleaned = value.trim();
  if (!cleaned) return null;
  if (cleaned.length > maxLength) return undefined;

  return cleaned;
}

function parseFee(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);

  if (
    !Number.isFinite(numberValue) ||
    numberValue < 0 ||
    numberValue > 9999999999
  ) {
    return undefined;
  }

  return numberValue;
}

async function verifyUser(
  request: NextRequest
): Promise<AuthContext | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const accessToken = authorization.slice(7).trim();

  if (!accessToken || accessToken.length > 8192) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const user = await response.json();

    if (!user?.id || !isUuid(user.id)) return null;

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch {
    return null;
  }
}

function supabaseHeaders(
  auth: AuthContext,
  extra?: Record<string, string>
) {
  return {
    apikey: SUPABASE_KEY!,
    Authorization: `Bearer ${auth.accessToken}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

// Server-side ownership verification using service_role.
async function verifyInstitutionOwnership(
  auth: AuthContext,
  institutionId: string
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Institution ownership verification is not configured."
    );
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/institutions?select=id&owner_user_id=eq.${encodeURIComponent(
      auth.user.id
    )}&id=eq.${encodeURIComponent(institutionId)}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    throw new Error("Institution ownership verification failed.");
  }

  const data = await response.json();

  return Array.isArray(data) && data.length > 0;
}

async function verifyCampusBelongsToInstitution(
  auth: AuthContext,
  campusId: string,
  institutionId: string
) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/institution_campuses?select=id&institution_id=eq.${encodeURIComponent(
      institutionId
    )}&id=eq.${encodeURIComponent(campusId)}&limit=1`,
    {
      headers: supabaseHeaders(auth),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) return false;

  const data = await response.json();
  return Array.isArray(data) && data.length > 0;
}

async function getExistingProgram(
  auth: AuthContext,
  institutionId: string,
  programId: string
) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/institution_programs?select=*&institution_id=eq.${encodeURIComponent(
      institutionId
    )}&id=eq.${encodeURIComponent(programId)}&limit=1`,
    {
      headers: supabaseHeaders(auth),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  return Array.isArray(data) && data.length ? data[0] : null;
}

// Checks duplicate names within the same institution,
// program type and campus. Returns null if verification fails.
async function checkDuplicateProgramName(
  institutionId: string,
  programType: string,
  campusId: string | null,
  programName: string,
  excludeProgramId?: string
): Promise<boolean | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/institution_programs?select=id,program_type,program_name,campus_id&institution_id=eq.${encodeURIComponent(
        institutionId
      )}`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    if (!response.ok) return null;

    const programs = await response.json();

    if (!Array.isArray(programs)) return null;

    const normalizedName = programName.trim().toLowerCase();

    return programs.some((program) => {
      if (program.id === excludeProgramId) return false;

      return (
        program.program_type === programType &&
        program.campus_id === campusId &&
        typeof program.program_name === "string" &&
        program.program_name.trim().toLowerCase() === normalizedName
      );
    });
  } catch {
    return null;
  }
}

// Checks whether any admission inquiry is linked to this program.
// Uses program_id directly to match the database foreign key.
// Returns null if the check cannot be completed.
async function checkLinkedInquiries(
  programId: string
): Promise<boolean | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/institution_inquiries?select=id&program_id=eq.${encodeURIComponent(
        programId
      )}&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    if (!response.ok) return null;

    const inquiries = await response.json();

    if (!Array.isArray(inquiries)) return null;

    return inquiries.length > 0;
  } catch {
    return null;
  }
}

function validateFeeRange(
  min: number | null,
  max: number | null
) {
  return min !== null && max !== null && max < min;
}

export async function GET(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return errorResponse("Server configuration is missing.", 500);
    }

    const auth = await verifyUser(request);

    if (!auth) {
      return errorResponse("Please log in again.", 401);
    }

    const institutionId =
      request.nextUrl.searchParams.get("institution_id");

    if (!isUuid(institutionId)) {
      return errorResponse("Valid institution ID is required.");
    }

    const isOwner = await verifyInstitutionOwnership(
      auth,
      institutionId
    );

    if (!isOwner) {
      return errorResponse(
        "You are not authorized to access this institution.",
        403
      );
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/institution_programs?select=*&institution_id=eq.${encodeURIComponent(
        institutionId
      )}&order=created_at.desc`,
      {
        headers: supabaseHeaders(auth),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || "Unable to load programs." },
        { status: response.status }
      );
    }

    return NextResponse.json({ programs: data });
  } catch {
    return errorResponse("An unexpected error occurred.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return errorResponse("Server configuration is missing.", 500);
    }

    const auth = await verifyUser(request);

    if (!auth) {
      return errorResponse("Please log in again.", 401);
    }

    const body = await request.json();

    const {
      institution_id,
      campus_id,
      program_type,
      program_name,
      description,
      eligibility,
      fee_min,
      fee_max,
      duration,
      admission_open,
    } = body;

    if (!isUuid(institution_id)) {
      return errorResponse("Valid institution ID is required.");
    }

    if (
      campus_id !== null &&
      campus_id !== undefined &&
      campus_id !== "" &&
      !isUuid(campus_id)
    ) {
      return errorResponse("Invalid campus selection.");
    }

    if (!PROGRAM_TYPES.includes(program_type)) {
      return errorResponse("Select a valid program type.");
    }

    const cleanName = optionalText(program_name, 200);

    if (!cleanName) {
      return errorResponse(
        "Program name is required (maximum 200 characters)."
      );
    }

    const cleanDescription = optionalText(description, 5000);
    const cleanEligibility = optionalText(eligibility, 2000);
    const cleanDuration = optionalText(duration, 100);

    if (
      cleanDescription === undefined ||
      cleanEligibility === undefined ||
      cleanDuration === undefined
    ) {
      return errorResponse(
        "One or more text fields are invalid or too long."
      );
    }

    const minFee = parseFee(fee_min);
    const maxFee = parseFee(fee_max);

    if (minFee === undefined || maxFee === undefined) {
      return errorResponse(
        "Please enter valid, non-negative fee amounts."
      );
    }

    if (validateFeeRange(minFee, maxFee)) {
      return errorResponse(
        "Maximum fee cannot be less than minimum fee."
      );
    }

    if (
      admission_open !== undefined &&
      typeof admission_open !== "boolean"
    ) {
      return errorResponse("Invalid admission status.");
    }

    const isOwner = await verifyInstitutionOwnership(
      auth,
      institution_id
    );

    if (!isOwner) {
      return errorResponse(
        "You are not authorized to manage this institution.",
        403
      );
    }

    let verifiedCampusId: string | null = null;

    if (campus_id) {
      const validCampus = await verifyCampusBelongsToInstitution(
        auth,
        campus_id,
        institution_id
      );

      if (!validCampus) {
        return errorResponse(
          "Selected campus does not belong to this institution."
        );
      }

      verifiedCampusId = campus_id;
    }

    const duplicateProgram = await checkDuplicateProgramName(
      institution_id,
      program_type,
      verifiedCampusId,
      cleanName
    );

    if (duplicateProgram === null) {
      return errorResponse(
        "Unable to verify duplicate program name. Please try again.",
        500
      );
    }

    if (duplicateProgram) {
      return errorResponse(
        "A program with this name already exists for this campus and program type.",
        409
      );
    }

    const payload = {
      institution_id,
      campus_id: verifiedCampusId,
      program_type,
      program_name: cleanName,
      description: cleanDescription,
      eligibility: cleanEligibility,
      fee_min: minFee,
      fee_max: maxFee,
      duration: cleanDuration,
      admission_open: admission_open ?? false,
      is_active: true,
    };

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/institution_programs`,
      {
        method: "POST",
        headers: supabaseHeaders(auth, {
          Prefer: "return=representation",
        }),
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || "Unable to create program." },
        { status: response.status }
      );
    }

    if (!Array.isArray(data) || !data[0]) {
      return errorResponse(
        "Program was not returned after creation.",
        500
      );
    }

    return NextResponse.json(
      {
        message: "Program created successfully.",
        program: data[0],
      },
      { status: 201 }
    );
  } catch {
    return errorResponse("An unexpected error occurred.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return errorResponse("Server configuration is missing.", 500);
    }

    const auth = await verifyUser(request);

    if (!auth) {
      return errorResponse("Please log in again.", 401);
    }

    const body = await request.json();

    const { program_id, institution_id } = body;

    if (!isUuid(program_id) || !isUuid(institution_id)) {
      return errorResponse(
        "Valid program and institution IDs are required."
      );
    }

    const isOwner = await verifyInstitutionOwnership(
      auth,
      institution_id
    );

    if (!isOwner) {
      return errorResponse(
        "You are not authorized to manage this institution.",
        403
      );
    }

    const existing = await getExistingProgram(
      auth,
      institution_id,
      program_id
    );

    if (!existing) {
      return errorResponse("Program not found.", 404);
    }

    const payload: Record<string, unknown> = {};

    if ("program_type" in body) {
      if (!PROGRAM_TYPES.includes(body.program_type)) {
        return errorResponse("Select a valid program type.");
      }

      payload.program_type = body.program_type;
    }

    if ("program_name" in body) {
      const name = optionalText(body.program_name, 200);

      if (!name) {
        return errorResponse(
          "Program name is required (maximum 200 characters)."
        );
      }

      payload.program_name = name;
    }

    if ("description" in body) {
      const value = optionalText(body.description, 5000);

      if (value === undefined) {
        return errorResponse("Invalid description.");
      }

      payload.description = value;
    }

    if ("eligibility" in body) {
      const value = optionalText(body.eligibility, 2000);

      if (value === undefined) {
        return errorResponse("Invalid eligibility details.");
      }

      payload.eligibility = value;
    }

    if ("duration" in body) {
      const value = optionalText(body.duration, 100);

      if (value === undefined) {
        return errorResponse("Invalid duration.");
      }

      payload.duration = value;
    }

    if ("fee_min" in body) {
      const value = parseFee(body.fee_min);

      if (value === undefined) {
        return errorResponse("Invalid minimum fee.");
      }

      payload.fee_min = value;
    }

    if ("fee_max" in body) {
      const value = parseFee(body.fee_max);

      if (value === undefined) {
        return errorResponse("Invalid maximum fee.");
      }

      payload.fee_max = value;
    }

    if ("admission_open" in body) {
      if (typeof body.admission_open !== "boolean") {
        return errorResponse("Invalid admission status.");
      }

      payload.admission_open = body.admission_open;
    }

    if ("is_active" in body) {
      if (typeof body.is_active !== "boolean") {
        return errorResponse("Invalid program status.");
      }

      payload.is_active = body.is_active;
    }

    if ("campus_id" in body) {
      if (body.campus_id === null || body.campus_id === "") {
        payload.campus_id = null;
      } else {
        if (!isUuid(body.campus_id)) {
          return errorResponse("Invalid campus selection.");
        }

        const validCampus = await verifyCampusBelongsToInstitution(
          auth,
          body.campus_id,
          institution_id
        );

        if (!validCampus) {
          return errorResponse(
            "Selected campus does not belong to this institution."
          );
        }

        payload.campus_id = body.campus_id;
      }
    }

    if (Object.keys(payload).length === 0) {
      return errorResponse("No valid changes were provided.");
    }

    const finalMin =
      "fee_min" in payload
        ? (payload.fee_min as number | null)
        : existing.fee_min;

    const finalMax =
      "fee_max" in payload
        ? (payload.fee_max as number | null)
        : existing.fee_max;

    if (validateFeeRange(finalMin, finalMax)) {
      return errorResponse(
        "Maximum fee cannot be less than minimum fee."
      );
    }

    if (
      "program_name" in payload ||
      "program_type" in payload ||
      "campus_id" in payload
    ) {
      const finalName =
        (payload.program_name as string | undefined) ??
        existing.program_name;

      const finalType =
        (payload.program_type as string | undefined) ??
        existing.program_type;

      const finalCampusId =
        "campus_id" in payload
          ? (payload.campus_id as string | null)
          : existing.campus_id;

      const duplicateProgram = await checkDuplicateProgramName(
        institution_id,
        finalType,
        finalCampusId,
        finalName,
        program_id
      );

      if (duplicateProgram === null) {
        return errorResponse(
          "Unable to verify duplicate program name. Please try again.",
          500
        );
      }

      if (duplicateProgram) {
        return errorResponse(
          "A program with this name already exists for this campus and program type.",
          409
        );
      }
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/institution_programs?institution_id=eq.${encodeURIComponent(
        institution_id
      )}&id=eq.${encodeURIComponent(program_id)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders(auth, {
          Prefer: "return=representation",
        }),
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || "Unable to update program." },
        { status: response.status }
      );
    }

    if (!Array.isArray(data) || !data[0]) {
      return errorResponse(
        "Program update could not be confirmed.",
        404
      );
    }

    return NextResponse.json({
      message: "Program updated successfully.",
      program: data[0],
    });
  } catch {
    return errorResponse("An unexpected error occurred.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return errorResponse("Server configuration is missing.", 500);
    }

    const auth = await verifyUser(request);

    if (!auth) {
      return errorResponse("Please log in again.", 401);
    }

    const body = await request.json();
    const { program_id, institution_id } = body;

    if (!isUuid(program_id) || !isUuid(institution_id)) {
      return errorResponse(
        "Valid program and institution IDs are required."
      );
    }

    const isOwner = await verifyInstitutionOwnership(
      auth,
      institution_id
    );

    if (!isOwner) {
      return errorResponse(
        "You are not authorized to manage this institution.",
        403
      );
    }

    const existing = await getExistingProgram(
      auth,
      institution_id,
      program_id
    );

    if (!existing) {
      return errorResponse("Program not found.", 404);
    }

    // Protect programs that have admission inquiries.
    const hasLinkedInquiries = await checkLinkedInquiries(
      program_id
    );

    if (hasLinkedInquiries === null) {
      return errorResponse(
        "Unable to verify linked admission inquiries. Program was not deleted. Please try again.",
        500
      );
    }

    if (hasLinkedInquiries) {
      return errorResponse(
        "This program cannot be deleted because admission inquiries are linked to it. Deactivate the program instead to preserve student records.",
        409
      );
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/institution_programs?institution_id=eq.${encodeURIComponent(
        institution_id
      )}&id=eq.${encodeURIComponent(program_id)}`,
      {
        method: "DELETE",
        headers: supabaseHeaders(auth, {
          Prefer: "return=representation",
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    let data: any = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      // PostgreSQL foreign-key violation.
      // This is an additional protection if an inquiry is linked
      // after the application-level check.
      if (data?.code === "23503") {
        return errorResponse(
          "This program cannot be deleted because admission inquiries are linked to it. Deactivate the program instead to preserve student records.",
          409
        );
      }

      return NextResponse.json(
        { error: data?.message || "Unable to delete program." },
        { status: response.status }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return errorResponse(
        "Program deletion could not be confirmed.",
        404
      );
    }

    return NextResponse.json({
      message: "Program deleted successfully.",
    });
  } catch {
    return errorResponse("An unexpected error occurred.", 500);
  }
}

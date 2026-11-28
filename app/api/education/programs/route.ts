
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const PROGRAM_TYPES = ["school_class", "course", "degree"];

const REQUEST_TIMEOUT_MS = 15000;
const MAX_BODY_BYTES = 10_000;

type AuthUser = {
  id: string;
  email?: string;
};

type AuthContext = {
  accessToken: string;
  user: AuthUser;
};

type JsonObject = Record<string, unknown>;

type BodyResult =
  | { ok: true; data: JsonObject }
  | { ok: false; message: string };

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isObject(value: unknown): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
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
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return undefined;
  }

  if (typeof value === "string" && !value.trim()) {
    return null;
  }

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

function validateFeeRange(
  min: number | null,
  max: number | null
) {
  return min !== null && max !== null && max < min;
}

// Reads JSON safely and enforces the body limit while streaming.
async function readJsonBody(
  request: NextRequest
): Promise<BodyResult> {
  const contentType = request.headers.get("content-type") || "";

  if (!/^application\/(json|[a-z0-9.+-]+\+json)(?:\s*;|$)/i.test(contentType)) {
    return {
      ok: false,
      message: "A valid JSON request is required.",
    };
  }

  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      return {
        ok: false,
        message: "Invalid request size.",
      };
    }

    if (Number(contentLength) > MAX_BODY_BYTES) {
      return {
        ok: false,
        message: "Request body is too large.",
      };
    }
  }

  if (!request.body) {
    return {
      ok: false,
      message: "Request body is required.",
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();

        return {
          ok: false,
          message: "Request body is too large.",
        };
      }

      chunks.push(value);
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const decoder = new TextDecoder("utf-8", {
      fatal: true,
    });

    const text = decoder.decode(combined);

    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        ok: false,
        message: "Invalid JSON request body.",
      };
    }

    if (!isObject(parsed)) {
      return {
        ok: false,
        message: "Invalid request data.",
      };
    }

    return {
      ok: true,
      data: parsed,
    };
  } catch {
    return {
      ok: false,
      message: "Unable to read request body.",
    };
  } finally {
    reader.releaseLock();
  }
}

// Identifies PostgreSQL/PostgREST database error codes.
function hasDatabaseErrorCode(
  value: unknown,
  code: string
): boolean {
  return (
    isObject(value) &&
    value.code === code
  );
}

async function verifyUser(
  request: NextRequest
): Promise<AuthContext | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) return null;

  const accessToken = authorization.slice(7).trim();

  if (!accessToken || accessToken.length > 8192) {
    return null;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    if (!response.ok) return null;

    const user = await parseJson(response);

    if (!isObject(user) || !isUuid(user.id)) {
      return null;
    }

    return {
      accessToken,
      user: {
        id: user.id,
        email:
          typeof user.email === "string"
            ? user.email
            : undefined,
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

// Server-side institution ownership verification.
async function verifyInstitutionOwnership(
  auth: AuthContext,
  institutionId: string
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Ownership verification unavailable.");
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
    throw new Error("Ownership verification failed.");
  }

  const data = await parseJson(response);

  return Array.isArray(data) && data.length > 0;
}

// A campus must belong to the institution AND be active.
async function verifyActiveCampusBelongsToInstitution(
  auth: AuthContext,
  campusId: string,
  institutionId: string
): Promise<boolean> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/institution_campuses?select=id,is_active&institution_id=eq.${encodeURIComponent(
      institutionId
    )}&id=eq.${encodeURIComponent(campusId)}&limit=1`,
    {
      headers: supabaseHeaders(auth),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    throw new Error("Campus verification failed.");
  }

  const data = await parseJson(response);

  return (
    Array.isArray(data) &&
    data.length > 0 &&
    isObject(data[0]) &&
    data[0].is_active === true
  );
}

async function getExistingProgram(
  auth: AuthContext,
  institutionId: string,
  programId: string
): Promise<JsonObject | null> {
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

  if (!response.ok) {
    throw new Error("Program lookup failed.");
  }

  const data = await parseJson(response);

  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    !isObject(data[0])
  ) {
    return null;
  }

  return data[0];
}

// Checks whether an admission inquiry is linked to a program.
async function checkLinkedInquiries(
  programId: string
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Inquiry verification unavailable.");
  }

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

  if (!response.ok) {
    throw new Error("Inquiry verification failed.");
  }

  const inquiries = await parseJson(response);

  if (!Array.isArray(inquiries)) {
    throw new Error("Invalid inquiry response.");
  }

  return inquiries.length > 0;
}

export async function GET(request: NextRequest) {
  try {
    if (
      !SUPABASE_URL ||
      !SUPABASE_KEY ||
      !SUPABASE_SERVICE_ROLE_KEY
    ) {
      return errorResponse(
        "Server configuration is missing.",
        500
      );
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

    if (!response.ok) {
      return errorResponse("Unable to load programs.", 502);
    }

    const data = await parseJson(response);

    if (!Array.isArray(data)) {
      return errorResponse("Invalid programs response.", 502);
    }

    return NextResponse.json({ programs: data });
  } catch {
    return errorResponse(
      "Unable to load programs. Please try again.",
      502
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (
      !SUPABASE_URL ||
      !SUPABASE_KEY ||
      !SUPABASE_SERVICE_ROLE_KEY
    ) {
      return errorResponse(
        "Server configuration is missing.",
        500
      );
    }

    const auth = await verifyUser(request);

    if (!auth) {
      return errorResponse("Please log in again.", 401);
    }

    const parsedBody = await readJsonBody(request);

    if (!parsedBody.ok) {
      return errorResponse(parsedBody.message, 400);
    }

    const body = parsedBody.data;

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

    if (
      typeof program_type !== "string" ||
      !PROGRAM_TYPES.includes(program_type)
    ) {
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
      const validCampus =
        await verifyActiveCampusBelongsToInstitution(
          auth,
          campus_id,
          institution_id
        );

      if (!validCampus) {
        return errorResponse(
          "Selected campus must be active and belong to this institution."
        );
      }

      verifiedCampusId = campus_id;
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

    const data = await parseJson(response);

    if (!response.ok) {
      if (hasDatabaseErrorCode(data, "23505")) {
        return errorResponse(
          "A program with this name already exists for this campus and program type.",
          409
        );
      }

      return errorResponse("Unable to create program.", 502);
    }

    if (
      !Array.isArray(data) ||
      !data[0] ||
      !isObject(data[0])
    ) {
      return errorResponse(
        "Program creation could not be confirmed.",
        502
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
    return errorResponse(
      "Unable to create program. Please try again.",
      500
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (
      !SUPABASE_URL ||
      !SUPABASE_KEY ||
      !SUPABASE_SERVICE_ROLE_KEY
    ) {
      return errorResponse(
        "Server configuration is missing.",
        500
      );
    }

    const auth = await verifyUser(request);

    if (!auth) {
      return errorResponse("Please log in again.", 401);
    }

    const parsedBody = await readJsonBody(request);

    if (!parsedBody.ok) {
      return errorResponse(parsedBody.message, 400);
    }

    const body = parsedBody.data;

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

    const payload: JsonObject = {};

    if ("program_type" in body) {
      if (
        typeof body.program_type !== "string" ||
        !PROGRAM_TYPES.includes(body.program_type)
      ) {
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

        const validCampus =
          await verifyActiveCampusBelongsToInstitution(
            auth,
            body.campus_id,
            institution_id
          );

        if (!validCampus) {
          return errorResponse(
            "Selected campus must be active and belong to this institution."
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
        : (existing.fee_min as number | null);

    const finalMax =
      "fee_max" in payload
        ? (payload.fee_max as number | null)
        : (existing.fee_max as number | null);

    if (validateFeeRange(finalMin, finalMax)) {
      return errorResponse(
        "Maximum fee cannot be less than minimum fee."
      );
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

    const data = await parseJson(response);

    if (!response.ok) {
      if (hasDatabaseErrorCode(data, "23505")) {
        return errorResponse(
          "A program with this name already exists for this campus and program type.",
          409
        );
      }

      return errorResponse("Unable to update program.", 502);
    }

    if (
      !Array.isArray(data) ||
      !data[0] ||
      !isObject(data[0])
    ) {
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
    return errorResponse(
      "Unable to update program. Please try again.",
      500
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (
      !SUPABASE_URL ||
      !SUPABASE_KEY ||
      !SUPABASE_SERVICE_ROLE_KEY
    ) {
      return errorResponse(
        "Server configuration is missing.",
        500
      );
    }

    const auth = await verifyUser(request);

    if (!auth) {
      return errorResponse("Please log in again.", 401);
    }

    const parsedBody = await readJsonBody(request);

    if (!parsedBody.ok) {
      return errorResponse(parsedBody.message, 400);
    }

    const { program_id, institution_id } = parsedBody.data;

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

    const hasLinkedInquiries = await checkLinkedInquiries(
      program_id
    );

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

    const data = await parseJson(response);

    if (!response.ok) {
      if (hasDatabaseErrorCode(data, "23503")) {
        return errorResponse(
          "This program cannot be deleted because admission inquiries are linked to it. Deactivate the program instead to preserve student records.",
          409
        );
      }

      return errorResponse("Unable to delete program.", 502);
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
    return errorResponse(
      "Unable to delete program. Please try again.",
      500
    );
  }
}


import { NextRequest, NextResponse } from "next/server";

const REQUEST_TIMEOUT = 15_000;
const MAX_BODY_BYTES = 10_000;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AuthData = {
  supabaseUrl: string;
  supabaseKey: string;
  serviceRoleKey: string;
  token: string;
  user: {
    id: string;
  };
};

async function parseJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
async function isUniqueViolation(
  response: Response
): Promise<boolean> {
  const error = await parseJson(response);

  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "23505"
  );
}
async function verifyUser(
  request: NextRequest
): Promise<AuthData | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const authorization = request.headers.get("authorization");

    if (!supabaseUrl || !supabaseKey || !serviceRoleKey) return null;
    if (!authorization?.startsWith("Bearer ")) return null;

    const token = authorization.slice(7).trim();
    if (!token) return null;

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!response.ok) return null;

  const user: unknown = await parseJson(response);

    if (
      !user ||
      typeof user !== "object" ||
      !("id" in user) ||
      typeof user.id !== "string" ||
      !user.id
    ) {
      return null;
    }

    return {
      supabaseUrl,
      supabaseKey,
      serviceRoleKey,
      token,
      user: { id: user.id },
    };
  } catch {
    return null;
  }
}

function optionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;

  const result = value.trim();
  return result ? result.slice(0, maxLength) : null;
}

function validEmail(email: string | null) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function readBody(request: NextRequest) {
  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    const declaredLength = Number(contentLength);

    if (
      !Number.isSafeInteger(declaredLength) ||
      declaredLength < 0
    ) {
      return { error: "Invalid request body size" };
    }

    if (declaredLength > MAX_BODY_BYTES) {
      return { error: "Request body is too large" };
    }
  }

  if (!request.body) {
    return { error: "Request body is empty" };
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
        return { error: "Request body is too large" };
      }

      chunks.push(value);
    }

    if (totalBytes === 0) {
      return { error: "Request body is empty" };
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    let raw: string;

    try {
      raw = new TextDecoder("utf-8", {
        fatal: true,
      }).decode(combined);
    } catch {
      return { error: "Invalid request encoding" };
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return { error: "Invalid request data" };
      }

      return {
        body: parsed as Record<string, unknown>,
      };
    } catch {
      return { error: "Invalid JSON request" };
    }
  } catch {
    return { error: "Unable to read request body" };
  } finally {
    reader.releaseLock();
  }
}

// Verify institution ownership using the server-side service role.
// User identity is independently verified through Supabase Auth.

async function verifyInstitutionOwnership(
  auth: AuthData,
  institutionId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institutions?select=id&id=eq.${encodeURIComponent(institutionId)}&owner_user_id=eq.${encodeURIComponent(auth.user.id)}&limit=1`,
      {
        headers: {
          apikey: auth.serviceRoleKey,
          Authorization: `Bearer ${auth.serviceRoleKey}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }
    );

    if (!response.ok) return false;

    const data = await parseJson(response);

    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

// Check duplicate campus names within the same institution.
// Returns null if the database check fails.

async function campusNameExists(
  auth: AuthData,
  institutionId: string,
  campusName: string,
  excludeCampusId?: string
): Promise<boolean | null> {
  try {
    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_campuses?select=id,campus_name&institution_id=eq.${encodeURIComponent(institutionId)}`,
      {
        headers: {
          apikey: auth.serviceRoleKey,
          Authorization: `Bearer ${auth.serviceRoleKey}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }
    );

    if (!response.ok) return null;

    const campuses = await parseJson(response);

    if (!Array.isArray(campuses)) return null;

    const normalizedName = campusName.trim().toLowerCase();

    return campuses.some((campus) => {
      if (!campus || typeof campus !== "object") return false;

      if (excludeCampusId && campus.id === excludeCampusId) {
        return false;
      }

      return (
        typeof campus.campus_name === "string" &&
        campus.campus_name.trim().toLowerCase() === normalizedName
      );
    });
  } catch {
    return null;
  }
}

// Check whether programs or admission inquiries are linked to a campus.
// Returns null if either database query fails.

async function campusHasLinkedRecords(
  auth: AuthData,
  campusId: string
): Promise<boolean | null> {
  try {
    const encodedCampusId = encodeURIComponent(campusId);

    const headers = {
      apikey: auth.serviceRoleKey,
      Authorization: `Bearer ${auth.serviceRoleKey}`,
    };

    const [programsResponse, inquiriesResponse] = await Promise.all([
      fetch(
        `${auth.supabaseUrl}/rest/v1/institution_programs?select=id&campus_id=eq.${encodedCampusId}&limit=1`,
        {
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        }
      ),
      fetch(
        `${auth.supabaseUrl}/rest/v1/institution_inquiries?select=id&campus_id=eq.${encodedCampusId}&limit=1`,
        {
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        }
      ),
    ]);

    if (!programsResponse.ok || !inquiriesResponse.ok) {
      return null;
    }

    const [programs, inquiries] = await Promise.all([
      parseJson(programsResponse),
      parseJson(inquiriesResponse),
    ]);

    if (!Array.isArray(programs) || !Array.isArray(inquiries)) {
      return null;
    }

    return programs.length > 0 || inquiries.length > 0;
  } catch {
    return null;
  }
}

// GET: List campuses belonging to the owner's institution.

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

    if (!institutionId || !uuidPattern.test(institutionId)) {
      return NextResponse.json(
        { error: "A valid institution ID is required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyInstitutionOwnership(auth, institutionId);

    if (!isOwner) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_campuses?select=*&institution_id=eq.${encodeURIComponent(institutionId)}&order=created_at.desc`,
      {
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }
    );

 if (!response.ok) {
  return NextResponse.json(
    { error: "Unable to load campuses" },
    { status: 502 }
  );
}

    const data = await parseJson(response);

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Invalid campus data received" },
        { status: 502 }
      );
    }

    return NextResponse.json({ campuses: data });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to database" },
      { status: 500 }
    );
  }
}

// POST: Add a campus.

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Please login before adding a campus" },
        { status: 401 }
      );
    }

    const parsed = await readBody(request);

    if (!parsed.body) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 400 }
      );
    }

    const body = parsed.body;
    const institutionId = body.institution_id;
    const campusName = body.campus_name;
    const city = body.city;

    if (
      typeof institutionId !== "string" ||
      !uuidPattern.test(institutionId.trim()) ||
      typeof campusName !== "string" ||
      !campusName.trim() ||
      typeof city !== "string" ||
      !city.trim()
    ) {
      return NextResponse.json(
        { error: "Valid institution ID, campus name and city are required" },
        { status: 400 }
      );
    }

    if (campusName.trim().length > 200 || city.trim().length > 100) {
      return NextResponse.json(
        { error: "Campus name or city is too long" },
        { status: 400 }
      );
    }

    const normalizedInstitutionId = institutionId.trim();

    const isOwner = await verifyInstitutionOwnership(
      auth,
      normalizedInstitutionId
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    const duplicate = await campusNameExists(
      auth,
      normalizedInstitutionId,
      campusName.trim()
    );

    if (duplicate === null) {
      return NextResponse.json(
        { error: "Unable to verify campus name. Please try again." },
        { status: 500 }
      );
    }

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "A campus with this name already exists in your institution.",
        },
        { status: 409 }
      );
    }

    const campus = {
      institution_id: normalizedInstitutionId,
      campus_name: campusName.trim(),
      province: optionalText(body.province, 100),
      city: city.trim(),
      address: optionalText(body.address, 500),
      phone: optionalText(body.phone, 30),
      email: optionalText(body.email, 254),
      is_active: true,
    };

    if (!validEmail(campus.email)) {
      return NextResponse.json(
        { error: "Please enter a valid campus email" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_campuses`,
      {
        method: "POST",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(campus),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Campus registration failed" },
        { status: 502 }
      );
    }

    const data = await parseJson(response);

    if (!Array.isArray(data) || !data[0]) {
      return NextResponse.json(
        { error: "Invalid response received after campus registration" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        message: "Campus added successfully",
        campus: data[0],
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while adding campus" },
      { status: 500 }
    );
  }
}

// PATCH: Update an existing campus.

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Please login with a valid account" },
        { status: 401 }
      );
    }

    const parsed = await readBody(request);

    if (!parsed.body) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 400 }
      );
    }

    const body = parsed.body;
    const campusId = body.campus_id;
    const institutionId = body.institution_id;

    if (
      typeof campusId !== "string" ||
      !uuidPattern.test(campusId.trim()) ||
      typeof institutionId !== "string" ||
      !uuidPattern.test(institutionId.trim())
    ) {
      return NextResponse.json(
        { error: "Valid campus ID and institution ID are required" },
        { status: 400 }
      );
    }

    const normalizedCampusId = campusId.trim();
    const normalizedInstitutionId = institutionId.trim();

    const isOwner = await verifyInstitutionOwnership(
      auth,
      normalizedInstitutionId
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};

    if ("campus_name" in body) {
      if (
        typeof body.campus_name !== "string" ||
        !body.campus_name.trim() ||
        body.campus_name.trim().length > 200
      ) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid campus name (maximum 200 characters)",
          },
          { status: 400 }
        );
      }

      updates.campus_name = body.campus_name.trim();
    }

    if ("city" in body) {
      if (
        typeof body.city !== "string" ||
        !body.city.trim() ||
        body.city.trim().length > 100
      ) {
        return NextResponse.json(
          { error: "Please enter a valid city (maximum 100 characters)" },
          { status: 400 }
        );
      }

      updates.city = body.city.trim();
    }

    const optionalFields = [
      ["province", 100],
      ["address", 500],
      ["phone", 30],
      ["email", 254],
    ] as const;

    for (const [field, maxLength] of optionalFields) {
      if (field in body) {
        if (
          body[field] !== null &&
          typeof body[field] !== "string"
        ) {
          return NextResponse.json(
            { error: `Invalid ${field} value` },
            { status: 400 }
          );
        }

        const value = optionalText(body[field], maxLength);

        if (
          typeof body[field] === "string" &&
          body[field].trim().length > maxLength
        ) {
          return NextResponse.json(
            { error: `${field} is too long` },
            { status: 400 }
          );
        }

        updates[field] = value;
      }
    }

    if ("is_active" in body) {
      if (typeof body.is_active !== "boolean") {
        return NextResponse.json(
          { error: "is_active must be true or false" },
          { status: 400 }
        );
      }

      updates.is_active = body.is_active;
    }

    if (typeof updates.campus_name === "string") {
      const duplicate = await campusNameExists(
        auth,
        normalizedInstitutionId,
        updates.campus_name,
        normalizedCampusId
      );

      if (duplicate === null) {
        return NextResponse.json(
          { error: "Unable to verify campus name. Please try again." },
          { status: 500 }
        );
      }

      if (duplicate) {
        return NextResponse.json(
          {
            error:
              "A campus with this name already exists in your institution.",
          },
          { status: 409 }
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid campus changes were provided" },
        { status: 400 }
      );
    }

    if (
      "email" in updates &&
      !validEmail(updates.email as string | null)
    ) {
      return NextResponse.json(
        { error: "Please enter a valid campus email" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_campuses?id=eq.${encodeURIComponent(normalizedCampusId)}&institution_id=eq.${encodeURIComponent(normalizedInstitutionId)}`,
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
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }
    );

    if (!response.ok) {
  if (await isUniqueViolation(response)) {
    return NextResponse.json(
      {
        error:
          "A campus with this name already exists in your institution.",
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    { error: "Unable to update campus" },
    { status: 502 }
  );
}

    const data = await parseJson(response);

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Campus not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Campus updated successfully",
      campus: data[0],
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while updating campus" },
      { status: 500 }
    );
  }
}

// DELETE: Block deletion if programs or inquiries are linked to the campus.

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Please login with a valid account" },
        { status: 401 }
      );
    }

    const parsed = await readBody(request);

    if (!parsed.body) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 400 }
      );
    }

    const campusId = parsed.body.campus_id;
    const institutionId = parsed.body.institution_id;

    if (
      typeof campusId !== "string" ||
      !uuidPattern.test(campusId.trim()) ||
      typeof institutionId !== "string" ||
      !uuidPattern.test(institutionId.trim())
    ) {
      return NextResponse.json(
        { error: "Valid campus ID and institution ID are required" },
        { status: 400 }
      );
    }

    const normalizedCampusId = campusId.trim();
    const normalizedInstitutionId = institutionId.trim();

    const isOwner = await verifyInstitutionOwnership(
      auth,
      normalizedInstitutionId
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    // Confirm that this campus belongs to the supplied institution.

    const campusResponse = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_campuses?select=id&id=eq.${encodeURIComponent(normalizedCampusId)}&institution_id=eq.${encodeURIComponent(normalizedInstitutionId)}&limit=1`,
      {
        headers: {
          apikey: auth.serviceRoleKey,
          Authorization: `Bearer ${auth.serviceRoleKey}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }
    );

    if (!campusResponse.ok) {
      return NextResponse.json(
        { error: "Unable to verify campus ownership. Please try again." },
        { status: 502 }
      );
    }

    const campusData = await parseJson(campusResponse);

    if (!Array.isArray(campusData) || campusData.length === 0) {
      return NextResponse.json(
        { error: "Campus not found or access denied" },
        { status: 404 }
      );
    }

    const hasLinkedRecords = await campusHasLinkedRecords(
      auth,
      normalizedCampusId
    );

    if (hasLinkedRecords === null) {
      return NextResponse.json(
        {
          error:
            "Unable to verify linked campus records. Please try again.",
        },
        { status: 500 }
      );
    }

    if (hasLinkedRecords) {
      return NextResponse.json(
        {
          error:
            "This campus has linked programs or admission inquiries. Deactivate it instead to protect existing records.",
        },
        { status: 409 }
      );
    }

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_campuses?id=eq.${encodeURIComponent(normalizedCampusId)}&institution_id=eq.${encodeURIComponent(normalizedInstitutionId)}`,
      {
        method: "DELETE",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.token}`,
          Prefer: "return=representation",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to delete campus" },
        { status: 502 }
      );
    }

    const data = await parseJson(response);

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Campus not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Campus deleted successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while deleting campus" },
      { status: 500 }
    );
  }
}

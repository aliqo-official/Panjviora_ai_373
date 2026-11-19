
import { NextRequest, NextResponse } from "next/server";

async function verifyUser(request: NextRequest) {
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

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;

  const result = value.trim();
  return result ? result.slice(0, maxLength) : null;
}

async function readBody(request: NextRequest) {
  const raw = await request.text();

  if (!raw || raw.length > 10000) {
    return { error: "Request body is empty or too large" };
  }

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: "Invalid request data" };
    }

    return { body: parsed as Record<string, unknown> };
  } catch {
    return { error: "Invalid JSON request" };
  }
}

async function verifyInstitutionOwnership(
  auth: NonNullable<Awaited<ReturnType<typeof verifyUser>>>,
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

function validEmail(email: string | null) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// GET: List campuses belonging to the owner's institution
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
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to load campuses" },
        { status: response.status }
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

// POST: Add a campus
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

    const isOwner = await verifyInstitutionOwnership(
      auth,
      institutionId.trim()
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    const campus = {
      institution_id: institutionId.trim(),
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
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Campus registration failed" },
        { status: response.status }
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

// PATCH: Update an existing campus
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

    const isOwner = await verifyInstitutionOwnership(
      auth,
      institutionId.trim()
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
          { error: "Please enter a valid campus name (maximum 200 characters)" },
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
      `${auth.supabaseUrl}/rest/v1/institution_campuses?id=eq.${encodeURIComponent(campusId.trim())}&institution_id=eq.${encodeURIComponent(institutionId.trim())}`,
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

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to update campus" },
        { status: response.status }
      );
    }

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

// DELETE: Delete a campus belonging to the owner's institution
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

    const isOwner = await verifyInstitutionOwnership(
      auth,
      institutionId.trim()
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_campuses?id=eq.${encodeURIComponent(campusId.trim())}&institution_id=eq.${encodeURIComponent(institutionId.trim())}`,
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

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to delete campus" },
        { status: response.status }
      );
    }

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

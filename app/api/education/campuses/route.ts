
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

function optionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return null;

  const result = String(value).trim();
  return result ? result.slice(0, maxLength) : null;
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

// GET: List campuses for one institution owned by the user
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Please login with a valid account" },
        { status: 401 }
      );
    }

    const institutionId = request.nextUrl.searchParams.get(
      "institution_id"
    )?.trim();

    if (!institutionId) {
      return NextResponse.json(
        { error: "Institution ID is required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyInstitutionOwnership(
      auth,
      institutionId
    );

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

// POST: Add a campus to an institution owned by the user
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Please login before adding a campus" },
        { status: 401 }
      );
    }

    let body: Record<string, unknown>;

    try {
      const parsed = await request.json();

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json(
          { error: "Invalid request data" },
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
    const campusName = String(body.campus_name || "").trim();
    const city = String(body.city || "").trim();

    if (!institutionId || !campusName || !city) {
      return NextResponse.json(
        { error: "Institution ID, campus name and city are required" },
        { status: 400 }
      );
    }

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(institutionId)) {
      return NextResponse.json(
        { error: "Invalid institution ID" },
        { status: 400 }
      );
    }

    if (campusName.length > 200 || city.length > 100) {
      return NextResponse.json(
        { error: "Campus name or city is too long" },
        { status: 400 }
      );
    }

    const isOwner = await verifyInstitutionOwnership(
      auth,
      institutionId
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    const campus = {
      institution_id: institutionId,
      campus_name: campusName,
      province: optionalText(body.province, 100),
      city,
      address: optionalText(body.address, 500),
      phone: optionalText(body.phone, 30),
      email: optionalText(body.email, 254),
      is_active: true,
    };

    if (
      campus.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campus.email)
    ) {
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

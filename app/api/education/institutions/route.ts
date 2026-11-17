
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "school",
  "college",
  "university",
  "academy",
];

async function verifyUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get("authorization");

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

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

  return {
    supabaseUrl,
    supabaseKey,
    token,
    user,
  };
}

function cleanOptional(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return null;

  const cleaned = String(value).trim();

  return cleaned ? cleaned.slice(0, maxLength) : null;
}

// GET: Fetch owner's institutions
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Please login with a valid account" },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institutions?select=*&owner_user_id=eq.${encodeURIComponent(auth.user.id)}&order=created_at.desc`,
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
        { error: "Unable to load institutions" },
        { status: response.status }
      );
    }

    return NextResponse.json({ institutions: data });
  } catch {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }
}

// POST: Register a new institution
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Please login before registering" },
        { status: 401 }
      );
    }

    let body: Record<string, unknown>;

    try {
      const parsed = await request.json();

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json(
          { error: "Invalid registration data" },
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

    const institutionName = String(body.institution_name || "").trim();
    const institutionType = String(body.institution_type || "")
      .trim()
      .toLowerCase();
    const phone = String(body.phone || "").trim();
    const city = String(body.city || "").trim();

    if (!institutionName || !institutionType || !phone || !city) {
      return NextResponse.json(
        { error: "Institution name, type, phone and city are required" },
        { status: 400 }
      );
    }

    if (
      institutionName.length > 200 ||
      phone.length > 30 ||
      city.length > 100
    ) {
      return NextResponse.json(
        { error: "One or more fields exceed the allowed length" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(institutionType)) {
      return NextResponse.json(
        { error: "Invalid institution type" },
        { status: 400 }
      );
    }

    const email = cleanOptional(body.email, 254);

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const institution = {
      owner_user_id: auth.user.id,
      institution_name: institutionName,
      institution_type: institutionType,
      description: cleanOptional(body.description, 5000),
      email,
      phone,
      whatsapp_number: cleanOptional(body.whatsapp_number, 30),
      website_url: cleanOptional(body.website_url, 500),
      country: cleanOptional(body.country, 100) || "Pakistan",
      province: cleanOptional(body.province, 100),
      city,
      address: cleanOptional(body.address, 500),
      logo_url: cleanOptional(body.logo_url, 1000),
      cover_image_url: cleanOptional(body.cover_image_url, 1000),
      verification_status: "pending",
      is_active: true,
    };

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institutions`,
      {
        method: "POST",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(institution),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Institution registration failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        message: "Institution submitted for admin verification",
        institution: data[0],
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong during registration" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 16 * 1024;

const ALLOWED_INSTITUTION_TYPES = [
  "school",
  "college",
  "university",
  "academy",
  "institute",
  "other",
];

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validUrl(value: string): boolean {
  if (!value) return true;
  if (value.length > 2048) return false;

  try {
    const parsed = new URL(value);

    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

async function verifyUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!token || token.length > 4096) return null;

  try {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return null;

    const user = await response.json();

    if (!user?.id || !user?.email) return null;

    return {
      supabaseUrl,
      supabaseKey,
      token,
      user,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyUser(request);

  if (!auth) {
    return json(
      { error: "Please login before registering your institution." },
      401
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return json({ error: "Content-Type must be application/json." }, 415);
    }

    const contentLength = Number(
      request.headers.get("content-length") || 0
    );

    if (contentLength > MAX_BODY_BYTES) {
      return json({ error: "Request body is too large." }, 413);
    }

    const rawBody = await request.text();

    if (
      new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES
    ) {
      return json({ error: "Request body is too large." }, 413);
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON request body." }, 400);
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return json({ error: "Invalid registration data." }, 400);
    }

    const data = body as Record<string, unknown>;

    const institutionName = readText(data.institution_name);
    const institutionType = readText(data.institution_type).toLowerCase();
    const phone = readText(data.phone);
    const country = readText(data.country);
    const city = readText(data.city);

    const description = readText(data.description);
    const whatsappNumber = readText(data.whatsapp_number);
    const websiteUrl = readText(data.website_url);
    const province = readText(data.province);
    const address = readText(data.address);
    const logoUrl = readText(data.logo_url);
    const coverImageUrl = readText(data.cover_image_url);

    if (
      !institutionName ||
      !institutionType ||
      !phone ||
      !country ||
      !city
    ) {
      return json(
        {
          error:
            "Institution name, institution type, phone, country and city are required.",
        },
        400
      );
    }

    if (
      !ALLOWED_INSTITUTION_TYPES.includes(institutionType)
    ) {
      return json(
        { error: "Invalid institution type." },
        400
      );
    }

    if (
      institutionName.length > 200 ||
      phone.length > 30 ||
      country.length > 100 ||
      city.length > 100 ||
      province.length > 100 ||
      address.length > 500 ||
      description.length > 3000 ||
      whatsappNumber.length > 30 ||
      websiteUrl.length > 2048 ||
      logoUrl.length > 2048 ||
      coverImageUrl.length > 2048
    ) {
      return json(
        { error: "One or more fields exceed the allowed length." },
        400
      );
    }

    if (
      !validUrl(websiteUrl) ||
      !validUrl(logoUrl) ||
      !validUrl(coverImageUrl)
    ) {
      return json(
        {
          error:
            "Website, logo and cover image URLs must be valid HTTP or HTTPS URLs.",
        },
        400
      );
    }

    const institutionData = {
      owner_user_id: auth.user.id,
      institution_name: institutionName,
      institution_type: institutionType,
      description: description || null,
      email: auth.user.email,
      phone,
      whatsapp_number: whatsappNumber || null,
      website_url: websiteUrl || null,
      country,
      province: province || null,
      city,
      address: address || null,
      logo_url: logoUrl || null,
      cover_image_url: coverImageUrl || null,
      verification_status: "pending",
      is_active: false,
      admin_notes: null,
    };

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institutions?select=id,institution_name,institution_type,city,country,verification_status,is_active,created_at`,
      {
        method: "POST",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(institutionData),
        cache: "no-store",
      }
    );

    let result: any = null;

    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok) {
      console.error(
        "ALIQO EDUCATION REGISTRATION DATABASE ERROR:",
        {
          status: response.status,
          code: result?.code,
          message: result?.message,
        }
      );

      if (
        response.status === 409 ||
        result?.code === "23505"
      ) {
        return json(
          { error: "This institution registration already exists." },
          409
        );
      }

      return json(
        { error: "Unable to submit institution registration." },
        500
      );
    }

    if (!Array.isArray(result) || result.length === 0) {
      return json(
        { error: "Institution registration could not be confirmed." },
        500
      );
    }

    return json(
      {
        success: true,
        message:
          "Institution registration submitted successfully. Please wait for admin approval.",
        institution: result[0],
      },
      201
    );
  } catch (error) {
    console.error(
      "ALIQO EDUCATION REGISTRATION SERVER ERROR:",
      error
    );

    return json(
      { error: "Unable to process institution registration." },
      500
    );
  }
}

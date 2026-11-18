
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return response(
        { error: "Database configuration is missing." },
        500
      );
    }

    const authorization = request.headers.get("authorization");
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) {
      return response(
        { error: "Authentication required." },
        401
      );
    }

    // Verify the logged-in Supabase user.
    const userResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!userResponse.ok) {
      return response(
        { error: "Invalid or expired session." },
        401
      );
    }

    const user = await userResponse.json();

    if (!user?.id) {
      return response(
        { error: "Unable to verify account." },
        401
      );
    }

    // Load only institutions owned by this authenticated user.
    const params = new URLSearchParams({
      owner_user_id: `eq.${user.id}`,
      select: [
        "id",
        "institution_name",
        "institution_type",
        "description",
        "email",
        "phone",
        "whatsapp_number",
        "website_url",
        "country",
        "province",
        "city",
        "address",
        "logo_url",
        "cover_image_url",
        "verification_status",
        "is_active",
        "admin_notes",
        "created_at",
        "updated_at",
      ].join(","),
      order: "created_at.desc",
    });

    const institutionResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/institutions?${params.toString()}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!institutionResponse.ok) {
      return response(
        { error: "Unable to load institution information." },
        502
      );
    }

    const institutions = await institutionResponse.json();

    return response({
      institutions: Array.isArray(institutions)
        ? institutions
        : [],
    });
  } catch (error) {
    console.error("Education owner institution API error:", error);

    return response(
      { error: "Something went wrong." },
      500
    );
  }
}

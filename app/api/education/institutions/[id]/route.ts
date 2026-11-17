
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = [
  "institution_name",
  "institution_type",
  "description",
  "phone",
  "whatsapp_number",
  "website_url",
  "country",
  "province",
  "city",
  "address",
  "logo_url",
  "cover_image_url",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

const REQUIRED_FIELDS = [
  "institution_name",
  "institution_type",
  "phone",
  "country",
  "city",
] as const;

const FIELD_LIMITS: Record<AllowedField, number> = {
  institution_name: 200,
  institution_type: 60,
  description: 3000,
  phone: 30,
  whatsapp_number: 30,
  website_url: 2048,
  country: 100,
  province: 100,
  city: 100,
  address: 500,
  logo_url: 2048,
  cover_image_url: 2048,
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function verifyUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey || !token) {
    return {
      error: "Authentication required.",
      status: 401,
    };
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        method: "GET",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        error: "Invalid or expired session.",
        status: 401,
      };
    }

    const user = await response.json();

    if (!user?.id || !user?.email) {
      return {
        error: "Unable to verify account.",
        status: 401,
      };
    }

    return {
      user,
      token,
      supabaseUrl,
      anonKey,
    };
  } catch {
    return {
      error: "Authentication service unavailable.",
      status: 503,
    };
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyUser(request);

    if ("error" in auth) {
      return json(
        { success: false, message: auth.error },
        auth.status
      );
    }

    const { id } = await context.params;

    if (!validUuid(id)) {
      return json(
        { success: false, message: "Invalid institution ID." },
        400
      );
    }

    let body: unknown;

    try {
      const rawBody = await request.text();

      if (!rawBody || rawBody.length > 20000) {
        return json(
          { success: false, message: "Invalid request body." },
          400
        );
      }

      body = JSON.parse(rawBody);
    } catch {
      return json(
        { success: false, message: "Invalid JSON body." },
        400
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return json(
        { success: false, message: "Request body must be an object." },
        400
      );
    }

    const input = body as Record<string, unknown>;
    const keys = Object.keys(input);

    if (keys.length === 0) {
      return json(
        { success: false, message: "No update fields provided." },
        400
      );
    }

    const allowedSet = new Set<string>(ALLOWED_FIELDS);

    const invalidFields = keys.filter(
      (key) => !allowedSet.has(key)
    );

    if (invalidFields.length > 0) {
      return json(
        {
          success: false,
          message: "One or more fields cannot be updated.",
          fields: invalidFields,
        },
        400
      );
    }

    const updateData: Partial<Record<AllowedField, string | null>> = {};

    for (const key of keys) {
      const field = key as AllowedField;
      const value = input[key];

      if (value !== null && typeof value !== "string") {
        return json(
          {
            success: false,
            message: `Invalid value for ${field}.`,
          },
          400
        );
      }

      const normalized =
        typeof value === "string" ? value.trim() : "";

      if (
        REQUIRED_FIELDS.includes(
          field as (typeof REQUIRED_FIELDS)[number]
        ) &&
        !normalized
      ) {
        return json(
          {
            success: false,
            message: `${field} is required.`,
          },
          400
        );
      }

      if (
        normalized.length > FIELD_LIMITS[field]
      ) {
        return json(
          {
            success: false,
            message: `${field} exceeds the allowed length.`,
          },
          400
        );
      }

      if (
        ["website_url", "logo_url", "cover_image_url"].includes(field) &&
        normalized &&
        !validUrl(normalized)
      ) {
        return json(
          {
            success: false,
            message: `${field} must be a valid HTTP or HTTPS URL.`,
          },
          400
        );
      }

      updateData[field] =
        normalized || null;

      if (
        REQUIRED_FIELDS.includes(
          field as (typeof REQUIRED_FIELDS)[number]
        ) &&
        !normalized
      ) {
        return json(
          {
            success: false,
            message: `${field} cannot be empty.`,
          },
          400
        );
      }
    }

    const endpoint =
      `${auth.supabaseUrl}/rest/v1/institutions` +
      `?id=eq.${encodeURIComponent(id)}` +
      `&owner_user_id=eq.${encodeURIComponent(auth.user.id)}` +
      `&select=id,institution_name,verification_status,is_active,updated_at`;

    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        apikey: auth.anonKey,
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updateData),
      cache: "no-store",
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Institution update failed:", {
        status: response.status,
        code: result?.code,
        message: result?.message,
      });

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        return json(
          {
            success: false,
            message: "You are not authorized to update this institution.",
          },
          403
        );
      }

      return json(
        {
          success: false,
          message: "Institution update failed.",
        },
        400
      );
    }

    if (!Array.isArray(result) || result.length === 0) {
      return json(
        {
          success: false,
          message: "Institution not found or you do not own it.",
        },
        404
      );
    }

    return json({
      success: true,
      message: "Institution information updated successfully.",
      institution: result[0],
    });
  } catch (error) {
    console.error("Institution PATCH error:", error);

    return json(
      {
        success: false,
        message: "An unexpected server error occurred.",
      },
      500
    );
  }
}

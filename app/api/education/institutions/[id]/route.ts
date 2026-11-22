
import { NextRequest, NextResponse } from "next/server";

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

const ALLOWED_INSTITUTION_TYPES = [
  "school",
  "college",
  "university",
  "academy",
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

const MAX_BODY_BYTES = 20000;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
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

    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

async function readLimitedBody(request: NextRequest) {
  const reader = request.body?.getReader();

  if (!reader) {
    throw new Error("EMPTY_BODY");
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("BODY_TOO_LARGE");
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8", {
    fatal: true,
  }).decode(combined);
}

async function verifyUser(request: NextRequest) {
  const authorization =
    request.headers.get("authorization") || "";

  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !anonKey ||
    !token ||
    token.length > 4096
  ) {
    return {
      error: "Authentication required.",
      status: 401,
    };
  }

  try {
    const userResponse = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        method: "GET",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!userResponse.ok) {
      return {
        error: "Invalid or expired session.",
        status: 401,
      };
    }

    const user = await userResponse.json();

    if (!user?.id || !validUuid(user.id)) {
      return {
        error: "Unable to verify account.",
        status: 401,
      };
    }

    return {
      user,
      supabaseUrl,
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
        {
          success: false,
          message: auth.error,
        },
        auth.status
      );
    }

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error(
        "Institution update: service role key missing."
      );

      return json(
        {
          success: false,
          message: "Database configuration is incomplete.",
        },
        500
      );
    }

    const { id } = await context.params;

    if (!validUuid(id)) {
      return json(
        {
          success: false,
          message: "Invalid institution ID.",
        },
        400
      );
    }

    const contentType =
      request.headers.get("content-type") || "";

    if (
      !contentType
        .toLowerCase()
        .includes("application/json")
    ) {
      return json(
        {
          success: false,
          message: "Content-Type must be application/json.",
        },
        415
      );
    }

    const contentLength =
      request.headers.get("content-length");

    if (
      contentLength &&
      (
        !/^\d+$/.test(contentLength) ||
        Number(contentLength) > MAX_BODY_BYTES
      )
    ) {
      return json(
        {
          success: false,
          message: "Request body is too large.",
        },
        413
      );
    }

    let rawBody: string;

    try {
      rawBody = await readLimitedBody(request);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "BODY_TOO_LARGE"
      ) {
        return json(
          {
            success: false,
            message: "Request body is too large.",
          },
          413
        );
      }

      return json(
        {
          success: false,
          message: "Unable to read request body.",
        },
        400
      );
    }

    if (!rawBody.trim()) {
      return json(
        {
          success: false,
          message: "Request body cannot be empty.",
        },
        400
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return json(
        {
          success: false,
          message: "Invalid JSON body.",
        },
        400
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return json(
        {
          success: false,
          message: "Request body must be an object.",
        },
        400
      );
    }

    const input = body as Record<string, unknown>;
    const keys = Object.keys(input);

    if (keys.length === 0) {
      return json(
        {
          success: false,
          message: "No update fields provided.",
        },
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

    const updateData: Partial<
      Record<AllowedField, string | null>
    > = {};

    for (const key of keys) {
      const field = key as AllowedField;
      const value = input[key];

      if (
        value !== null &&
        typeof value !== "string"
      ) {
        return json(
          {
            success: false,
            message: `Invalid value for ${field}.`,
          },
          400
        );
      }

      const normalized =
        typeof value === "string"
          ? value.trim()
          : "";

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
        field === "institution_type" &&
        !ALLOWED_INSTITUTION_TYPES.includes(
          normalized as
            (typeof ALLOWED_INSTITUTION_TYPES)[number]
        )
      ) {
        return json(
          {
            success: false,
            message: "Invalid institution type.",
          },
          400
        );
      }

      if (
        [
          "website_url",
          "logo_url",
          "cover_image_url",
        ].includes(field) &&
        normalized &&
        !validUrl(normalized)
      ) {
        return json(
          {
            success: false,
            message:
              `${field} must be a valid HTTP or HTTPS URL without credentials.`,
          },
          400
        );
      }

      updateData[field] = normalized || null;
    }

    const params = new URLSearchParams({
      id: `eq.${id}`,
      owner_user_id: `eq.${auth.user.id}`,
      select:
        "id,institution_name,institution_type,verification_status,is_active,updated_at",
    });

    const endpoint =
      `${auth.supabaseUrl}/rest/v1/institutions?${params}`;

    const updateResponse = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updateData),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const result = await updateResponse
      .json()
      .catch(() => null);

    if (!updateResponse.ok) {
      console.error("Institution update failed:", {
        status: updateResponse.status,
        code: result?.code,
        message: result?.message,
      });

      return json(
        {
          success: false,
          message: "Institution update failed.",
        },
        400
      );
    }

    if (
      !Array.isArray(result) ||
      result.length === 0
    ) {
      return json(
        {
          success: false,
          message:
            "Institution not found or you do not own it.",
        },
        404
      );
    }

    return json({
      success: true,
      message:
        "Institution information updated successfully.",
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

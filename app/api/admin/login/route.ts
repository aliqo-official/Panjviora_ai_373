
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "aliqo37311011@gmail.com";

const REQUEST_TIMEOUT_MS = 15000;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 1024;

function response(
  data: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}


async function readBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (!/^application\/json(?:\s*;|$)/i.test(contentType.trim())) {
    return null;
  }

  const contentLength = request.headers.get("content-length");

  if (
    contentLength &&
    (!/^\d+$/.test(contentLength) ||
      Number(contentLength) > MAX_BODY_BYTES)
  ) {
    return null;
  }

  if (!request.body) {
    return null;
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
        return null;
      }

      chunks.push(value);
    }

    const bodyBytes = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      bodyBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const raw = new TextDecoder("utf-8", {
      fatal: true,
    }).decode(bodyBytes);

    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    try {
      await reader.cancel();
    } catch {
      // Ignore cancellation errors.
    }

    return null;
  } finally {
    reader.releaseLock();
  }
}

  const contentLength = request.headers.get("content-length");

  if (
    contentLength &&
    (!/^\d+$/.test(contentLength) ||
      Number(contentLength) > MAX_BODY_BYTES)
  ) {
    return null;
  }

  try {
    const raw = await request.text();

    if (
      new TextEncoder().encode(raw).byteLength >
      MAX_BODY_BYTES
    ) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readBody(request);

    if (!body) {
      return response(
        { error: "Invalid JSON request." },
        400
      );
    }

    const { email, password } = body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return response(
        { error: "Email and password are required." },
        400
      );
    }

    if (
      email.length > MAX_EMAIL_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      return response(
        { error: "Email or password exceeds allowed length." },
        400
      );
    }

    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      return response(
        { error: "Unauthorized admin account." },
        403
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Admin login configuration is incomplete.");

      return response(
        { error: "Server configuration error." },
        500
      );
    }

    const authResponse = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    let authData: {
      access_token?: string;
      expires_in?: number;
      user?: {
        email?: string;
      };
    };

    try {
      authData = await authResponse.json();
    } catch {
      console.error("Supabase returned an invalid login response.");

      return response(
        { error: "Authentication service unavailable." },
        502
      );
    }

    if (
      !authResponse.ok ||
      typeof authData.access_token !== "string" ||
      !authData.access_token ||
      authData.access_token.length > 8192
    ) {
      return response(
        { error: "Invalid email or password." },
        401
      );
    }

    if (
      typeof authData.user?.email !== "string" ||
      authData.user.email.toLowerCase() !== ADMIN_EMAIL
    ) {
      return response(
        { error: "Unauthorized admin account." },
        403
      );
    }

    const responseData = NextResponse.json(
      {
        success: true,
        message: "Admin login successful.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

    const expiresIn =
      typeof authData.expires_in === "number" &&
      Number.isFinite(authData.expires_in) &&
      authData.expires_in > 0
        ? Math.min(authData.expires_in, 3600)
        : 3600;

    responseData.cookies.set(
      "aliqo_admin_session",
      authData.access_token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: expiresIn,
      }
    );

    return responseData;
  } catch (error) {
    console.error("Admin login request failed:", error);

    return response(
      { error: "Login request failed." },
      500
    );
  }
}

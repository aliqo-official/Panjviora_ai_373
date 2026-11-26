
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "aliqo37311011@gmail.com";
const MAX_BODY_BYTES = 16 * 1024;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 1024;
const AUTH_TIMEOUT_MS = 15000;

async function readBody(
  request: NextRequest
): Promise<Record<string, unknown> | null> {
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

export async function POST(request: NextRequest) {
  try {
    const body = await readBody(request);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail.length > MAX_EMAIL_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      return NextResponse.json(
        { error: "Invalid email or password length." },
        { status: 400 }
      );
    }

    if (normalizedEmail !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase authentication environment is missing.");

      return NextResponse.json(
        { error: "Authentication service is not configured." },
        { status: 500 }
      );
    }

    const authUrl =
      `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/token?grant_type=password`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      AUTH_TIMEOUT_MS
    );

    let authResponse: Response;

    try {
      authResponse = await fetch(authUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
        signal: controller.signal,
        cache: "no-store",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    const authData: unknown = await authResponse.json();

    if (
      typeof authData !== "object" ||
      authData === null ||
      !("access_token" in authData) ||
      typeof authData.access_token !== "string" ||
      !authData.access_token ||
      authData.access_token.length > 10000 ||
      !("user" in authData) ||
      typeof authData.user !== "object" ||
      authData.user === null ||
      !("email" in authData.user) ||
      typeof authData.user.email !== "string" ||
      authData.user.email.toLowerCase() !== ADMIN_EMAIL ||
      !("expires_in" in authData) ||
      typeof authData.expires_in !== "number" ||
      !Number.isFinite(authData.expires_in) ||
      authData.expires_in <= 0
    ) {
      return NextResponse.json(
        { error: "Admin authentication failed." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin login successful.",
    });

    response.cookies.set(
      "aliqo_admin_session",
      authData.access_token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: Math.min(
          Math.floor(authData.expires_in),
          3600
        ),
      }
    );

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { error: "Unable to process admin login." },
      { status: 500 }
    );
  }
}

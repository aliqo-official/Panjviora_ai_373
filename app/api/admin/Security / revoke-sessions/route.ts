
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "aliqo37311011@gmail.com";
const COOKIE_NAME = "aliqo_admin_session";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const accessToken = request.cookies.get(COOKIE_NAME)?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Admin session not found." },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { error: "Supabase configuration is missing." },
      { status: 500 }
    );
  }

  try {
    const userResponse = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Admin session could not be verified." },
        { status: 401 }
      );
    }

    const user = await userResponse.json();

    if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Unauthorized Admin account." },
        { status: 403 }
      );
    }

    const revokeResponse = await fetch(
      `${supabaseUrl}/auth/v1/logout?scope=global`,
      {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!revokeResponse.ok) {
      return NextResponse.json(
        { error: "Unable to revoke Admin sessions." },
        { status: 502 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin sessions revoked. Please sign in again.",
    });

    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "An unexpected security error occurred." },
      { status: 500 }
    );
  }
}

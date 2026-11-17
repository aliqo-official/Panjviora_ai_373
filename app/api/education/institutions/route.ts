
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "aliqo37311011@gmail.com";

async function verifyAdmin(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const token = request.cookies.get("aliqo_admin_session")?.value;

    if (!supabaseUrl || !supabaseKey || !token) {
      return null;
    }

    const authResponse = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!authResponse.ok) return null;

    const user = await authResponse.json();

    if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
      return null;
    }

    return {
      supabaseUrl,
      supabaseKey,
      token,
    };
  } catch {
    return null;
  }
}

// GET: Load all institution applications for admin review.
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await fetch(
      `${admin.supabaseUrl}/rest/v1/institutions?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: admin.supabaseKey,
          Authorization: `Bearer ${admin.token}`,
        },
        cache: "no-store",
      }
    );

    const data = await result.json();

    if (!result.ok) {
      return NextResponse.json(
        { error: "Unable to load institution applications" },
        { status: result.status }
      );
    }

    return NextResponse.json({
      institutions: data,
    });
  } catch {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }
}

// PATCH: Approve or reject an institution application.
export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request" },
        { status: 400 }
      );
    }

    const institutionId =
      typeof body.institution_id === "string"
        ? body.institution_id.trim()
        : "";

    const status = body.status;

    const adminNotes =
      typeof body.admin_notes === "string"
        ? body.admin_notes.trim().slice(0, 2000)
        : "";

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      !uuidRegex.test(institutionId) ||
      !["approved", "rejected"].includes(String(status))
    ) {
      return NextResponse.json(
        { error: "Invalid institution ID or status" },
        { status: 400 }
      );
    }

    if (status === "rejected" && !adminNotes) {
      return NextResponse.json(
        { error: "Please provide a reason for rejection" },
        { status: 400 }
      );
    }

    const result = await fetch(
      `${admin.supabaseUrl}/rest/v1/institutions?id=eq.${encodeURIComponent(institutionId)}`,
      {
        method: "PATCH",
        headers: {
          apikey: admin.supabaseKey,
          Authorization: `Bearer ${admin.token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          verification_status: status,
          admin_notes: adminNotes || null,
          updated_at: new Date().toISOString(),
        }),
        cache: "no-store",
      }
    );

    const data = await result.json();

    if (!result.ok) {
      console.error("Institution verification update failed:", data);

      return NextResponse.json(
        { error: "Unable to update institution verification status" },
        { status: result.status }
      );
    }

    if (!data.length) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Institution ${status} successfully`,
      institution: data[0],
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

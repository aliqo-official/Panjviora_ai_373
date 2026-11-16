
import { NextRequest, NextResponse } from "next/server";

async function verifyAdmin(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.cookies.get("aliqo_admin_session")?.value;

  if (!supabaseUrl || !supabaseKey || !token) {
    return null;
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const user = await response.json();

    if (
      user.email?.toLowerCase() !== "aliqo37311011@gmail.com"
    ) {
      return null;
    }

    return { supabaseUrl, supabaseKey, token };
  } catch {
    return null;
  }
}

// GET: Load all hotel applications
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      `${admin.supabaseUrl}/rest/v1/hotel_profiles?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: admin.supabaseKey,
          Authorization: `Bearer ${admin.token}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to load hotel applications" },
        { status: response.status }
      );
    }

    return NextResponse.json({ hotels: data });
  } catch {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }
}

// PATCH: Approve or reject a hotel
export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const id = String(body.id || "").trim();
    const status = body.status;

    if (
      !id ||
      !["approved", "rejected"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid hotel ID or status" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${admin.supabaseUrl}/rest/v1/hotel_profiles?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          apikey: admin.supabaseKey,
          Authorization: `Bearer ${admin.token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          status,
          updated_at: new Date().toISOString(),
        }),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to update hotel status" },
        { status: response.status }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Hotel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Hotel ${status} successfully`,
      hotel: data[0],
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

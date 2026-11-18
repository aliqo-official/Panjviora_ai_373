
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "aliqo37311011@gmail.com";
const MAX_BODY_BYTES = 8 * 1024;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

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

    if (
      typeof user.email !== "string" ||
      user.email.toLowerCase() !== ADMIN_EMAIL
    ) {
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

// GET: Load institution applications for admin review.
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);

  if (!admin) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const result = await fetch(
      `${admin.supabaseUrl}/rest/v1/institutions?select=id,owner_user_id,institution_name,institution_type,email,phone,whatsapp_number,website_url,country,province,city,address,description,logo_url,cover_image_url,verification_status,is_active,admin_notes,created_at,updated_at&order=created_at.desc`,
      {
        headers: {
          apikey: admin.supabaseKey,
          Authorization: `Bearer ${admin.token}`,
        },
        cache: "no-store",
      }
    );

    if (!result.ok) {
      console.error(
        "Institution applications load failed:",
        await result.text()
      );

      return jsonResponse(
        { error: "Unable to load institution applications" },
        result.status
      );
    }

    const data = await result.json();

    return jsonResponse({
      institutions: data,
    });
  } catch (error) {
    console.error("Institution applications GET error:", error);

    return jsonResponse(
      { error: "Database connection failed" },
      500
    );
  }
}

// PATCH: Approve or reject an institution application.
export async function PATCH(request: NextRequest) {
  const admin = await verifyAdmin(request);

  if (!admin) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonResponse(
        { error: "Content-Type must be application/json" },
        415
      );
    }

    const rawBody = await request.text();

    if (
      new TextEncoder().encode(rawBody).byteLength >
      MAX_BODY_BYTES
    ) {
      return jsonResponse(
        { error: "Request body is too large" },
        413
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonResponse(
        { error: "Invalid JSON request" },
        400
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return jsonResponse(
        { error: "Invalid request body" },
        400
      );
    }

    const payload = body as Record<string, unknown>;

    const institutionId =
      typeof payload.institution_id === "string"
        ? payload.institution_id.trim()
        : "";

    const status = payload.status;

    const adminNotes =
      typeof payload.admin_notes === "string"
        ? payload.admin_notes.trim().slice(0, 2000)
        : "";

    if (
      !UUID_REGEX.test(institutionId) ||
      (status !== "approved" && status !== "rejected")
    ) {
      return jsonResponse(
        { error: "Invalid institution ID or status" },
        400
      );
    }

    if (status === "rejected" && !adminNotes) {
      return jsonResponse(
        { error: "Please provide a reason for rejection" },
        400
      );
    }

    // Approved institutions must be active to appear publicly.
    // Rejected institutions must remain inactive.
    const isActive = status === "approved";

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
          is_active: isActive,
          admin_notes: adminNotes || null,
          updated_at: new Date().toISOString(),
        }),
        cache: "no-store",
      }
    );

    if (!result.ok) {
      console.error(
        "Institution verification update failed:",
        await result.text()
      );

      return jsonResponse(
        { error: "Unable to update institution verification status" },
        result.status
      );
    }

    const data = await result.json();

    if (!Array.isArray(data) || data.length === 0) {
      return jsonResponse(
        { error: "Institution not found" },
        404
      );
    }

    return jsonResponse({
      message: `Institution ${status} successfully`,
      institution: data[0],
    });
  } catch (error) {
    console.error("Institution verification PATCH error:", error);

    return jsonResponse(
      { error: "Something went wrong" },
      500
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error("Hotel booking status API configuration is incomplete.");
      return jsonError("Booking service is temporarily unavailable.", 500);
    }

    // Require an authenticated hotel owner.
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonError("Please login to manage your hotel bookings.", 401);
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return jsonError("Invalid authentication session.", 401);
    }

    const authClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return jsonError("Your login session is invalid or expired.", 401);
    }

    let body: {
      booking_id?: unknown;
      status?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON request.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonError("Invalid request data.", 400);
    }

    if (!isValidUuid(body.booking_id)) {
      return jsonError("Valid booking ID is required.", 400);
    }

    if (body.status !== "confirmed" && body.status !== "rejected") {
      return jsonError("Status must be confirmed or rejected.", 400);
    }

    // Service-role key remains server-side only.
    // Owner ID comes from the verified Supabase session.
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await adminClient.rpc(
      "update_hotel_booking_status",
      {
        p_booking_id: body.booking_id,
        p_owner_user_id: user.id,
        p_new_status: body.status,
      }
    );

    if (error) {
      console.error("Hotel booking status database error:", {
        code: error.code,
        message: error.message,
      });

      const message = error.message || "";

      if (
        message.includes("not found") ||
        message.includes("access denied")
      ) {
        return jsonError("Booking not found or access denied.", 404);
      }

      if (
        message.includes("Only pending") ||
        message.includes("Invalid booking status")
      ) {
        return jsonError(message, 409);
      }

      return jsonError("Unable to update booking status.", 500);
    }

    if (!data || typeof data !== "object") {
      return jsonError("Unexpected booking status response.", 500);
    }

    const result = data as {
      success?: boolean;
      status?: string;
      message?: string;
      updated_at?: string;
    };

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Booking could not be updated.",
          status: result.status,
        },
        {
          status: 409,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          result.status === "confirmed"
            ? "Booking confirmed successfully."
            : "Booking rejected successfully.",
        status: result.status,
        updated_at: result.updated_at,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Hotel booking status API unexpected error:", error);
    return jsonError("Internal server error.", 500);
  }
}

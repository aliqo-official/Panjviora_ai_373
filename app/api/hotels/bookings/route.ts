
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type BookingInput = {
  room_id?: unknown;
  check_in?: unknown;
  check_out?: unknown;
  guests?: unknown;
  rooms_booked?: unknown;
  guest_name?: unknown;
  guest_email?: unknown;
  guest_phone?: unknown;
  special_requests?: unknown;
};

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

function isValidDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function validateBooking(body: BookingInput): string | null {
  if (!isValidUuid(body.room_id)) {
    return "Valid room ID is required.";
  }

  if (!isValidDate(body.check_in) || !isValidDate(body.check_out)) {
    return "Valid check-in and check-out dates are required.";
  }

  if (body.check_out <= body.check_in) {
    return "Check-out must be after check-in.";
  }

  if (
    !Number.isInteger(body.guests) ||
    Number(body.guests) < 1 ||
    Number(body.guests) > 1000
  ) {
    return "Guests must be between 1 and 1000.";
  }

  if (
    !Number.isInteger(body.rooms_booked) ||
    Number(body.rooms_booked) < 1 ||
    Number(body.rooms_booked) > 100000
  ) {
    return "Invalid number of rooms.";
  }

  if (
    typeof body.guest_name !== "string" ||
    body.guest_name.trim().length < 2 ||
    body.guest_name.trim().length > 120
  ) {
    return "Guest name must be between 2 and 120 characters.";
  }

  if (
    typeof body.guest_email !== "string" ||
    body.guest_email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.guest_email.trim())
  ) {
    return "Please provide a valid email address.";
  }

  if (
    typeof body.guest_phone !== "string" ||
    body.guest_phone.trim().length < 7 ||
    body.guest_phone.trim().length > 30
  ) {
    return "Please provide a valid phone number.";
  }

  if (
    body.special_requests !== undefined &&
    body.special_requests !== null &&
    (
      typeof body.special_requests !== "string" ||
      body.special_requests.length > 1000
    )
  ) {
    return "Special requests cannot exceed 1000 characters.";
  }

  return null;
}

async function getCustomerUserId(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  // Guest booking is allowed without a login session.
  if (!authorization) {
    return { userId: null, error: null };
  }

  if (!authorization.startsWith("Bearer ")) {
    return {
      userId: null,
      error: "Invalid authentication header.",
    };
  }

  const token = authorization.slice(7).trim();

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return {
      userId: null,
      error: "Invalid authentication session.",
    };
  }

  try {
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
      error,
    } = await authClient.auth.getUser(token);

    if (error || !user) {
      return {
        userId: null,
        error: "Your login session is invalid or expired.",
      };
    }

    return {
      userId: user.id,
      error: null,
    };
  } catch {
    return {
      userId: null,
      error: "Unable to verify customer session.",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey
    ) {
      console.error("Hotel booking API configuration is incomplete.");
      return jsonError("Booking service is temporarily unavailable.", 500);
    }

    let body: BookingInput;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON request.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonError("Invalid booking data.", 400);
    }

    const validationError = validateBooking(body);

    if (validationError) {
      return jsonError(validationError, 400);
    }

    // Never accept customer_user_id from the request body.
    const customer = await getCustomerUserId(request);

    if (customer.error) {
      return jsonError(customer.error, 401);
    }

    // Service-role client is used only inside this server API.
    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await adminClient.rpc(
      "create_hotel_booking",
      {
        p_room_id: body.room_id,
        p_customer_user_id: customer.userId,
        p_guest_name: body.guest_name.trim(),
        p_guest_email: body.guest_email.trim().toLowerCase(),
        p_guest_phone: body.guest_phone.trim(),
        p_check_in: body.check_in,
        p_check_out: body.check_out,
        p_guests: body.guests,
        p_rooms_booked: body.rooms_booked,
        p_special_requests:
          typeof body.special_requests === "string"
            ? body.special_requests.trim() || null
            : null,
      }
    );

    if (error) {
      console.error("Hotel booking database error:", {
        code: error.code,
        message: error.message,
      });

      const message = error.message || "";

      if (
        message.includes("Not enough rooms") ||
        message.includes("not approved") ||
        message.includes("not currently available")
      ) {
        return jsonError(message, 409);
      }

      if (
        message.includes("Invalid") ||
        message.includes("must be") ||
        message.includes("exceeds")
      ) {
        return jsonError(message, 400);
      }

      if (message.includes("not found")) {
        return jsonError("Hotel room not found.", 404);
      }

      return jsonError("Unable to create your booking.", 500);
    }

    const booking = Array.isArray(data) ? data[0] : data;

    if (!booking || !booking.id || !booking.booking_reference) {
      console.error("Hotel booking RPC returned an unexpected response.");
      return jsonError("Booking could not be confirmed.", 500);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your booking request has been submitted successfully.",
        booking,
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Hotel booking API unexpected error:", error);
    return jsonError("Internal server error.", 500);
  }
}

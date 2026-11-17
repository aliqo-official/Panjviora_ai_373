
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type RoomInput = {
  room_type?: string;
  description?: string | null;
  price_per_night?: number;
  capacity?: number;
  total_rooms?: number;
  amenities?: string[];
  image_url?: string | null;
  is_active?: boolean;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

async function authenticate(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      user: null,
      token: null,
      error: "Supabase configuration is missing.",
    };
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      user: null,
      token: null,
      error: "Authentication required.",
    };
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return {
      user: null,
      token: null,
      error: "Invalid authentication token.",
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        user: null,
        token: null,
        error: "Invalid or expired login session.",
      };
    }

    return {
      user,
      token,
      error: null,
    };
  } catch {
    return {
      user: null,
      token: null,
      error: "Authentication failed.",
    };
  }
}

function getSupabaseForUser(token: string) {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

async function getOwnerHotel(userId: string, token: string) {
  const supabase = getSupabaseForUser(token);

  const { data, error } = await supabase
    .from("hotel_profiles")
    .select("id, status")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return {
      hotel: null,
      error: "Hotel registration not found.",
    };
  }

  if (data.status !== "approved") {
    return {
      hotel: null,
      error: "Your hotel must be approved before managing rooms.",
    };
  }

  return {
    hotel: data,
    error: null,
  };
}

function validateRoom(data: RoomInput) {
  if (
    typeof data.room_type !== "string" ||
    !data.room_type.trim() ||
    data.room_type.trim().length > 100
  ) {
    return "Valid room type is required (maximum 100 characters).";
  }

  if (
    typeof data.price_per_night !== "number" ||
    !Number.isFinite(data.price_per_night) ||
    data.price_per_night < 0 ||
    data.price_per_night > 100000000
  ) {
    return "Room price must be between 0 and 100,000,000.";
  }

  if (
    !Number.isInteger(data.capacity) ||
    Number(data.capacity) < 1 ||
    Number(data.capacity) > 100
  ) {
    return "Room capacity must be between 1 and 100.";
  }

  if (
    !Number.isInteger(data.total_rooms) ||
    Number(data.total_rooms) < 0 ||
    Number(data.total_rooms) > 100000
  ) {
    return "Total rooms must be between 0 and 100,000.";
  }

  if (
    data.description !== undefined &&
    data.description !== null &&
    (typeof data.description !== "string" ||
      data.description.length > 3000)
  ) {
    return "Description must not exceed 3000 characters.";
  }

  if (
    data.amenities !== undefined &&
    (!Array.isArray(data.amenities) ||
      data.amenities.length > 50 ||
      !data.amenities.every(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0 &&
          item.length <= 100
      ))
  ) {
    return "Invalid room amenities.";
  }

  if (data.image_url !== undefined && data.image_url !== null) {
    if (
      typeof data.image_url !== "string" ||
      data.image_url.length > 2048
    ) {
      return "Invalid room image URL.";
    }

    try {
      const imageUrl = new URL(data.image_url);

      if (!["http:", "https:"].includes(imageUrl.protocol)) {
        return "Image URL must use HTTP or HTTPS.";
      }
    } catch {
      return "Invalid room image URL.";
    }
  }

  if (
    data.is_active !== undefined &&
    typeof data.is_active !== "boolean"
  ) {
    return "Invalid room status.";
  }

  return null;
}

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

// Calculate the maximum number of rooms reserved
// at the same time by pending and confirmed bookings.
function calculatePeakReservedRooms(
  bookings: {
    check_in: string;
    check_out: string;
    rooms_booked: number;
  }[]
) {
  const events: { date: string; change: number }[] = [];

  for (const booking of bookings) {
    events.push({
      date: booking.check_in,
      change: Number(booking.rooms_booked),
    });

    events.push({
      date: booking.check_out,
      change: -Number(booking.rooms_booked),
    });
  }

  // Checkout releases inventory before same-day check-in.
  events.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    return a.change - b.change;
  });

  let reserved = 0;
  let peak = 0;

  for (const event of events) {
    reserved += event.change;
    peak = Math.max(peak, reserved);
  }

  return peak;
}

// GET: View rooms belonging to the authenticated hotel owner.
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);

    if (!auth.user || !auth.token) {
      return jsonError(auth.error || "Authentication required.", 401);
    }

    const result = await getOwnerHotel(auth.user.id, auth.token);

    if (!result.hotel) {
      return jsonError(
        result.error || "Hotel access denied.",
        403
      );
    }

    const supabase = getSupabaseForUser(auth.token);

    const { data, error } = await supabase
      .from("hotel_rooms")
      .select("*")
      .eq("hotel_id", result.hotel.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Hotel rooms GET error:", error);
      return jsonError("Unable to load rooms.", 500);
    }

    return NextResponse.json({
      success: true,
      rooms: data || [],
    });
  } catch (error) {
    console.error("Hotel rooms GET unexpected error:", error);
    return jsonError("Internal server error.", 500);
  }
}

// POST: Add a new room.
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);

    if (!auth.user || !auth.token) {
      return jsonError(auth.error || "Authentication required.", 401);
    }

    const result = await getOwnerHotel(auth.user.id, auth.token);

    if (!result.hotel) {
      return jsonError(
        result.error || "Hotel access denied.",
        403
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonError("Invalid room data.", 400);
    }

    const validationError = validateRoom(body);

    if (validationError) {
      return jsonError(validationError, 400);
    }

    const supabase = getSupabaseForUser(auth.token);

    const { data, error } = await supabase
      .from("hotel_rooms")
      .insert({
        hotel_id: result.hotel.id,
        room_type: body.room_type!.trim(),
        description: body.description?.trim() || null,
        price_per_night: body.price_per_night,
        capacity: body.capacity,
        total_rooms: body.total_rooms,
        amenities: (body.amenities || []).map(
          (item: string) => item.trim()
        ),
        image_url: body.image_url?.trim() || null,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Hotel room POST error:", error);
      return jsonError("Unable to create room.", 500);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Room created successfully.",
        room: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Hotel room POST unexpected error:", error);
    return jsonError("Invalid request or server error.", 400);
  }
}

// PATCH: Update an existing room securely.
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticate(request);

    if (!auth.user || !auth.token) {
      return jsonError(auth.error || "Authentication required.", 401);
    }

    const result = await getOwnerHotel(auth.user.id, auth.token);

    if (!result.hotel) {
      return jsonError(
        result.error || "Hotel access denied.",
        403
      );
    }

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      !isValidUuid(body.id)
    ) {
      return jsonError("Valid room ID is required.", 400);
    }

    const updates: RoomInput = {};

    const allowedFields = [
      "room_type",
      "description",
      "price_per_night",
      "capacity",
      "total_rooms",
      "amenities",
      "image_url",
      "is_active",
    ] as const;

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        (updates as Record<string, unknown>)[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("No room changes provided.", 400);
    }

    const validationError = validateRoom({
      room_type: "room_type" in updates ? updates.room_type : "valid",
      price_per_night:
        "price_per_night" in updates ? updates.price_per_night : 0,
      capacity: "capacity" in updates ? updates.capacity : 1,
      total_rooms: "total_rooms" in updates ? updates.total_rooms : 0,
      ...updates,
    });

    if (validationError) {
      return jsonError(validationError, 400);
    }

    const supabase = getSupabaseForUser(auth.token);

    const { data: existingRoom, error: roomCheckError } = await supabase
      .from("hotel_rooms")
      .select("id, total_rooms")
      .eq("id", body.id)
      .eq("hotel_id", result.hotel.id)
      .maybeSingle();

    if (roomCheckError) {
      console.error("Room ownership check error:", roomCheckError);
      return jsonError("Unable to verify room ownership.", 500);
    }

    if (!existingRoom) {
      return jsonError("Room not found or access denied.", 404);
    }

    if ("total_rooms" in updates) {
      const { data: bookings, error: bookingsError } = await supabase
        .from("hotel_bookings")
        .select("check_in, check_out, rooms_booked")
        .eq("room_id", body.id)
        .eq("hotel_id", result.hotel.id)
        .in("status", ["pending", "confirmed"]);

      if (bookingsError) {
        console.error("Room inventory booking check error:", bookingsError);
        return jsonError(
          "Unable to verify existing room bookings.",
          500
        );
      }

      const peakReserved = calculatePeakReservedRooms(bookings || []);

      if (Number(updates.total_rooms) < peakReserved) {
        return NextResponse.json(
          {
            success: false,
            message: `Total rooms cannot be less than ${peakReserved}, because existing pending or confirmed bookings require this inventory.`,
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from("hotel_rooms")
      .update(updates)
      .eq("id", body.id)
      .eq("hotel_id", result.hotel.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Hotel room PATCH error:", error);
      return jsonError("Unable to update room.", 500);
    }

    if (!data) {
      return jsonError("Room not found or access denied.", 404);
    }

    return NextResponse.json({
      success: true,
      message: "Room updated successfully.",
      room: data,
    });
  } catch (error) {
    console.error("Hotel room PATCH unexpected error:", error);
    return jsonError("Invalid request or server error.", 400);
  }
}

// DELETE: Preserve all booking history.
// Rooms with any booking record are deactivated, not deleted.
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request);

    if (!auth.user || !auth.token) {
      return jsonError(auth.error || "Authentication required.", 401);
    }

    const result = await getOwnerHotel(auth.user.id, auth.token);

    if (!result.hotel) {
      return jsonError(
        result.error || "Hotel access denied.",
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("id");

    if (!isValidUuid(roomId)) {
      return jsonError("Valid room ID is required.", 400);
    }

    const supabase = getSupabaseForUser(auth.token);

    const { data: existingRoom, error: roomCheckError } = await supabase
      .from("hotel_rooms")
      .select("id")
      .eq("id", roomId)
      .eq("hotel_id", result.hotel.id)
      .maybeSingle();

    if (roomCheckError) {
      console.error("Room DELETE ownership check error:", roomCheckError);
      return jsonError("Unable to verify room ownership.", 500);
    }

    if (!existingRoom) {
      return jsonError("Room not found or access denied.", 404);
    }

    // Check ALL booking statuses, not just pending or confirmed.
    const { data: booking, error: bookingError } = await supabase
      .from("hotel_bookings")
      .select("id")
      .eq("room_id", roomId)
      .eq("hotel_id", result.hotel.id)
      .limit(1)
      .maybeSingle();

    if (bookingError) {
      console.error("Room booking history check error:", bookingError);
      return jsonError(
        "Unable to verify room booking history.",
        500
      );
    }

    // Preserve booking history by deactivating the room.
    if (booking) {
      const { data, error } = await supabase
        .from("hotel_rooms")
        .update({ is_active: false })
        .eq("id", roomId)
        .eq("hotel_id", result.hotel.id)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Room deactivation error:", error);
        return jsonError("Unable to deactivate room.", 500);
      }

      if (!data) {
        return jsonError("Room not found or access denied.", 404);
      }

      return NextResponse.json({
        success: true,
        message:
          "Room deactivated. All existing booking history has been preserved.",
      });
    }

    // No booking history exists: permanent deletion is allowed.
    const { data, error } = await supabase
      .from("hotel_rooms")
      .delete()
      .eq("id", roomId)
      .eq("hotel_id", result.hotel.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Room permanent DELETE error:", error);
      return jsonError(
        "Unable to delete room. Please check existing records.",
        500
      );
    }

    if (!data) {
      return jsonError("Room not found or access denied.", 404);
    }

    return NextResponse.json({
      success: true,
      message: "Room deleted successfully.",
    });
  } catch (error) {
    console.error("Hotel room DELETE unexpected error:", error);
    return jsonError("Internal server error.", 500);
  }
}

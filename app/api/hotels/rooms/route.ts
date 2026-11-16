
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
    data.price_per_night < 0
  ) {
    return "Valid room price is required.";
  }

  if (
    !Number.isInteger(data.capacity) ||
    Number(data.capacity) < 1
  ) {
    return "Room capacity must be at least 1.";
  }

  if (
    !Number.isInteger(data.total_rooms) ||
    Number(data.total_rooms) < 0
  ) {
    return "Total rooms must be zero or greater.";
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
        (item) => typeof item === "string" && item.length <= 100
      ))
  ) {
    return "Invalid room amenities.";
  }

  if (data.image_url !== undefined && data.image_url !== null) {
    if (typeof data.image_url !== "string") {
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

// GET: View rooms belonging to the authenticated hotel owner.
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);

    if (!auth.user || !auth.token) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: 401 }
      );
    }

    const result = await getOwnerHotel(auth.user.id, auth.token);

    if (!result.hotel) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 403 }
      );
    }

    const supabase = getSupabaseForUser(auth.token);

    const { data, error } = await supabase
      .from("hotel_rooms")
      .select("*")
      .eq("hotel_id", result.hotel.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, message: "Unable to load rooms." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rooms: data,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}

// POST: Add a new room.
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);

    if (!auth.user || !auth.token) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: 401 }
      );
    }

    const result = await getOwnerHotel(auth.user.id, auth.token);

    if (!result.hotel) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationError = validateRoom(body);

    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    const supabase = getSupabaseForUser(auth.token);

    const { data, error } = await supabase
      .from("hotel_rooms")
      .insert({
        hotel_id: result.hotel.id,
        room_type: body.room_type.trim(),
        description: body.description ?? null,
        price_per_night: body.price_per_night,
        capacity: body.capacity,
        total_rooms: body.total_rooms,
        amenities: body.amenities ?? [],
        image_url: body.image_url ?? null,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: "Unable to create room." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Room created successfully.",
        room: data,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request or server error." },
      { status: 400 }
    );
  }
}

// PATCH: Update an existing room.
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticate(request);

    if (!auth.user || !auth.token) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: 401 }
      );
    }

    const result = await getOwnerHotel(auth.user.id, auth.token);

    if (!result.hotel) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (
      !body ||
      typeof body.id !== "string" ||
      !body.id.trim()
    ) {
      return NextResponse.json(
        { success: false, message: "Room ID is required." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { success: false, message: "No room changes provided." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      );
    }

    const supabase = getSupabaseForUser(auth.token);

    const { data, error } = await supabase
      .from("hotel_rooms")
      .update(updates)
      .eq("id", body.id)
      .eq("hotel_id", result.hotel.id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, message: "Unable to update room." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Room not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Room updated successfully.",
      room: data,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request or server error." },
      { status: 400 }
    );
  }
}

// DELETE: Safely remove a room or deactivate it if bookings exist.
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request);

    if (!auth.user || !auth.token) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: 401 }
      );
    }

    const result = await getOwnerHotel(auth.user.id, auth.token);

    if (!result.hotel) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("id");

    if (!roomId) {
      return NextResponse.json(
        { success: false, message: "Room ID is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseForUser(auth.token);

    // Check whether this room has booking history.
    const { data: booking, error: bookingError } = await supabase
      .from("hotel_bookings")
      .select("id")
      .eq("room_id", roomId)
      .eq("hotel_id", result.hotel.id)
      .limit(1)
      .maybeSingle();

    if (bookingError) {
      return NextResponse.json(
        { success: false, message: "Unable to verify room bookings." },
        { status: 500 }
      );
    }

    // Preserve rooms with booking history by deactivating them.
    if (booking) {
      const { data, error } = await supabase
        .from("hotel_rooms")
        .update({ is_active: false })
        .eq("id", roomId)
        .eq("hotel_id", result.hotel.id)
        .select("id")
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { success: false, message: "Unable to deactivate room." },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { success: false, message: "Room not found or access denied." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Room deactivated. Existing booking history has been preserved.",
      });
    }

    // No bookings exist, so permanent deletion is allowed.
    const { data, error } = await supabase
      .from("hotel_rooms")
      .delete()
      .eq("id", roomId)
      .eq("hotel_id", result.hotel.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to delete room. Please check whether bookings exist.",
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Room not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Room deleted successfully.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}

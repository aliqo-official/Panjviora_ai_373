
import { NextRequest, NextResponse } from "next/server";

async function verifyUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

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

    if (!user.id || !user.email) return null;

    return {
      supabaseUrl,
      supabaseKey,
      token,
      user,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyUser(request);

  if (!auth) {
    return NextResponse.json(
      { error: "Please login before registering your hotel." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const hotelName = String(body.hotel_name || "").trim();
    const ownerName = String(body.owner_name || "").trim();
    const phone = String(body.phone || "").trim();
    const city = String(body.city || "").trim();
    const address = String(body.address || "").trim();

    const whatsappNumber = String(
      body.whatsapp_number || ""
    ).trim();

    const description = String(body.description || "").trim();
    const websiteUrl = String(body.website_url || "").trim();
    const imageUrl = String(body.image_url || "").trim();

    if (
      !hotelName ||
      !ownerName ||
      !phone ||
      !city ||
      !address
    ) {
      return NextResponse.json(
        {
          error:
            "Hotel name, owner name, phone, city and address are required.",
        },
        { status: 400 }
      );
    }

    if (
      hotelName.length > 150 ||
      ownerName.length > 120 ||
      phone.length > 30 ||
      city.length > 100 ||
      address.length > 500 ||
      description.length > 3000
    ) {
      return NextResponse.json(
        { error: "One or more fields exceed the allowed length." },
        { status: 400 }
      );
    }

    for (const value of [websiteUrl, imageUrl]) {
      if (value) {
        try {
          const parsedUrl = new URL(value);

          if (
            !["http:", "https:"].includes(parsedUrl.protocol)
          ) {
            throw new Error("Invalid URL");
          }
        } catch {
          return NextResponse.json(
            {
              error:
                "Website and image URLs must be valid HTTP or HTTPS URLs.",
            },
            { status: 400 }
          );
        }
      }
    }

    const hotelData = {
      owner_user_id: auth.user.id,
      hotel_name: hotelName,
      owner_name: ownerName,
      email: auth.user.email,
      phone,
      whatsapp_number: whatsappNumber || null,
      city,
      address,
      description: description || null,
      website_url: websiteUrl || null,
      image_url: imageUrl || null,
      status: "pending",
    };

    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/hotel_profiles`,
      {
        method: "POST",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(hotelData),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("ALIQO HOTEL REGISTRATION DATABASE ERROR:", {
        status: response.status,
        code: result?.code,
        message: result?.message,
        details: result?.details,
        hint: result?.hint,
      });

      if (
        response.status === 409 ||
        result.code === "23505"
      ) {
        return NextResponse.json(
          {
            error:
              "You have already submitted a hotel registration.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Unable to submit hotel registration." },
        { status: response.status }
      );
    }

    if (!Array.isArray(result) || result.length === 0) {
      return NextResponse.json(
        { error: "Hotel registration could not be confirmed." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Hotel registration submitted successfully. Please wait for admin approval.",
        hotel: result[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ALIQO HOTEL REGISTRATION SERVER ERROR:", error);

    return NextResponse.json(
      { error: "Invalid request or database connection failed." },
      { status: 500 }
    );
  }
}

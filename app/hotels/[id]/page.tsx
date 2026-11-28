
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Hotel = {
  id: string;
  hotel_name: string;
  city: string;
  address: string;
  description: string | null;
  website_url: string | null;
  image_url: string | null;
  phone: string | null;
  whatsapp_number: string | null;
};

type HotelRoom = {
  id: string;
  room_type: string;
  description: string | null;
  price_per_night: number;
  capacity: number;
  total_rooms: number;
  amenities: string[];
  image_url: string | null;
  is_active: boolean;
};

export default function HotelDetailsPage() {
  const params = useParams<{ id: string }>();
  const hotelId = params.id;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHotelDetails() {
    if (!hotelId) return;

    setLoading(true);
    setError("");

    try {
      const { data: hotelData, error: hotelError } = await supabase
        .from("hotel_profiles")
        .select(
          "id, hotel_name, city, address, description, website_url, image_url, phone, whatsapp_number"
        )
        .eq("id", hotelId)
        .eq("status", "approved")
        .maybeSingle();

      if (hotelError) throw hotelError;

      if (!hotelData) {
        setHotel(null);
        setRooms([]);
        setError("This hotel is unavailable or has not been approved.");
        return;
      }

      setHotel(hotelData as Hotel);

      const { data: roomData, error: roomError } = await supabase
        .from("hotel_rooms")
        .select(
          "id, room_type, description, price_per_night, capacity, total_rooms, amenities, image_url, is_active"
        )
        .eq("hotel_id", hotelId)
        .eq("is_active", true)
        .gt("total_rooms", 0)
        .order("price_per_night", { ascending: true });

      if (roomError) throw roomError;

      setRooms((roomData || []) as HotelRoom[]);
    } catch (err) {
      console.error("ALIQO HOTEL DETAILS ERROR:", err);
      setError("Hotel details could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHotelDetails();
  }, [hotelId]);

  function safeWebsite(url: string | null) {
    if (!url) return null;

    try {
      const parsed = new URL(url);

      return ["http:", "https:"].includes(parsed.protocol)
        ? parsed.href
        : null;
    } catch {
      return null;
    }
  }

  function whatsappLink(number: string | null) {
    if (!number) return null;

    let digits = number.replace(/\D/g, "");

    if (digits.startsWith("0092")) {
      digits = digits.slice(2);
    }

    if (digits.startsWith("92")) {
      // Already international format.
    } else if (digits.startsWith("0")) {
      digits = "92" + digits.slice(1);
    } else {
      digits = "92" + digits;
    }

    return digits.length >= 12
      ? `https://wa.me/${digits}`
      : null;
  }

  function formatPrice(price: number) {
    return `Rs. ${Number(price).toLocaleString("en-PK")}`;
  }

  const website = safeWebsite(hotel?.website_url || null);
  const whatsapp = whatsappLink(hotel?.whatsapp_number || null);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F0E6] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#DED5C2] border-t-[#D4AF37]" />
          <p className="font-semibold text-[#123D2B]">
            Loading hotel details...
          </p>
        </div>
      </main>
    );
  }

  if (error || !hotel) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F0E6] px-4">
        <div className="w-full max-w-lg rounded-3xl border border-[#DED5C2] bg-white p-8 text-center shadow-lg">
          <div className="text-6xl">🏨</div>

          <h1 className="mt-5 text-2xl font-extrabold text-[#123D2B]">
            Hotel Not Available
          </h1>

          <p className="mt-3 text-[#68766D]">
            {error || "This hotel could not be found."}
          </p>

          <Link
            href="/hotels"
            className="mt-6 inline-block rounded-xl bg-[#123D2B] px-6 py-3 font-bold text-white hover:bg-[#1B563C]"
          >
            Back to Hotels
          </Link>

          <button
            onClick={loadHotelDetails}
            className="ml-2 mt-6 rounded-xl border border-[#D4AF37] px-6 py-3 font-bold text-[#123D2B] hover:bg-[#F5F0E6]"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6]">
      <header className="bg-[#123D2B] px-4 py-5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            href="/hotels"
            className="font-semibold text-[#D4AF37] hover:text-white"
          >
            ← All Hotels
          </Link>

          <p className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
            ALIQO Accommodation
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="overflow-hidden rounded-3xl border border-[#DED5C2] bg-white shadow-lg">
          {hotel.image_url ? (
            <img
              src={hotel.image_url}
              alt={hotel.hotel_name}
              className="h-64 w-full object-cover md:h-96"
            />
          ) : (
            <div className="flex h-64 items-center justify-center bg-[#123D2B] text-8xl md:h-96">
              🏨
            </div>
          )}

          <div className="p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#D4AF37] bg-[#123D2B] px-4 py-1.5 text-xs font-bold text-[#D4AF37]">
                ✓ Approved Hotel
              </span>

              <span className="text-sm font-medium text-[#68766D]">
                {hotel.city}
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-extrabold text-[#123D2B] md:text-4xl">
              {hotel.hotel_name}
            </h1>

            <p className="mt-4 leading-7 text-[#68766D]">
              📍 {hotel.address}
            </p>

            {hotel.description && (
              <div className="mt-7">
                <h2 className="text-xl font-bold text-[#123D2B]">
                  About This Hotel
                </h2>

                <p className="mt-3 whitespace-pre-line leading-7 text-[#68766D]">
                  {hotel.description}
                </p>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              {hotel.phone && (
                <a
                  href={`tel:${hotel.phone}`}
                  className="rounded-xl bg-[#123D2B] px-5 py-3 font-semibold text-white hover:bg-[#1B563C]"
                >
                  ☎ Call Hotel
                </a>
              )}

              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-[#1B563C] px-5 py-3 font-semibold text-white hover:bg-[#123D2B]"
                >
                  WhatsApp
                </a>
              )}

              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-[#D4AF37] bg-[#F5F0E6] px-5 py-3 font-semibold text-[#123D2B] hover:bg-[#D4AF37]"
                >
                  Visit Website ↗
                </a>
              )}
            </div>
          </div>
        </div>

        <section className="mt-12">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-widest text-[#B08B22]">
              Accommodation Options
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-[#123D2B] md:text-3xl">
              Available Room Types
            </h2>

            <p className="mt-2 text-sm text-[#68766D]">
              Explore active room types offered by this hotel.
            </p>
          </div>

          {rooms.length === 0 ? (
            <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center">
              <div className="text-5xl">🛏️</div>

              <h3 className="mt-4 text-xl font-bold text-[#123D2B]">
                No Rooms Available
              </h3>

              <p className="mt-2 text-[#68766D]">
                This hotel has not added any available rooms yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <article
                  key={room.id}
                  className="overflow-hidden rounded-2xl border border-[#DED5C2] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
                >
                  {room.image_url ? (
                    <img
                      src={room.image_url}
                      alt={room.room_type}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-[#123D2B] text-6xl">
                      🛏️
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-xl font-extrabold text-[#123D2B]">
                      {room.room_type}
                    </h3>

                    <p className="mt-3 text-2xl font-extrabold text-[#B08B22]">
                      {formatPrice(room.price_per_night)}
                      <span className="text-sm font-medium text-[#68766D]">
                        {" "}/ night
                      </span>
                    </p>

                    <div className="mt-4 space-y-2 text-sm text-[#68766D]">
                      <p>👥 Capacity: {room.capacity} guest(s)</p>
                      <p>🛏️ Rooms listed: {room.total_rooms}</p>
                    </div>

                    {room.description && (
                      <p className="mt-4 leading-6 text-[#68766D]">
                        {room.description}
                      </p>
                    )}

                    {room.amenities && room.amenities.length > 0 && (
                      <div className="mt-5">
                        <p className="mb-2 text-sm font-bold text-[#123D2B]">
                          Amenities
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {room.amenities.map((amenity, index) => (
                            <span
                              key={`${room.id}-${index}`}
                              className="rounded-full border border-[#DED5C2] bg-[#F5F0E6] px-3 py-1 text-xs text-[#123D2B]"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 rounded-xl border border-[#D4AF37]/50 bg-[#F5F0E6] p-3 text-center text-sm font-semibold text-[#123D2B]">
                      Contact hotel to enquire about this room
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <footer className="mt-12 border-t border-[#D4AF37]/30 bg-[#123D2B] px-4 py-8 text-center">
        <p className="font-bold text-[#D4AF37]">
          ALIQO Accommodation
        </p>

        <p className="mt-2 text-sm text-white/75">
          © 2026 ALIQO. Explore more. Discover more.
        </p>
      </footer>
    </main>
  );
}

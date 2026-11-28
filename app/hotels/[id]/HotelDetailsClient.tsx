
"use client";

import { useCallback, useEffect, useState } from "react";
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
  hotel_id: string;
  room_type: string;
  description: string | null;
  price_per_night: number;
  capacity: number;
  total_rooms: number;
  amenities: string[] | null;
  image_url: string | null;
  is_active: boolean;
};

type Props = {
  hotelId: string;
};

export default function HotelDetailsClient({ hotelId }: Props) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHotelDetails = useCallback(async () => {
    if (!hotelId) {
      setError("Invalid hotel address.");
      setLoading(false);
      return;
    }

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

      if (hotelError) {
        throw hotelError;
      }

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
          "id, hotel_id, room_type, description, price_per_night, capacity, total_rooms, amenities, image_url, is_active"
        )
        .eq("hotel_id", hotelId)
        .eq("is_active", true)
        .gt("total_rooms", 0)
        .order("price_per_night", { ascending: true });

      if (roomError) {
        throw roomError;
      }

      setRooms((roomData || []) as HotelRoom[]);
    } catch (err) {
      console.error("Hotel details loading error:", err);
      setError("Unable to load hotel details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    void loadHotelDetails();
  }, [loadHotelDetails]);

  const cleanPhone = (value: string) => value.replace(/[^\d+]/g, "");

  const whatsappLink = hotel?.whatsapp_number
    ? `https://wa.me/${hotel.whatsapp_number.replace(/\D/g, "")}`
    : "";

  const websiteLink = hotel?.website_url
    ? /^https?:\/\//i.test(hotel.website_url)
      ? hotel.website_url
      : `https://${hotel.website_url}`
    : "";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07130f] px-4 py-20 text-center text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#D6B45B]/30 bg-[#10251c] p-10">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-[#D6B45B]/30 border-t-[#D6B45B]" />
          <p className="text-lg text-[#D6B45B]">
            Loading hotel details...
          </p>
        </div>
      </main>
    );
  }

  if (error || !hotel) {
    return (
      <main className="min-h-screen bg-[#07130f] px-4 py-20 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/30 bg-[#10251c] p-8 text-center">
          <h1 className="mb-3 text-2xl font-bold text-[#D6B45B]">
            Hotel Not Available
          </h1>
          <p className="mb-6 text-gray-300">
            {error || "We could not find this hotel."}
          </p>
          <a
            href="/hotels"
            className="inline-block rounded-lg bg-[#D6B45B] px-6 py-3 font-semibold text-[#07130f] transition hover:bg-[#e8ca78]"
          >
            Back to Hotels
          </a>
          <button
            type="button"
            onClick={() => void loadHotelDetails()}
            className="ml-3 rounded-lg border border-[#D6B45B] px-6 py-3 font-semibold text-[#D6B45B] transition hover:bg-[#D6B45B]/10"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07130f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <a
          href="/hotels"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#D6B45B] hover:text-white"
        >
          ← Back to Hotels
        </a>

        <section className="overflow-hidden rounded-2xl border border-[#D6B45B]/30 bg-[#10251c] shadow-xl">
          {hotel.image_url ? (
            <div className="h-64 w-full overflow-hidden bg-black sm:h-80">
              <img
                src={hotel.image_url}
                alt={hotel.hotel_name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center bg-gradient-to-br from-[#173d2c] to-[#07130f] sm:h-72">
              <span className="text-7xl" aria-hidden="true">
                🏨
              </span>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-green-400/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
                Approved Hotel
              </span>
              <span className="text-sm text-gray-400">
                {hotel.city}
              </span>
            </div>

            <h1 className="mb-3 text-3xl font-bold text-[#D6B45B] sm:text-4xl">
              {hotel.hotel_name}
            </h1>

            <p className="mb-4 text-gray-300">
              📍 {hotel.address}, {hotel.city}
            </p>

            {hotel.description && (
              <p className="max-w-4xl whitespace-pre-line leading-7 text-gray-300">
                {hotel.description}
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              {hotel.phone && (
                <a
                  href={`tel:${cleanPhone(hotel.phone)}`}
                  className="rounded-lg bg-[#D6B45B] px-5 py-3 font-semibold text-[#07130f] transition hover:bg-[#e8ca78]"
                >
                  📞 Call Hotel
                </a>
              )}

              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-green-500 px-5 py-3 font-semibold text-green-400 transition hover:bg-green-500/10"
                >
                  WhatsApp
                </a>
              )}

              {websiteLink && (
                <a
                  href={websiteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[#D6B45B]/50 px-5 py-3 font-semibold text-[#D6B45B] transition hover:bg-[#D6B45B]/10"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#D6B45B] sm:text-3xl">
                Available Rooms
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Active rooms currently listed by this hotel.
              </p>
            </div>

            <span className="rounded-full border border-[#D6B45B]/30 bg-[#10251c] px-4 py-2 text-sm text-[#D6B45B]">
              {rooms.length} Room Types
            </span>
          </div>

          {rooms.length === 0 ? (
            <div className="rounded-2xl border border-[#D6B45B]/20 bg-[#10251c] p-8 text-center">
              <p className="mb-2 text-4xl" aria-hidden="true">
                🛏️
              </p>
              <h3 className="text-xl font-semibold text-[#D6B45B]">
                No Rooms Available
              </h3>
              <p className="mt-2 text-gray-400">
                This hotel has not listed any active rooms at the moment.
                Please contact the hotel for more information.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <article
                  key={room.id}
                  className="overflow-hidden rounded-2xl border border-[#D6B45B]/25 bg-[#10251c] transition hover:border-[#D6B45B]/60"
                >
                  {room.image_url ? (
                    <div className="h-48 overflow-hidden bg-black">
                      <img
                        src={room.image_url}
                        alt={room.room_type}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#173d2c] to-[#07130f]">
                      <span className="text-5xl" aria-hidden="true">
                        🛏️
                      </span>
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="mb-2 text-xl font-bold text-[#D6B45B]">
                      {room.room_type}
                    </h3>

                    {room.description && (
                      <p className="mb-4 text-sm leading-6 text-gray-300">
                        {room.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-gray-300">
                      <p>
                        <span className="text-[#D6B45B]">Price:</span>{" "}
                        Rs. {Number(room.price_per_night).toLocaleString("en-PK")} / night
                      </p>
                      <p>
                        <span className="text-[#D6B45B]">Capacity:</span>{" "}
                        {room.capacity} guests
                      </p>
                      <p>
                        <span className="text-[#D6B45B]">Rooms listed:</span>{" "}
                        {room.total_rooms}
                      </p>
                    </div>

                    {room.amenities && room.amenities.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-[#D6B45B]">
                          Amenities
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {room.amenities.map((amenity, index) => (
                            <span
                              key={`${room.id}-${index}`}
                              className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-300"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-5 rounded-lg border border-[#D6B45B]/20 bg-black/20 p-3 text-center text-sm text-gray-300">
                      Contact hotel to enquire about this room.
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-10 rounded-xl border border-[#D6B45B]/20 bg-[#10251c] p-5 text-center">
          <p className="text-sm text-gray-400">
            ALIQO Hotel Directory — Discover accommodation across Pakistan.
          </p>
        </div>
      </div>
    </main>
  );
}

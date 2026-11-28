
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Hotel = {
  id: string;
  hotel_name: string;
  owner_name?: string | null;
  city: string;
  address: string;
  description?: string | null;
  website_url?: string | null;
  image_url?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
};

type HotelRoom = {
  id: string;
  room_type: string;
  description?: string | null;
  price_per_night: number;
  capacity: number;
  total_rooms: number;
  amenities?: string[] | null;
  image_url?: string | null;
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
          "id, hotel_name, owner_name, city, address, description, website_url, image_url, phone, whatsapp_number"
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
          "id, room_type, description, price_per_night, capacity, total_rooms, amenities, image_url, is_active"
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
    loadHotelDetails();
  }, [loadHotelDetails]);

  const whatsappNumber = (hotel?.whatsapp_number || "").replace(
    /[^0-9]/g,
    ""
  );

  const phoneNumber = (hotel?.phone || "").replace(
    /[^0-9+]/g,
    ""
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#061b15] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#d6b45b] border-t-transparent" />
          <p className="text-[#d6b45b]">Loading hotel details...</p>
        </div>
      </main>
    );
  }

  if (error || !hotel) {
    return (
      <main className="min-h-screen bg-[#061b15] px-4 py-16 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#d6b45b]/30 bg-[#0b2b20] p-8 text-center">
          <h1 className="mb-3 text-2xl font-bold text-[#d6b45b]">
            Hotel Not Available
          </h1>
          <p className="mb-6 text-gray-300">
            {error || "This hotel could not be found."}
          </p>
          <Link
            href="/hotels"
            className="inline-block rounded-lg bg-[#d6b45b] px-6 py-3 font-semibold text-[#061b15] hover:bg-[#e6c978]"
          >
            Back to Hotels
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#061b15] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/hotels"
          className="mb-6 inline-block text-sm font-medium text-[#d6b45b] hover:underline"
        >
          ← Back to Hotels
        </Link>

        <section className="overflow-hidden rounded-2xl border border-[#d6b45b]/30 bg-[#0b2b20] shadow-xl">
          {hotel.image_url ? (
            <img
              src={hotel.image_url}
              alt={hotel.hotel_name}
              className="h-64 w-full object-cover sm:h-80"
            />
          ) : (
            <div className="flex h-56 items-center justify-center bg-[#123b2c] text-7xl">
              🏨
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-green-500/40 bg-green-500/10 px-4 py-1 text-sm text-green-300">
                Approved Hotel
              </span>
              <span className="text-sm text-[#d6b45b]">
                {hotel.city}
              </span>
            </div>

            <h1 className="mb-3 text-3xl font-bold text-[#d6b45b] sm:text-4xl">
              {hotel.hotel_name}
            </h1>

            <p className="mb-4 text-gray-300">{hotel.address}</p>

            {hotel.description && (
              <p className="mb-6 whitespace-pre-line leading-7 text-gray-300">
                {hotel.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              {phoneNumber && (
                <a
                  href={`tel:${phoneNumber}`}
                  className="rounded-lg bg-[#d6b45b] px-5 py-3 font-semibold text-[#061b15] hover:bg-[#e6c978]"
                >
                  Call Hotel
                </a>
              )}

              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-green-500 px-5 py-3 font-semibold text-green-300 hover:bg-green-500/10"
                >
                  WhatsApp
                </a>
              )}

              {hotel.website_url && (
                <a
                  href={hotel.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[#d6b45b] px-5 py-3 font-semibold text-[#d6b45b] hover:bg-[#d6b45b]/10"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-[#d6b45b]">
              Available Rooms
            </h2>
            <span className="text-sm text-gray-400">
              {rooms.length} room type(s) available
            </span>
          </div>

          {rooms.length === 0 ? (
            <div className="rounded-xl border border-[#d6b45b]/20 bg-[#0b2b20] p-8 text-center">
              <p className="text-gray-300">
                No active rooms are currently available.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Please contact the hotel for more information.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {rooms.map((room) => (
                <article
                  key={room.id}
                  className="overflow-hidden rounded-xl border border-[#d6b45b]/25 bg-[#0b2b20]"
                >
                  {room.image_url ? (
                    <img
                      src={room.image_url}
                      alt={room.room_type}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-[#123b2c] text-5xl">
                      🛏️
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="mb-2 text-xl font-bold text-[#d6b45b]">
                      {room.room_type}
                    </h3>

                    {room.description && (
                      <p className="mb-4 text-sm leading-6 text-gray-300">
                        {room.description}
                      </p>
                    )}

                    <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-[#061b15] p-3">
                        <p className="text-gray-400">Price per night</p>
                        <p className="mt-1 font-bold text-[#d6b45b]">
                          Rs. {Number(room.price_per_night).toLocaleString("en-PK")}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#061b15] p-3">
                        <p className="text-gray-400">Guest capacity</p>
                        <p className="mt-1 font-bold text-white">
                          {room.capacity} Guests
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#061b15] p-3">
                        <p className="text-gray-400">Rooms available</p>
                        <p className="mt-1 font-bold text-white">
                          {room.total_rooms}
                        </p>
                      </div>
                    </div>

                    {room.amenities && room.amenities.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-semibold text-[#d6b45b]">
                          Amenities
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {room.amenities.map((amenity, index) => (
                            <span
                              key={`${room.id}-${index}`}
                              className="rounded-full bg-[#061b15] px-3 py-1 text-xs text-gray-300"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-400">
                      Contact the hotel to enquire about this room.
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={loadHotelDetails}
            className="rounded-lg border border-[#d6b45b] px-6 py-3 font-semibold text-[#d6b45b] hover:bg-[#d6b45b]/10"
          >
            Refresh Hotel Details
          </button>
        </div>
      </div>
    </main>
  );
}

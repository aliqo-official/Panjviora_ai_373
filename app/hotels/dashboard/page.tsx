
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Hotel = {
  id: string;
  hotel_name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type Room = {
  id: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  total_rooms: number;
  is_active: boolean;
};

type Booking = {
  id: string;
  booking_reference: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  rooms_booked: number;
  total_amount: number;
  status: string;
  payment_status: string;
};

export default function HotelOwnerDashboard() {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Please login to access your hotel dashboard.");
      }

      const headers = {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${session.access_token}`,
      };

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

      const hotelResponse = await fetch(
        `${supabaseUrl}/rest/v1/hotel_profiles?select=*&owner_user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`,
        {
          headers,
          cache: "no-store",
        }
      );

      if (!hotelResponse.ok) {
        throw new Error("Unable to load hotel information.");
      }

      const hotelData = await hotelResponse.json();

      if (!Array.isArray(hotelData) || hotelData.length === 0) {
        setHotel(null);
        setRooms([]);
        setBookings([]);
        return;
      }

      const currentHotel: Hotel = hotelData[0];
      setHotel(currentHotel);

      const [roomsResponse, bookingsResponse] = await Promise.all([
        fetch(
          `${supabaseUrl}/rest/v1/hotel_rooms?select=*&hotel_id=eq.${encodeURIComponent(currentHotel.id)}&order=created_at.desc`,
          {
            headers,
            cache: "no-store",
          }
        ),
        fetch(
          `${supabaseUrl}/rest/v1/hotel_bookings?select=*&hotel_id=eq.${encodeURIComponent(currentHotel.id)}&order=created_at.desc`,
          {
            headers,
            cache: "no-store",
          }
        ),
      ]);

      if (!roomsResponse.ok || !bookingsResponse.ok) {
        throw new Error("Unable to load rooms or booking information.");
      }

      const [roomsData, bookingsData] = await Promise.all([
        roomsResponse.json(),
        bookingsResponse.json(),
      ]);

      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const statusStyle = (status: string) => {
    switch (status) {
      case "approved":
      case "confirmed":
      case "paid":
        return "bg-green-100 text-green-800";

      case "rejected":
      case "cancelled":
      case "failed":
        return "bg-red-100 text-red-800";

      default:
        return "bg-amber-100 text-amber-800";
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading hotel dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hotel Owner Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your hotel, rooms and customer bookings.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            Refresh Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!hotel ? (
          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <div className="mb-4 text-5xl">🏨</div>

            <h2 className="text-2xl font-bold text-gray-900">
              No Hotel Registered
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-gray-600">
              You have not submitted a hotel registration yet.
              Register your hotel to start using ALIQO accommodation services.
            </p>

            <a
              href="/hotels/register"
              className="mt-6 inline-block rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
            >
              Register Your Hotel
            </a>
          </div>
        ) : (
          <>
            <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {hotel.hotel_name}
                  </h2>

                  <p className="mt-1 text-gray-600">
                    {hotel.city} · {hotel.address}
                  </p>

                  <p className="mt-3 text-sm text-gray-500">
                    Owner: {hotel.owner_name}
                  </p>

                  <p className="text-sm text-gray-500">
                    Email: {hotel.email}
                  </p>

                  <p className="text-sm text-gray-500">
                    Phone: {hotel.phone}
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${statusStyle(
                    hotel.status
                  )}`}
                >
                  {hotel.status}
                </span>
              </div>

              {hotel.status === "pending" && (
                <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  Your hotel registration is waiting for admin approval.
                  Room listings and public hotel visibility will be available
                  after approval.
                </div>
              )}

              {hotel.status === "rejected" && (
                <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  Your hotel application has been rejected.
                  Please contact ALIQO support for further information.
                </div>
              )}

              {hotel.status === "approved" && (
                <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">
                  Congratulations! Your hotel has been approved.
                </div>
              )}
            </section>

            <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Total Rooms",
                  value: rooms.length,
                  icon: "🛏️",
                },
                {
                  title: "Active Rooms",
                  value: rooms.filter((room) => room.is_active).length,
                  icon: "🏨",
                },
                {
                  title: "Total Bookings",
                  value: bookings.length,
                  icon: "📋",
                },
                {
                  title: "Pending Bookings",
                  value: bookings.filter(
                    (booking) => booking.status === "pending"
                  ).length,
                  icon: "⏳",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border bg-white p-5 shadow-sm"
                >
                  <p className="text-2xl">{item.icon}</p>
                  <p className="mt-3 text-sm text-gray-500">
                    {item.title}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </section>

            <section className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold text-gray-900">
                Room Management
              </h2>

              {hotel.status !== "approved" ? (
                <p className="text-sm text-gray-500">
                  Room management will become available after hotel approval.
                </p>
              ) : rooms.length === 0 ? (
                <p className="text-gray-500">
                  No rooms have been added yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="p-3">Room Type</th>
                        <th className="p-3">Price / Night</th>
                        <th className="p-3">Capacity</th>
                        <th className="p-3">Total Rooms</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {rooms.map((room) => (
                        <tr key={room.id} className="border-b">
                          <td className="p-3 font-medium">
                            {room.room_type}
                          </td>
                          <td className="p-3">
                            Rs. {Number(room.price_per_night).toLocaleString()}
                          </td>
                          <td className="p-3">{room.capacity}</td>
                          <td className="p-3">{room.total_rooms}</td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs ${
                                room.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {room.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold text-gray-900">
                Customer Bookings
              </h2>

              {bookings.length === 0 ? (
                <p className="text-gray-500">
                  No customer bookings received yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {booking.guest_name}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            Reference: {booking.booking_reference}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                        <p>Phone: {booking.guest_phone}</p>
                        <p>Email: {booking.guest_email}</p>
                        <p>Check-in: {booking.check_in}</p>
                        <p>Check-out: {booking.check_out}</p>
                        <p>Guests: {booking.guests}</p>
                        <p>Rooms: {booking.rooms_booked}</p>
                        <p>
                          Total: Rs.{" "}
                          {Number(booking.total_amount).toLocaleString()}
                        </p>
                        <p>
                          Payment: {booking.payment_status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

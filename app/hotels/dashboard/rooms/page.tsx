
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Room = {
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

type RoomForm = {
  room_type: string;
  description: string;
  price_per_night: string;
  capacity: string;
  total_rooms: string;
  amenities: string;
  image_url: string;
  is_active: boolean;
};

const emptyForm: RoomForm = {
  room_type: "",
  description: "",
  price_per_night: "",
  capacity: "2",
  total_rooms: "1",
  amenities: "",
  image_url: "",
  is_active: true,
};

export default function HotelRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getToken = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      throw new Error("Please login to manage your hotel rooms.");
    }

    return session.access_token;
  };

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getToken();

      const response = await fetch("/api/hotels/rooms", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to load rooms.");
      }

      setRooms(Array.isArray(result.rooms) ? result.rooms : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const updateField = (field: keyof RoomForm, value: string | boolean) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const token = await getToken();

      const payload = {
        room_type: form.room_type.trim(),
        description: form.description.trim() || null,
        price_per_night: Number(form.price_per_night),
        capacity: Number(form.capacity),
        total_rooms: Number(form.total_rooms),
        amenities: form.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        image_url: form.image_url.trim() || null,
        is_active: form.is_active,
      };

      const response = await fetch("/api/hotels/rooms", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          editingId ? { ...payload, id: editingId } : payload
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save room.");
      }

      setMessage(result.message || "Room saved successfully.");
      resetForm();
      await loadRooms();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save room."
      );
    } finally {
      setSaving(false);
    }
  };

  const editRoom = (room: Room) => {
    setEditingId(room.id);

    setForm({
      room_type: room.room_type,
      description: room.description || "",
      price_per_night: String(room.price_per_night),
      capacity: String(room.capacity),
      total_rooms: String(room.total_rooms),
      amenities: (room.amenities || []).join(", "),
      image_url: room.image_url || "",
      is_active: room.is_active,
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteRoom = async (roomId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this room?"
    );

    if (!confirmed) return;

    setDeletingId(roomId);
    setError("");
    setMessage("");

    try {
      const token = await getToken();

      const response = await fetch(
        `/api/hotels/rooms?id=${encodeURIComponent(roomId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete room.");
      }

      setMessage(result.message || "Room deleted successfully.");
      await loadRooms();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete room."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const toggleRoomStatus = async (room: Room) => {
    setError("");
    setMessage("");

    try {
      const token = await getToken();

      const response = await fetch("/api/hotels/rooms", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: room.id,
          is_active: !room.is_active,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to update room status.");
      }

      setMessage(
        `Room ${!room.is_active ? "activated" : "deactivated"} successfully.`
      );

      await loadRooms();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update room."
      );
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hotel Room Management
            </h1>
            <p className="mt-2 text-gray-600">
              Add, update and manage your hotel rooms.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/hotels/dashboard"
              className="rounded-lg border bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </a>

            <button
              onClick={loadRooms}
              className="rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        <section className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            {editingId ? "Edit Room" : "Add New Room"}
          </h2>

          <form onSubmit={saveRoom} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Room Type *
                </label>
                <input
                  required
                  maxLength={100}
                  value={form.room_type}
                  onChange={(e) =>
                    updateField("room_type", e.target.value)
                  }
                  placeholder="e.g. Deluxe Double Room"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Price Per Night (PKR) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price_per_night}
                  onChange={(e) =>
                    updateField("price_per_night", e.target.value)
                  }
                  placeholder="5000"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Guest Capacity *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.capacity}
                  onChange={(e) =>
                    updateField("capacity", e.target.value)
                  }
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Total Rooms *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.total_rooms}
                  onChange={(e) =>
                    updateField("total_rooms", e.target.value)
                  }
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Room Description
                </label>
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                  placeholder="Describe room facilities and features..."
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Amenities
                </label>
                <input
                  value={form.amenities}
                  onChange={(e) =>
                    updateField("amenities", e.target.value)
                  }
                  placeholder="WiFi, Air Conditioning, TV, Breakfast"
                  className="w-full rounded-lg border p-3"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate amenities with commas.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Room Image URL
                </label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) =>
                    updateField("image_url", e.target.value)
                  }
                  placeholder="https://example.com/room.jpg"
                  className="w-full rounded-lg border p-3"
                />
              </div>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  updateField("is_active", e.target.checked)
                }
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">
                Make this room active
              </span>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Room"
                    : "Add Room"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border px-6 py-3 font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              Your Rooms ({rooms.length})
            </h2>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">
              Loading rooms...
            </p>
          ) : rooms.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-4xl">🛏️</p>
              <h3 className="mt-3 text-lg font-semibold">
                No Rooms Added Yet
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Use the form above to add your first hotel room.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => (
                <article
                  key={room.id}
                  className="overflow-hidden rounded-xl border bg-white"
                >
                  {room.image_url ? (
                    <img
                      src={room.image_url}
                      alt={room.room_type}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-gray-100 text-6xl">
                      🛏️
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {room.room_type}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          room.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {room.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-2 text-lg font-bold text-green-700">
                      Rs.{" "}
                      {Number(room.price_per_night).toLocaleString()}
                      <span className="text-sm font-normal text-gray-500">
                        {" "}/ night
                      </span>
                    </p>

                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      <p>Guest Capacity: {room.capacity}</p>
                      <p>Total Rooms: {room.total_rooms}</p>
                    </div>

                    {room.description && (
                      <p className="mt-3 line-clamp-3 text-sm text-gray-500">
                        {room.description}
                      </p>
                    )}

                    {room.amenities?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {room.amenities.map((amenity, index) => (
                          <span
                            key={`${amenity}-${index}`}
                            className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        onClick={() => editRoom(room)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => toggleRoomStatus(room)}
                        className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
                      >
                        {room.is_active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => deleteRoom(room.id)}
                        disabled={deletingId === room.id}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === room.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}


"use client";

import { useCallback, useEffect, useState } from "react";

type Hotel = {
  id: string;
  hotel_name: string;
  owner_name: string;
  email: string;
  phone: string;
  whatsapp_number: string | null;
  city: string;
  address: string;
  description: string | null;
  website_url: string | null;
  image_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  const loadHotels = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/hotels", {
        cache: "no-store",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load hotels");
      }

      setHotels(Array.isArray(data.hotels) ? data.hotels : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  async function updateStatus(
    hotelId: string,
    status: "approved" | "rejected"
  ) {
    const action = status === "approved" ? "approve" : "reject";

    if (!window.confirm(`Are you sure you want to ${action} this hotel?`)) {
      return;
    }

    setUpdatingId(hotelId);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/hotels", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: hotelId,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update hotel");
      }

      setMessage(data.message || `Hotel ${status} successfully`);
      await loadHotels();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredHotels = hotels.filter((hotel) => {
    return filter === "all" || hotel.status === filter;
  });

  const pendingCount = hotels.filter(
    (hotel) => hotel.status === "pending"
  ).length;

  const approvedCount = hotels.filter(
    (hotel) => hotel.status === "approved"
  ).length;

  const rejectedCount = hotels.filter(
    (hotel) => hotel.status === "rejected"
  ).length;

  const statusColor = (status: Hotel["status"]) => {
    if (status === "approved") return "#15803d";
    if (status === "rejected") return "#dc2626";
    return "#b45309";
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Hotels Management
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Review and manage hotel registration applications.
            </p>
          </div>

          <button
            onClick={loadHotels}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Hotels", value: hotels.length },
            { label: "Pending", value: pendingCount },
            { label: "Approved", value: approvedCount },
            { label: "Rejected", value: rejectedCount },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 flex flex-wrap gap-2">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                filter === status
                  ? "bg-gray-900 text-white"
                  : "border bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {status === "all" ? "All Hotels" : status}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-600">
            Loading hotel applications...
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
            No hotel applications found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredHotels.map((hotel) => (
              <div
                key={hotel.id}
                className="overflow-hidden rounded-xl border bg-white shadow-sm"
              >
                {hotel.image_url && (
                  <img
                    src={hotel.image_url}
                    alt={hotel.hotel_name}
                    className="h-48 w-full object-cover"
                  />
                )}

                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {hotel.hotel_name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {hotel.city}
                      </p>
                    </div>

                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold capitalize"
                      style={{
                        color: statusColor(hotel.status),
                        backgroundColor:
                          hotel.status === "approved"
                            ? "#dcfce7"
                            : hotel.status === "rejected"
                            ? "#fee2e2"
                            : "#fef3c7",
                      }}
                    >
                      {hotel.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>Owner:</strong> {hotel.owner_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {hotel.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {hotel.phone}
                    </p>

                    {hotel.whatsapp_number && (
                      <p>
                        <strong>WhatsApp:</strong>{" "}
                        {hotel.whatsapp_number}
                      </p>
                    )}

                    <p>
                      <strong>Address:</strong> {hotel.address}
                    </p>

                    {hotel.description && (
                      <p>
                        <strong>Description:</strong>{" "}
                        {hotel.description}
                      </p>
                    )}

                    {hotel.website_url && (
                      <p>
                        <strong>Website:</strong>{" "}
                        <a
                          href={hotel.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-blue-600 underline"
                        >
                          {hotel.website_url}
                        </a>
                      </p>
                    )}

                    <p className="text-xs text-gray-400">
                      Applied:{" "}
                      {new Date(hotel.created_at).toLocaleString()}
                    </p>
                  </div>

                  {hotel.status === "pending" && (
                    <div className="mt-5 flex flex-wrap gap-3 border-t pt-4">
                      <button
                        onClick={() =>
                          updateStatus(hotel.id, "approved")
                        }
                        disabled={updatingId === hotel.id}
                        className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {updatingId === hotel.id
                          ? "Updating..."
                          : "Approve Hotel"}
                      </button>

                      <button
                        onClick={() =>
                          updateStatus(hotel.id, "rejected")
                        }
                        disabled={updatingId === hotel.id}
                        className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject Hotel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

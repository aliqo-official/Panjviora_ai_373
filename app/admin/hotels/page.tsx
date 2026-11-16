
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
    setMessage("");

    try {
      const response = await fetch("/api/admin/hotels", {
        cache: "no-store",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (response.status === 401 || response.status === 403
              ? "Unauthorized: Please sign in again as an admin."
              : "Unable to load hotels.")
        );
      }

      setHotels(Array.isArray(data.hotels) ? data.hotels : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
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
        throw new Error(data.error || "Unable to update hotel.");
      }

      setMessage(data.message || `Hotel ${status} successfully.`);
      await loadHotels();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredHotels = hotels.filter(
    (hotel) => filter === "all" || hotel.status === filter
  );

  const pendingCount = hotels.filter(
    (hotel) => hotel.status === "pending"
  ).length;

  const approvedCount = hotels.filter(
    (hotel) => hotel.status === "approved"
  ).length;

  const rejectedCount = hotels.filter(
    (hotel) => hotel.status === "rejected"
  ).length;

  const stats = [
    { label: "Total Hotels", value: hotels.length },
    { label: "Pending", value: pendingCount },
    { label: "Approved", value: approvedCount },
    { label: "Rejected", value: rejectedCount },
  ];

  const filters = ["all", "pending", "approved", "rejected"];

  const statusStyle = (status: Hotel["status"]) => {
    if (status === "approved") {
      return "border-green-500/40 bg-green-500/15 text-green-300";
    }
    if (status === "rejected") {
      return "border-red-500/40 bg-red-500/15 text-red-300";
    }
    return "border-yellow-500/40 bg-yellow-500/15 text-yellow-300";
  };

  return (
    <main className="min-h-screen bg-[#071b13] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#c9a646]/30 bg-[#103b29] p-6 shadow-xl">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-[#d6b75b]">
              ALIQO Administration
            </p>
            <h1 className="text-2xl font-extrabold text-[#f4d77b] md:text-3xl">
              Hotels Management
            </h1>
            <p className="mt-2 text-sm text-green-100/70">
              Review and manage hotel registration applications.
            </p>
          </div>

          <button
            onClick={loadHotels}
            disabled={loading}
            className="rounded-xl border border-[#e0bd5d] bg-[#d0aa45] px-6 py-3 font-bold text-[#101810] shadow-lg transition hover:bg-[#f0d47b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#c9a646]/30 bg-[#103b29] p-5 shadow-lg transition hover:-translate-y-1 hover:border-[#d6b75b]"
            >
              <p className="text-sm font-medium text-green-100/70">
                {item.label}
              </p>
              <p className="mt-3 text-4xl font-extrabold text-[#f4d77b]">
                {item.value}
              </p>
              <div
                className={`mt-4 h-1 w-14 rounded-full ${
                  index === 0 ? "bg-[#d6b75b]" : "bg-[#27734c]"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Success message */}
        {message && (
          <div className="mb-5 rounded-xl border border-green-400/40 bg-green-900/40 p-4 text-green-200">
            ✓ {message}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-400/40 bg-red-950/50 p-5 text-red-200">
            <p className="font-bold">Request failed</p>
            <p className="mt-2 text-sm">{error}</p>
            <button
              onClick={loadHotels}
              className="mt-4 rounded-lg border border-red-300/40 px-4 py-2 text-sm font-semibold hover:bg-red-900/50"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-[#c9a646]/25 bg-[#103b29] p-4">
          <p className="mb-3 text-sm font-bold text-[#e7ca78]">
            Filter Applications
          </p>

          <div className="flex flex-wrap gap-2">
            {filters.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold capitalize transition ${
                  filter === status
                    ? "border-[#e4c15d] bg-[#d0aa45] text-[#101810]"
                    : "border-green-700 bg-[#071b13] text-green-100 hover:border-[#d6b75b] hover:text-[#f4d77b]"
                }`}
              >
                {status === "all" ? "All Hotels" : status}
              </button>
            ))}
          </div>
        </div>

        {/* Hotel results */}
        {loading ? (
          <div className="rounded-2xl border border-[#c9a646]/30 bg-[#103b29] p-12 text-center text-[#e7ca78]">
            Loading hotel applications...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#c9a646]/20 bg-[#103b29] p-10 text-center text-green-100/70">
            Hotel information could not be loaded. Please resolve the request error above.
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="rounded-2xl border border-[#c9a646]/30 bg-[#103b29] p-12 text-center">
            <p className="text-xl font-bold text-[#f4d77b]">
              No Hotel Applications Found
            </p>
            <p className="mt-2 text-sm text-green-100/60">
              Hotel applications will appear here when submitted.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredHotels.map((hotel) => (
              <div
                key={hotel.id}
                className="overflow-hidden rounded-2xl border border-[#c9a646]/30 bg-[#103b29] shadow-xl transition hover:border-[#d6b75b]"
              >
                {hotel.image_url && (
                  <img
                    src={hotel.image_url}
                    alt={hotel.hotel_name}
                    className="h-52 w-full border-b border-[#c9a646]/30 object-cover"
                  />
                )}

                <div className="p-5">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-[#f4d77b]">
                        {hotel.hotel_name}
                      </h2>
                      <p className="mt-1 text-sm text-green-100/60">
                        {hotel.city}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusStyle(
                        hotel.status
                      )}`}
                    >
                      {hotel.status}
                    </span>
                  </div>

                  <div className="space-y-3 break-words text-sm text-green-50/90">
                    <p>
                      <strong className="text-[#e7ca78]">Owner:</strong>{" "}
                      {hotel.owner_name}
                    </p>
                    <p>
                      <strong className="text-[#e7ca78]">Email:</strong>{" "}
                      {hotel.email}
                    </p>
                    <p>
                      <strong className="text-[#e7ca78]">Phone:</strong>{" "}
                      {hotel.phone}
                    </p>

                    {hotel.whatsapp_number && (
                      <p>
                        <strong className="text-[#e7ca78]">WhatsApp:</strong>{" "}
                        {hotel.whatsapp_number}
                      </p>
                    )}

                    <p>
                      <strong className="text-[#e7ca78]">Address:</strong>{" "}
                      {hotel.address}
                    </p>

                    {hotel.description && (
                      <p>
                        <strong className="text-[#e7ca78]">
                          Description:
                        </strong>{" "}
                        {hotel.description}
                      </p>
                    )}

                    {hotel.website_url && (
                      <p>
                        <strong className="text-[#e7ca78]">Website:</strong>{" "}
                        <a
                          href={hotel.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-[#f4d77b] underline hover:text-white"
                        >
                          {hotel.website_url}
                        </a>
                      </p>
                    )}

                    <p className="border-t border-[#c9a646]/20 pt-3 text-xs text-green-100/50">
                      Applied: {new Date(hotel.created_at).toLocaleString()}
                    </p>
                  </div>

                  {hotel.status === "pending" && (
                    <div className="mt-5 flex flex-wrap gap-3 border-t border-[#c9a646]/25 pt-5">
                      <button
                        onClick={() =>
                          updateStatus(hotel.id, "approved")
                        }
                        disabled={updatingId === hotel.id}
                        className="rounded-lg border border-[#e0bd5d] bg-[#d0aa45] px-5 py-2.5 text-sm font-bold text-[#101810] transition hover:bg-[#f0d47b] disabled:opacity-50"
                      >
                        {updatingId === hotel.id
                          ? "Updating..."
                          : "✓ Approve Hotel"}
                      </button>

                      <button
                        onClick={() =>
                          updateStatus(hotel.id, "rejected")
                        }
                        disabled={updatingId === hotel.id}
                        className="rounded-lg border border-red-400/50 bg-black px-5 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-950 disabled:opacity-50"
                      >
                        ✕ Reject Hotel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 border-t border-[#c9a646]/20 pt-5 text-center text-xs text-green-100/40">
          ALIQO • Hotels Administration
        </div>
      </div>
    </main>
  );
}


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
      return "border-green-200 bg-green-50 text-green-800";
    }

    if (status === "rejected") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    return "border-[#D4AF37]/40 bg-[#F5F0E6] text-[#8A681B]";
  };

  return (
    <main className="min-h-screen bg-[#F5F0E6] p-4 text-[#123D2B] md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8 overflow-hidden rounded-3xl border border-[#D4AF37]/40 bg-[#123D2B] p-6 shadow-xl md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <a
                href="/admin"
                className="text-2xl font-black tracking-wide text-white"
              >
                ALI<span className="text-[#E8C95B]">QO</span>
              </a>

              <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.3em] text-[#E8C95B]">
                ALIQO Administration
              </p>

              <h1 className="text-2xl font-extrabold text-white md:text-3xl">
                Hotels Management
              </h1>

              <p className="mt-2 text-sm text-[#E1E8DF]">
                Review and manage hotel registration applications.
              </p>

              <div className="mt-5 h-1 w-20 rounded-full bg-[#D4AF37]" />
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/admin"
                className="rounded-xl border border-[#D4AF37]/60 px-4 py-3 font-semibold text-[#E8C95B] transition hover:bg-[#1B563C]"
              >
                ← Admin Dashboard
              </a>

              <button
                type="button"
                onClick={loadHotels}
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C95B] px-6 py-3 font-bold text-[#123D2B] shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Loading..." : "↻ Refresh"}
              </button>
            </div>
          </div>
        </header>

        {/* Statistics */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >
              <p className="text-sm font-semibold text-[#68766D]">
                {item.label}
              </p>

              <p className="mt-3 text-4xl font-extrabold text-[#123D2B]">
                {item.value}
              </p>

              <div
                className={`mt-4 h-1 w-14 rounded-full ${
                  index === 0 ? "bg-[#D4AF37]" : "bg-[#1B563C]"
                }`}
              />
            </div>
          ))}
        </section>

        {/* Success Message */}
        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            <p className="font-semibold">✓ {message}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p className="font-bold">Request failed</p>

            <p className="mt-2 break-words text-sm">
              {error}
            </p>

            <button
              type="button"
              onClick={loadHotels}
              disabled={loading}
              className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold transition hover:bg-red-100 disabled:opacity-50"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#123D2B]">
                Hotel Applications
              </h2>

              <p className="mt-1 text-sm text-[#68766D]">
                Filter and review hotel registrations.
              </p>
            </div>

            <span className="text-sm font-semibold text-[#68766D]">
              {filteredHotels.length} of {hotels.length} hotels
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-bold capitalize transition ${
                  filter === status
                    ? "border-[#123D2B] bg-[#123D2B] text-white shadow-sm"
                    : "border-[#DED5C2] bg-[#FDFBF7] text-[#536457] hover:border-[#D4AF37] hover:bg-[#F5F0E6]"
                }`}
              >
                {status === "all" ? "All Hotels" : status}
              </button>
            ))}
          </div>
        </section>

        {/* Hotel Results */}
        {loading ? (
          <div className="rounded-2xl border border-[#DED5C2] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#DED5C2] border-t-[#D4AF37]" />

            <p className="font-semibold text-[#8A681B]">
              Loading hotel applications...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center text-[#68766D]">
            Hotel information could not be loaded. Please resolve the request error above.
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="rounded-2xl border border-[#DED5C2] bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-4xl text-[#B58B2B]">⌂</div>

            <p className="text-xl font-bold text-[#123D2B]">
              No Hotel Applications Found
            </p>

            <p className="mt-2 text-sm text-[#68766D]">
              Hotel applications will appear here when submitted.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredHotels.map((hotel) => (
              <article
                key={hotel.id}
                className="overflow-hidden rounded-2xl border border-[#DED5C2] bg-white shadow-sm transition hover:border-[#D4AF37] hover:shadow-lg"
              >
                {hotel.image_url && (
                  <img
                    src={hotel.image_url}
                    alt={hotel.hotel_name}
                    className="h-52 w-full border-b border-[#DED5C2] object-cover"
                  />
                )}

                <div className="p-5 sm:p-6">
                  {/* Hotel Heading */}
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold tracking-wider text-[#8A681B]">
                        HOTEL PROFILE
                      </p>

                      <h2 className="mt-2 text-xl font-extrabold text-[#123D2B]">
                        {hotel.hotel_name}
                      </h2>

                      <p className="mt-1 text-sm text-[#68766D]">
                        {hotel.city}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${statusStyle(
                        hotel.status
                      )}`}
                    >
                      {hotel.status}
                    </span>
                  </div>

                  {/* Hotel Information */}
                  <div className="space-y-4 rounded-xl border border-[#DED5C2] bg-[#F5F0E6] p-4 text-sm text-[#536457]">
                    <p className="break-words">
                      <strong className="text-[#8A681B]">Owner:</strong>{" "}
                      {hotel.owner_name}
                    </p>

                    <p className="break-words">
                      <strong className="text-[#8A681B]">Email:</strong>{" "}
                      {hotel.email}
                    </p>

                    <p>
                      <strong className="text-[#8A681B]">Phone:</strong>{" "}
                      {hotel.phone}
                    </p>

                    {hotel.whatsapp_number && (
                      <p>
                        <strong className="text-[#8A681B]">WhatsApp:</strong>{" "}
                        {hotel.whatsapp_number}
                      </p>
                    )}

                    <p className="break-words">
                      <strong className="text-[#8A681B]">Address:</strong>{" "}
                      {hotel.address}
                    </p>

                    {hotel.description && (
                      <div>
                        <strong className="text-[#8A681B]">
                          Description:
                        </strong>

                        <p className="mt-1 whitespace-pre-wrap">
                          {hotel.description}
                        </p>
                      </div>
                    )}

                    {hotel.website_url && (
                      <p className="break-words">
                        <strong className="text-[#8A681B]">Website:</strong>{" "}
                        <a
                          href={hotel.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all font-semibold text-[#8A681B] underline transition hover:text-[#123D2B]"
                        >
                          {hotel.website_url}
                        </a>
                      </p>
                    )}

                    <p className="border-t border-[#DED5C2] pt-3 text-xs text-[#68766D]">
                      Applied: {new Date(hotel.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Approval Actions */}
                  {hotel.status === "pending" && (
                    <div className="mt-5 flex flex-wrap gap-3 border-t border-[#DED5C2] pt-5">
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(hotel.id, "approved")
                        }
                        disabled={updatingId === hotel.id}
                        className="rounded-xl bg-[#123D2B] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1B563C] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingId === hotel.id
                          ? "Updating..."
                          : "✓ Approve Hotel"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(hotel.id, "rejected")
                        }
                        disabled={updatingId === hotel.id}
                        className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ✕ Reject Hotel
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 border-t border-[#DED5C2] pt-5 text-center">
          <a
            href="/admin"
            className="font-semibold text-[#8A681B] transition hover:text-[#123D2B] hover:underline"
          >
            ← Back to Admin Dashboard
          </a>

          <p className="mt-4 text-xs text-[#68766D]">
            ALIQO • Hotels Administration
          </p>
        </footer>
      </div>
    </main>
  );
}

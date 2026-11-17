
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Deal = {
  id: number;
  business_name: string;
  contact_name: string;
  email: string;
  title: string;
  description: string;
  category: string;
  offer_url: string | null;
  valid_until: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");

  async function loadDeals() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/deals", {
        cache: "no-store",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        setError("Please log in through the main Admin Dashboard first.");
        setDeals([]);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to load deals.");
      }

      setDeals(Array.isArray(data) ? data : data.deals || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeals();
  }, []);

  async function updateStatus(
    id: number,
    status: "approved" | "rejected" | "pending"
  ) {
    setUpdatingId(id);
    setError("");

    try {
      const response = await fetch("/api/admin/deals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update deal.");
      }

      await loadDeals();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Update failed."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteDeal(id: number) {
    if (!window.confirm("Are you sure you want to delete this deal?")) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      const response = await fetch("/api/admin/deals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete deal.");
      }

      setDeals((current) => current.filter((deal) => deal.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Delete failed."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const pending = deals.filter((deal) => deal.status === "pending").length;
  const approved = deals.filter((deal) => deal.status === "approved").length;
  const rejected = deals.filter((deal) => deal.status === "rejected").length;

  const filteredDeals =
    filter === "all"
      ? deals
      : deals.filter((deal) => deal.status === filter);

  function statusStyle(status: Deal["status"]) {
    if (status === "approved") {
      return "border border-green-200 bg-green-50 text-green-800";
    }

    if (status === "rejected") {
      return "border border-red-200 bg-red-50 text-red-700";
    }

    return "border border-[#D4AF37]/40 bg-[#F5F0E6] text-[#8A681B]";
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-4 py-8 text-[#123D2B] sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-8 rounded-3xl border border-[#D4AF37]/40 bg-[#123D2B] p-6 shadow-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="font-bold tracking-[0.25em] text-[#E8C95B]">
                ALIQO ADMIN
              </p>

              <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Deals Management
              </h1>

              <p className="mt-3 text-sm text-[#E1E8DF] sm:text-base">
                Review and manage submitted business offers.
              </p>

              <div className="mt-5 h-1 w-20 rounded-full bg-[#D4AF37]" />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-xl border border-[#D4AF37]/60 px-4 py-2.5 font-semibold text-[#E8C95B] transition hover:bg-[#1B563C]"
              >
                ← Main Dashboard
              </Link>

              <button
                type="button"
                onClick={loadDeals}
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C95B] px-5 py-2.5 font-bold text-[#123D2B] shadow-sm transition hover:brightness-105 disabled:opacity-50"
              >
                {loading ? "Loading..." : "↻ Refresh"}
              </button>
            </div>
          </div>
        </header>

        {/* Statistics */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Deals",
              count: deals.length,
              icon: "▤",
            },
            {
              label: "Pending",
              count: pending,
              icon: "◷",
            },
            {
              label: "Approved",
              count: approved,
              icon: "✓",
            },
            {
              label: "Rejected",
              count: rejected,
              icon: "×",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#68766D]">
                  {stat.label}
                </p>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E6] text-xl font-bold text-[#A17C26]">
                  {stat.icon}
                </span>
              </div>

              <p className="mt-3 text-3xl font-black text-[#123D2B]">
                {stat.count}
              </p>

              <div className="mt-4 h-1 w-full rounded-full bg-[#F5F0E6]">
                <div className="h-1 w-1/3 rounded-full bg-[#D4AF37]" />
              </div>
            </div>
          ))}
        </section>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <p>{error}</p>

            <p className="mt-2">
              <Link
                href="/admin"
                className="font-bold text-[#8A681B] underline"
              >
                Go to Admin Login
              </Link>
            </p>
          </div>
        )}

        {/* Deals Filter */}
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-[#123D2B]">
              Submitted Deals
            </h2>

            <p className="mt-1 text-sm text-[#68766D]">
              Review business offers and manage their approval status.
            </p>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="min-w-44 rounded-xl border border-[#DED5C2] bg-[#FDFBF7] px-4 py-2.5 text-[#123D2B] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
          >
            <option value="all">All Deals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </section>

        {/* Deals List */}
        {loading ? (
          <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#DED5C2] border-t-[#D4AF37]" />
            <p className="font-semibold text-[#8A681B]">
              Loading deals...
            </p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center shadow-sm">
            <div className="mb-4 text-4xl text-[#B58B2B]">▤</div>

            <p className="text-lg font-bold text-[#123D2B]">
              No deals found.
            </p>

            <p className="mt-2 text-sm text-[#68766D]">
              Submitted offers will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredDeals.map((deal) => (
              <article
                key={deal.id}
                className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:border-[#D4AF37] hover:shadow-lg sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#8A681B]">
                      {deal.business_name} · {deal.category}
                    </p>

                    <h3 className="mt-2 text-xl font-black text-[#123D2B]">
                      {deal.title}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${statusStyle(
                      deal.status
                    )}`}
                  >
                    {deal.status}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap leading-7 text-[#536457]">
                  {deal.description}
                </p>

                <div className="mt-5 grid gap-3 rounded-xl border border-[#DED5C2] bg-[#F5F0E6] p-4 text-sm text-[#536457] sm:grid-cols-2">
                  <p>
                    <strong className="text-[#8A681B]">Contact:</strong>{" "}
                    {deal.contact_name}
                  </p>

                  <p className="break-all">
                    <strong className="text-[#8A681B]">Email:</strong>{" "}
                    {deal.email}
                  </p>

                  <p>
                    <strong className="text-[#8A681B]">Valid Until:</strong>{" "}
                    {deal.valid_until || "Not specified"}
                  </p>

                  <p>
                    <strong className="text-[#8A681B]">Submitted:</strong>{" "}
                    {new Date(deal.created_at).toLocaleString()}
                  </p>
                </div>

                {deal.offer_url && (
                  <p className="mt-4 break-all text-sm">
                    <a
                      href={deal.offer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#8A681B] underline decoration-[#D4AF37] underline-offset-4 hover:text-[#123D2B]"
                    >
                      Visit Offer Website ↗
                    </a>
                  </p>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3 border-t border-[#DED5C2] pt-5">
                  <button
                    type="button"
                    disabled={updatingId === deal.id}
                    onClick={() => updateStatus(deal.id, "approved")}
                    className="rounded-xl bg-[#123D2B] px-5 py-2.5 font-bold text-white transition hover:bg-[#1B563C] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingId === deal.id ? "Updating..." : "✓ Approve"}
                  </button>

                  <button
                    type="button"
                    disabled={updatingId === deal.id}
                    onClick={() => updateStatus(deal.id, "rejected")}
                    className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === deal.id}
                    onClick={() => deleteDeal(deal.id)}
                    className="rounded-xl border border-red-200 px-5 py-2.5 font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === deal.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

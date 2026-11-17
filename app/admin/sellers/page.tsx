
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Seller = {
  user_id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  category: string;
  city: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadSellers() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/sellers", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load sellers");
      }

      setSellers(data.sellers || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSellers();
  }, []);

  async function updateStatus(
    userId: string,
    status: "approved" | "rejected"
  ) {
    const action = status === "approved" ? "approve" : "reject";

    if (!window.confirm(`Are you sure you want to ${action} this seller?`)) {
      return;
    }

    setMessage("");
    setUpdatingId(userId);

    try {
      const response = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update seller");
      }

      setMessage(data.message || "Seller status updated successfully.");
      await loadSellers();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Update failed"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const pending = sellers.filter((s) => s.status === "pending").length;
  const approved = sellers.filter((s) => s.status === "approved").length;
  const rejected = sellers.filter((s) => s.status === "rejected").length;

  const visibleSellers =
    filter === "all"
      ? sellers
      : sellers.filter((s) => s.status === filter);

  const statusStyle = {
    pending:
      "bg-[#F5F0E6] text-[#8A681B] border border-[#D4AF37]/40",
    approved:
      "bg-green-50 text-green-800 border border-green-200",
    rejected:
      "bg-red-50 text-red-700 border border-red-200",
  };

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-4 py-8 text-[#123D2B] sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="rounded-3xl border border-[#D4AF37]/40 bg-[#123D2B] p-6 shadow-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <Link
                href="/admin"
                className="text-2xl font-black tracking-wide text-white"
              >
                ALI<span className="text-[#E8C95B]">QO</span>
              </Link>

              <p className="mt-4 font-bold tracking-[0.2em] text-[#E8C95B]">
                ADMIN MANAGEMENT
              </p>

              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                Seller Applications
              </h1>

              <p className="mt-3 text-sm text-[#E1E8DF] sm:text-base">
                Manage and review seller registration requests.
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
                onClick={loadSellers}
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C95B] px-5 py-2.5 font-bold text-[#123D2B] shadow-sm transition hover:brightness-105 disabled:opacity-50"
              >
                {loading ? "Loading..." : "↻ Refresh"}
              </button>
            </div>
          </div>
        </header>

        {/* Message */}
        {message && (
          <div className="mt-6 break-words rounded-xl border border-[#D4AF37]/40 bg-white p-4 text-sm font-medium text-[#123D2B] shadow-sm">
            {message}
          </div>
        )}

        {/* Statistics */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Sellers",
              value: sellers.length,
              icon: "▤",
            },
            {
              label: "Pending",
              value: pending,
              icon: "◷",
            },
            {
              label: "Approved",
              value: approved,
              icon: "✓",
            },
            {
              label: "Rejected",
              value: rejected,
              icon: "×",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#68766D]">
                  {item.label}
                </p>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E6] text-xl font-bold text-[#A17C26]">
                  {item.icon}
                </span>
              </div>

              <p className="mt-3 text-3xl font-black text-[#123D2B]">
                {item.value}
              </p>

              <div className="mt-4 h-1 w-full rounded-full bg-[#F5F0E6]">
                <div className="h-1 w-1/3 rounded-full bg-[#D4AF37]" />
              </div>
            </div>
          ))}
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#123D2B]">
                Seller Directory
              </h2>

              <p className="mt-1 text-sm text-[#68766D]">
                Review seller registrations and manage approvals.
              </p>
            </div>

            <span className="text-sm font-semibold text-[#68766D]">
              {visibleSellers.length} of {sellers.length} sellers
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {["all", "pending", "approved", "rejected"].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-bold capitalize transition ${
                  filter === item
                    ? "border-[#123D2B] bg-[#123D2B] text-white shadow-sm"
                    : "border-[#DED5C2] bg-[#FDFBF7] text-[#536457] hover:border-[#D4AF37] hover:bg-[#F5F0E6]"
                }`}
              >
                {item === "all" ? "All Sellers" : item}
              </button>
            ))}
          </div>
        </section>

        {/* Sellers List */}
        <section className="mt-6 space-y-5">
          {loading ? (
            <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#DED5C2] border-t-[#D4AF37]" />

              <p className="font-semibold text-[#8A681B]">
                Loading seller applications...
              </p>
            </div>
          ) : visibleSellers.length === 0 ? (
            <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center shadow-sm">
              <div className="mb-4 text-4xl text-[#B58B2B]">♙</div>

              <p className="text-lg font-bold text-[#123D2B]">
                No seller applications found.
              </p>

              <p className="mt-2 text-sm text-[#68766D]">
                New seller registrations will appear here.
              </p>
            </div>
          ) : (
            visibleSellers.map((seller) => (
              <article
                key={seller.user_id}
                className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:border-[#D4AF37] hover:shadow-lg sm:p-6"
              >
                {/* Seller Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold tracking-wider text-[#8A681B]">
                      BUSINESS PROFILE
                    </p>

                    <h2 className="mt-2 text-xl font-black text-[#123D2B]">
                      {seller.business_name}
                    </h2>

                    <p className="mt-1 text-sm text-[#68766D]">
                      Owner: {seller.owner_name}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${statusStyle[seller.status]}`}
                  >
                    {seller.status}
                  </span>
                </div>

                {/* Seller Information */}
                <div className="mt-5 grid gap-4 rounded-xl border border-[#DED5C2] bg-[#F5F0E6] p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="font-semibold text-[#8A681B]">Email</p>
                    <p className="mt-1 break-all text-[#536457]">
                      {seller.email}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-[#8A681B]">Phone</p>
                    <p className="mt-1 text-[#536457]">
                      {seller.phone}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-[#8A681B]">Category</p>
                    <p className="mt-1 text-[#536457]">
                      {seller.category}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-[#8A681B]">City</p>
                    <p className="mt-1 text-[#536457]">
                      {seller.city}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-[#8A681B]">Applied</p>
                    <p className="mt-1 text-[#536457]">
                      {new Date(seller.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {seller.status === "pending" && (
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-[#DED5C2] pt-5">
                    <button
                      type="button"
                      disabled={updatingId === seller.user_id}
                      onClick={() =>
                        updateStatus(seller.user_id, "approved")
                      }
                      className="rounded-xl bg-[#123D2B] px-5 py-2.5 font-bold text-white transition hover:bg-[#1B563C] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === seller.user_id
                        ? "Updating..."
                        : "✓ Approve Seller"}
                    </button>

                    <button
                      type="button"
                      disabled={updatingId === seller.user_id}
                      onClick={() =>
                        updateStatus(seller.user_id, "rejected")
                      }
                      className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject Seller
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </section>

        {/* Footer Navigation */}
        <div className="mt-8 border-t border-[#DED5C2] pt-6">
          <Link
            href="/admin"
            className="font-bold text-[#8A681B] transition hover:text-[#123D2B] hover:underline"
          >
            ← Back to Admin Dashboard
          </Link>
        </div>

      </div>
    </main>
  );
}


"use client";

import { useEffect, useState } from "react";

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

  async function loadSellers() {
    setLoading(true);
    setMessage("");

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
    pending: "border-[#D4AF37]/50 bg-[#F5F0E6] text-[#85631B]",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
    rejected: "border-red-200 bg-red-50 text-red-800",
  };

  const stats = [
    {
      label: "Total Sellers",
      value: sellers.length,
      color: "text-[#123D2B]",
    },
    {
      label: "Pending",
      value: pending,
      color: "text-[#A17C26]",
    },
    {
      label: "Approved",
      value: approved,
      color: "text-emerald-700",
    },
    {
      label: "Rejected",
      value: rejected,
      color: "text-red-700",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-4 py-8 text-[#123D2B] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <a
          href="/admin"
          className="text-3xl font-black tracking-tight text-[#123D2B]"
        >
          ALI<span className="text-[#D4AF37]">QO</span>
        </a>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-[#A17C26]">
              Admin Control Center
            </p>

            <h1 className="text-3xl font-black text-[#123D2B] sm:text-4xl">
              Seller Applications
            </h1>

            <p className="mt-2 text-sm text-[#68766D]">
              Manage and review seller registration requests.
            </p>
          </div>

          <button
            onClick={loadSellers}
            disabled={loading}
            className="rounded-xl border border-[#D4AF37] bg-[#123D2B] px-5 py-2.5 font-semibold text-[#D4AF37] transition hover:bg-[#1B563C] disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-[#D4AF37]/50 bg-white p-4 text-sm text-[#85631B]">
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:border-[#D4AF37]"
            >
              <p className="text-sm font-semibold text-[#68766D]">
                {item.label}
              </p>

              <p className={`mt-3 text-4xl font-black ${item.color}`}>
                {item.value}
              </p>

              <div className="mt-4 h-1 w-12 rounded-full bg-[#D4AF37]" />
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[#DED5C2] bg-white p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#A17C26]">
            Filter Applications
          </p>

          <div className="flex flex-wrap gap-2">
            {["all", "pending", "approved", "rejected"].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-xl border px-5 py-2 text-sm font-semibold capitalize transition ${
                  filter === item
                    ? "border-[#123D2B] bg-[#123D2B] text-[#D4AF37]"
                    : "border-[#DED5C2] bg-[#F5F0E6] text-[#123D2B] hover:border-[#D4AF37]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-[#DED5C2] bg-white p-12 text-center">
              <p className="font-semibold text-[#A17C26]">
                Loading seller applications...
              </p>
            </div>
          ) : visibleSellers.length === 0 ? (
            <div className="rounded-2xl border border-[#DED5C2] bg-white p-12 text-center">
              <div className="mb-4 text-4xl text-[#D4AF37]">◇</div>
              <h2 className="text-xl font-bold text-[#123D2B]">
                No Seller Applications Found
              </h2>
              <p className="mt-2 text-sm text-[#68766D]">
                Applications will appear here when they are successfully loaded.
              </p>
            </div>
          ) : (
            visibleSellers.map((seller) => (
              <div
                key={seller.user_id}
                className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:border-[#D4AF37] sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#123D2B]">
                      {seller.business_name}
                    </h2>

                    <p className="mt-2 text-sm text-[#68766D]">
                      Owner: {seller.owner_name}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-4 py-1.5 text-xs font-bold capitalize ${
                      statusStyle[seller.status]
                    }`}
                  >
                    {seller.status}
                  </span>
                </div>

                <div className="mt-6 grid gap-5 border-t border-[#DED5C2] pt-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <p>
                    <span className="text-[#68766D]">Email</span>
                    <br />
                    <span className="mt-1 inline-block break-all font-medium text-[#123D2B]">
                      {seller.email}
                    </span>
                  </p>

                  <p>
                    <span className="text-[#68766D]">Phone</span>
                    <br />
                    <span className="mt-1 inline-block font-medium text-[#123D2B]">
                      {seller.phone}
                    </span>
                  </p>

                  <p>
                    <span className="text-[#68766D]">Category</span>
                    <br />
                    <span className="mt-1 inline-block font-medium text-[#123D2B]">
                      {seller.category}
                    </span>
                  </p>

                  <p>
                    <span className="text-[#68766D]">City</span>
                    <br />
                    <span className="mt-1 inline-block font-medium text-[#123D2B]">
                      {seller.city}
                    </span>
                  </p>

                  <p>
                    <span className="text-[#68766D]">Applied</span>
                    <br />
                    <span className="mt-1 inline-block font-medium text-[#123D2B]">
                      {new Date(seller.created_at).toLocaleDateString()}
                    </span>
                  </p>
                </div>

                {seller.status === "pending" && (
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-[#DED5C2] pt-5">
                    <button
                      onClick={() =>
                        updateStatus(seller.user_id, "approved")
                      }
                      className="rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-5 py-2.5 font-bold text-[#123D2B] transition hover:bg-[#E8C95B]"
                    >
                      ✓ Approve Seller
                    </button>

                    <button
                      onClick={() =>
                        updateStatus(seller.user_id, "rejected")
                      }
                      className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 font-bold text-red-800 transition hover:bg-red-100"
                    >
                      ✕ Reject Seller
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-10 border-t border-[#DED5C2] pt-6">
          <a
            href="/admin"
            className="font-semibold text-[#85631B] transition hover:text-[#123D2B]"
          >
            ← Back to Admin Dashboard
          </a>

          <p className="mt-6 text-center text-xs text-[#68766D]">
            ALIQO — Discover More. Do More.
          </p>
        </div>
      </div>
    </main>
  );
}

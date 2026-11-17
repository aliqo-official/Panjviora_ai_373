
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type OrderItem = {
  id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
};

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function statusStyle(status: string) {
  switch (status) {
    case "confirmed":
      return "border-green-200 bg-green-50 text-green-800";
    case "shipped":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "delivered":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-[#D4AF37]/40 bg-[#F5F0E6] text-[#8A681B]";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<
    Record<string, OrderStatus>
  >({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (response.status === 401) {
        throw new Error(
          "Admin login required. Please login from the Admin Dashboard first."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load orders.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid orders response.");
      }

      setOrders(data);

      const drafts: Record<string, OrderStatus> = {};

      data.forEach((order: Order) => {
        drafts[order.id] = STATUSES.includes(
          order.status as OrderStatus
        )
          ? (order.status as OrderStatus)
          : "pending";
      });

      setDraftStatuses(drafts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(order: Order) {
    const newStatus = draftStatuses[order.id];

    if (!newStatus || newStatus === order.status) return;

    if (order.status === "cancelled") {
      setError("Cancelled orders cannot be modified.");
      return;
    }

    if (
      newStatus === "cancelled" &&
      !window.confirm(
        "Are you sure you want to cancel this order and restore its stock?"
      )
    ) {
      return;
    }

    setUpdatingId(order.id);
    setError("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: order.id,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Order status update failed.");
      }

      if (newStatus === "cancelled") {
        if (!data || data.success !== true) {
          throw new Error(
            "Order cancellation was not confirmed."
          );
        }

        await loadOrders();
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No order was updated.");
      }

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Status update failed."
      );

      await loadOrders();
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch = [
        order.id,
        order.customer_name,
        order.customer_phone,
        order.delivery_address,
      ].some((value) =>
        (value || "").toLowerCase().includes(query)
      );

      const matchesStatus =
        filter === "all" || order.status === filter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, filter]);

  const pendingCount = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const confirmedCount = orders.filter(
    (order) => order.status === "confirmed"
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.status === "delivered"
  ).length;

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-4 py-8 text-[#123D2B] sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-8 rounded-3xl border border-[#D4AF37]/40 bg-[#123D2B] p-6 shadow-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <Link
                href="/admin"
                className="text-2xl font-black tracking-wide text-white"
              >
                ALI<span className="text-[#E8C95B]">QO</span>
              </Link>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.3em] text-[#E8C95B]">
                ALIQO Administration
              </p>

              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                Orders Management
              </h1>

              <p className="mt-3 text-sm text-[#E1E8DF]">
                Professional order management dashboard
              </p>

              <div className="mt-5 h-1 w-20 rounded-full bg-[#D4AF37]" />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-xl border border-[#D4AF37]/60 px-4 py-3 font-semibold text-[#E8C95B] transition hover:bg-[#1B563C]"
              >
                ← Admin Dashboard
              </Link>

              <button
                type="button"
                onClick={loadOrders}
                disabled={loading || updatingId !== null}
                className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C95B] px-5 py-3 font-bold text-[#123D2B] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Loading..." : "↻ Refresh Orders"}
              </button>
            </div>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">{error}</p>

            {error.includes("Admin login required") && (
              <p className="mt-3">
                <Link
                  href="/admin"
                  className="font-bold text-[#8A681B] underline hover:text-[#123D2B]"
                >
                  Go to Admin Login
                </Link>
              </p>
            )}
          </div>
        )}

        {/* Statistics */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Orders", count: orders.length },
            { label: "Pending", count: pendingCount },
            { label: "Confirmed", count: confirmedCount },
            { label: "Delivered", count: deliveredCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >
              <p className="text-sm font-semibold text-[#68766D]">
                {stat.label}
              </p>

              <p className="mt-3 text-3xl font-black text-[#123D2B]">
                {stat.count}
              </p>

              <div className="mt-4 h-1 w-14 rounded-full bg-[#D4AF37]" />
            </div>
          ))}
        </section>

        {/* Search and Filter */}
        <section className="mb-6 rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-[#123D2B]">
            Search and Filter Orders
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, phone or order ID..."
              className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none placeholder:text-[#8A958C] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none focus:border-[#D4AF37]"
            >
              <option value="all">All Orders</option>

              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <p className="mb-4 text-sm font-semibold text-[#68766D]">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>

        {/* Orders List */}
        {loading ? (
          <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#DED5C2] border-t-[#D4AF37]" />

            <p className="font-semibold text-[#8A681B]">
              Loading orders...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-bold text-[#123D2B]">
              No matching orders found.
            </p>

            <p className="mt-2 text-sm text-[#68766D]">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:border-[#D4AF37] hover:shadow-lg sm:p-6"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-wider text-[#8A681B]">
                      CUSTOMER ORDER
                    </p>

                    <h2 className="mt-2 text-xl font-black text-[#123D2B]">
                      {order.customer_name}
                    </h2>

                    <p className="mt-1 break-all text-xs text-[#68766D]">
                      Order ID: {order.id}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-bold capitalize ${statusStyle(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="mt-5 grid gap-4 rounded-xl border border-[#DED5C2] bg-[#F5F0E6] p-4 text-sm sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-[#8A681B]">
                      Phone:
                    </span>{" "}
                    <span className="text-[#536457]">
                      {order.customer_phone}
                    </span>
                  </p>

                  <p>
                    <span className="font-semibold text-[#8A681B]">
                      Order Date:
                    </span>{" "}
                    <span className="text-[#536457]">
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </p>

                  <p className="break-words sm:col-span-2">
                    <span className="font-semibold text-[#8A681B]">
                      Delivery Address:
                    </span>{" "}
                    <span className="text-[#536457]">
                      {order.delivery_address}
                    </span>
                  </p>
                </div>

                {/* Ordered Products */}
                <div className="mt-5 rounded-xl border border-[#D4AF37]/40 bg-[#123D2B] p-4">
                  <h3 className="mb-4 font-bold text-[#E8C95B]">
                    Ordered Products
                  </h3>

                  {order.order_items?.length ? (
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap justify-between gap-3 border-b border-white/15 pb-3 text-sm last:border-0 last:pb-0"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              {item.product_name}
                            </p>

                            <p className="mt-1 text-[#D9E2D9]">
                              {formatPrice(Number(item.unit_price))} ×{" "}
                              {item.quantity}
                            </p>
                          </div>

                          <p className="font-bold text-[#E8C95B]">
                            {formatPrice(Number(item.subtotal))}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#E1E8DF]">
                      No product details available.
                    </p>
                  )}

                  <div className="mt-4 flex justify-between border-t border-[#D4AF37]/40 pt-4">
                    <span className="font-bold text-white">
                      Order Total
                    </span>

                    <span className="text-lg font-black text-[#E8C95B]">
                      {formatPrice(Number(order.total_amount))}
                    </span>
                  </div>
                </div>

                {/* Status Management */}
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#DED5C2] pt-5">
                  <select
                    value={draftStatuses[order.id] || "pending"}
                    disabled={
                      order.status === "cancelled" ||
                      updatingId !== null
                    }
                    onChange={(e) =>
                      setDraftStatuses((current) => ({
                        ...current,
                        [order.id]: e.target.value as OrderStatus,
                      }))
                    }
                    className="min-w-40 rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none focus:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => updateStatus(order)}
                    disabled={
                      updatingId !== null ||
                      order.status === "cancelled" ||
                      draftStatuses[order.id] === order.status
                    }
                    className="rounded-xl bg-[#123D2B] px-5 py-3 font-bold text-white transition hover:bg-[#1B563C] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {updatingId === order.id
                      ? "Updating..."
                      : "Update Status"}
                  </button>
                </div>

                {order.status === "cancelled" && (
                  <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                    This order is cancelled and can no longer be modified.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 border-t border-[#DED5C2] pt-6 text-center">
          <Link
            href="/admin"
            className="font-semibold text-[#8A681B] transition hover:text-[#123D2B] hover:underline"
          >
            ← Back to Admin Dashboard
          </Link>

          <p className="mt-4 text-xs text-[#68766D]">
            ALIQO • Orders Administration
          </p>
        </footer>
      </div>
    </main>
  );
}

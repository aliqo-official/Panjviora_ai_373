
"use client";

import { useState, type FormEvent } from "react";

type Order = {
  order_id: string;
  status: string;
  created_at: string;
  total_amount: number;
  customer_name: string;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
};

const steps = ["pending", "confirmed", "shipped", "delivered"];

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId.trim(),
          customer_phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Order could not be found.");
      }

      setOrder(data.order);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order ? steps.indexOf(order.status) : -1;

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-4 py-12 text-[#123D2B]">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <a href="/" className="mb-4 inline-block text-2xl font-black tracking-wider text-[#123D2B]">
            ALI<span className="text-[#D4AF37]">QO</span>
          </a>

          <p className="mb-3 text-sm font-bold tracking-[0.3em] text-[#A17C26]">
            ORDER INFORMATION
          </p>

          <h1 className="text-3xl font-bold text-[#123D2B] md:text-4xl">
            Track Your Order
          </h1>

          <p className="mt-3 text-[#68766D]">
            Enter your order details to check your delivery status.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-[#DED5C2] bg-white p-6 shadow-xl shadow-[#123D2B]/5"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#123D2B]">
              Order ID
            </label>

            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter your Order ID"
              required
              className="w-full rounded-xl border border-[#DED5C2] bg-white px-4 py-3 text-[#123D2B] outline-none transition placeholder:text-[#68766D] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#123D2B]">
              Phone Number
            </label>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter checkout phone number"
              required
              className="w-full rounded-xl border border-[#DED5C2] bg-white px-4 py-3 text-[#123D2B] outline-none transition placeholder:text-[#68766D] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full border border-[#D4AF37] bg-[#123D2B] px-5 py-3 font-bold text-white shadow-md transition hover:bg-[#1B563C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Checking Order..." : "Track Order"}
          </button>
        </form>

        {order && (
          <section className="mt-8 space-y-6 rounded-2xl border border-[#DED5C2] bg-white p-6 shadow-xl shadow-[#123D2B]/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[#123D2B]">
                Order Details
              </h2>

              <span className="rounded-full border border-[#D4AF37]/40 bg-[#F5F0E6] px-4 py-2 text-sm font-semibold capitalize text-[#123D2B]">
                {order.status}
              </span>
            </div>

            <div className="space-y-2 text-sm text-[#68766D]">
              <p className="break-all">
                <strong className="text-[#123D2B]">Order ID:</strong>{" "}
                {order.order_id}
              </p>

              <p>
                <strong className="text-[#123D2B]">Customer:</strong>{" "}
                {order.customer_name}
              </p>

              <p>
                <strong className="text-[#123D2B]">Order Date:</strong>{" "}
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-bold text-[#123D2B]">
                Delivery Progress
              </h3>

              {order.status === "cancelled" ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
                  This order has been cancelled.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {steps.map((step, index) => {
                    const completed = currentStep >= index;

                    return (
                      <div key={step} className="text-center">
                        <div
                          className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            completed
                              ? "bg-[#D4AF37] text-[#123D2B]"
                              : "bg-[#DED5C2] text-[#68766D]"
                          }`}
                        >
                          {completed ? "✓" : index + 1}
                        </div>

                        <p
                          className={`text-xs capitalize ${
                            completed
                              ? "font-semibold text-[#123D2B]"
                              : "text-[#68766D]"
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 font-bold text-[#123D2B]">
                Ordered Products
              </h3>

              {order.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between gap-4 border-b border-[#DED5C2] py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-[#123D2B]">
                      {item.product_name}
                    </p>

                    <p className="text-[#68766D]">
                      Rs {Number(item.unit_price).toLocaleString()} ×{" "}
                      {item.quantity}
                    </p>
                  </div>

                  <p className="font-semibold text-[#123D2B]">
                    Rs {Number(item.subtotal).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-between border-t border-[#D4AF37]/40 pt-4 text-lg font-bold">
              <span className="text-[#123D2B]">Order Total</span>

              <span className="text-[#A17C26]">
                Rs {Number(order.total_amount).toLocaleString()}
              </span>
            </div>
          </section>
        )}

        <div className="mt-8 text-center">
          <a
            href="/marketplace"
            className="text-sm font-semibold text-[#A17C26] transition hover:text-[#123D2B] hover:underline"
          >
            ← Continue Shopping
          </a>
        </div>
      </div>
    </main>
  );
}

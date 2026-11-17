
"use client";

import { useEffect, useState, type FormEvent } from "react";

type CartItem = {
  id?: string;
  product_id?: string;
  product_name: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("aliqo_cart");

      if (savedCart) {
        const parsed: unknown = JSON.parse(savedCart);

        if (Array.isArray(parsed)) {
          const normalized = parsed.map((item: CartItem) => ({
            ...item,
            product_id: item.product_id || item.id || "",
            quantity: Number(item.quantity),
            price: Number(item.price),
          }));

          setCart(normalized);
        }
      }
    } catch {
      setError("Unable to read your cart. Please check your cart again.");
    } finally {
      setLoaded(true);
    }
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(price);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const customerName = name.trim();
    const customerPhone = phone.trim();
    const deliveryAddress = address.trim();

    if (!customerName || !customerPhone || !deliveryAddress) {
      setError("Please complete all customer details.");
      return;
    }

    if (
      customerName.length > 120 ||
      customerPhone.length > 30 ||
      deliveryAddress.length > 500
    ) {
      setError("Please check your customer details.");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const validCart = cart.every(
      (item) =>
        typeof item.product_id === "string" &&
        item.product_id.length > 0 &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= 100
    );

    if (!validCart) {
      setError(
        "Invalid cart information. Please return to your cart and try again."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          delivery_address: deliveryAddress,
          items: cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Could not place your order.");
        return;
      }

      if (
        typeof result.order_id !== "string" ||
        !result.order_id
      ) {
        setError("Order confirmation could not be verified.");
        return;
      }

      setOrderId(result.order_id);

      localStorage.removeItem("aliqo_cart");
      setCart([]);
    } catch {
      setError("Connection problem. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      <header className="border-b border-[#D4AF37]/30 bg-[#123D2B] px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/" className="text-3xl font-black tracking-tight text-white">
            ALI<span className="text-[#D4AF37]">QO</span>
          </a>

          <a
            href="/cart"
            className="rounded-full border border-[#D4AF37] px-5 py-2 text-sm font-bold text-[#E8C95B] transition hover:bg-[#D4AF37] hover:text-[#123D2B]"
          >
            Back to Cart
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {orderId ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-[#D4AF37]/50 bg-white p-10 text-center shadow-xl shadow-[#123D2B]/10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#123D2B] text-3xl text-[#D4AF37]">
              ✓
            </div>

            <h1 className="mt-5 text-3xl font-black text-[#123D2B]">
              Order Placed Successfully!
            </h1>

            <p className="mt-4 text-[#68766D]">
              Thank you for shopping with ALIQO.
            </p>

            <p className="mt-5 text-sm text-[#68766D]">
              Your Order ID:
            </p>

            <p className="mt-2 break-all font-bold text-[#A17C26]">
              {orderId}
            </p>

            <a
              href="/marketplace"
              className="mt-8 inline-block rounded-xl border border-[#D4AF37] bg-[#123D2B] px-8 py-3 font-bold text-white transition hover:bg-[#1B563C]"
            >
              Continue Shopping
            </a>
          </div>
        ) : (
          <>
            <h1 className="mb-10 text-4xl font-black text-[#123D2B]">
              Guest Checkout
            </h1>

            {!loaded ? (
              <p className="text-[#68766D]">
                Loading checkout...
              </p>
            ) : cart.length === 0 ? (
              <div className="rounded-3xl border border-[#DED5C2] bg-white p-10 text-center shadow-lg shadow-[#123D2B]/5">
                <h2 className="text-2xl font-bold text-[#123D2B]">
                  Your cart is empty
                </h2>

                <p className="mt-3 text-[#68766D]">
                  Add products to your cart before proceeding to checkout.
                </p>

                <a
                  href="/marketplace"
                  className="mt-6 inline-block rounded-xl border border-[#D4AF37] bg-[#123D2B] px-8 py-3 font-bold text-white transition hover:bg-[#1B563C]"
                >
                  Explore Marketplace
                </a>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-3">
                <form
                  onSubmit={placeOrder}
                  className="space-y-6 rounded-2xl border border-[#DED5C2] bg-white p-6 shadow-lg shadow-[#123D2B]/5 lg:col-span-2"
                >
                  <h2 className="text-2xl font-bold text-[#123D2B]">
                    Delivery Information
                  </h2>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#123D2B]">
                      Full Name
                    </label>

                    <input
                      required
                      maxLength={120}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-[#DED5C2] bg-[#F5F0E6] px-4 py-3 text-[#123D2B] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#123D2B]">
                      Phone Number
                    </label>

                    <input
                      required
                      maxLength={30}
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full rounded-xl border border-[#DED5C2] bg-[#F5F0E6] px-4 py-3 text-[#123D2B] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#123D2B]">
                      Complete Delivery Address
                    </label>

                    <textarea
                      required
                      maxLength={500}
                      rows={4}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House number, street, area, city"
                      className="w-full rounded-xl border border-[#DED5C2] bg-[#F5F0E6] px-4 py-3 text-[#123D2B] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || cart.length === 0}
                    className="w-full rounded-xl border border-[#D4AF37] bg-[#123D2B] px-6 py-4 font-bold text-white transition hover:bg-[#1B563C] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Placing Your Order..."
                      : "Place Order"}
                  </button>
                </form>

                <aside className="h-fit rounded-2xl border border-[#DED5C2] bg-white p-6 shadow-lg shadow-[#123D2B]/5">
                  <h2 className="text-xl font-bold text-[#123D2B]">
                    Order Summary
                  </h2>

                  <div className="mt-5 space-y-4">
                    {cart.map((item, index) => (
                      <div
                        key={item.product_id || index}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span className="text-[#68766D]">
                          {item.product_name} × {item.quantity}
                        </span>

                        <span className="whitespace-nowrap font-semibold text-[#A17C26]">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-between border-t border-[#DED5C2] pt-5 text-lg font-bold">
                    <span className="text-[#123D2B]">Total</span>

                    <span className="text-[#A17C26]">
                      {formatPrice(total)}
                    </span>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-[#68766D]">
                    Final prices and stock availability are verified when
                    your order is submitted.
                  </p>
                </aside>
              </div>
            )}
          </>
        )}
      </section>

      <footer className="border-t border-[#D4AF37]/30 bg-[#123D2B] px-6 py-8 text-center text-sm text-[#F5F0E6]">
        © 2026 ALIQO. All rights reserved.
      </footer>
    </main>
  );
}

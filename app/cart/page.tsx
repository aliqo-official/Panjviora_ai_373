
"use client";

import { useEffect, useState } from "react";

type CartItem = {
  id: string;
  product_name: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("aliqo_cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch {
      setCart([]);
    }
    setLoaded(true);
  }, []);

  function saveCart(updatedCart: CartItem[]) {
    setCart(updatedCart);
    localStorage.setItem("aliqo_cart", JSON.stringify(updatedCart));
  }

  function increaseQuantity(id: string) {
    const updated = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    saveCart(updated);
  }

  function decreaseQuantity(id: string) {
    const updated = cart
      .map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter((item) => item.quantity > 0);

    saveCart(updated);
  }

  function removeItem(id: string) {
    saveCart(cart.filter((item) => item.id !== id));
  }

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      <header className="border-b border-[#D4AF37]/30 bg-[#123D2B] px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/" className="text-3xl font-black tracking-tight text-white">
            ALI<span className="text-[#D4AF37]">QO</span>
          </a>

          <a
            href="/marketplace"
            className="rounded-full border border-[#D4AF37] px-5 py-2 text-sm font-bold text-[#E8C95B] transition hover:bg-[#D4AF37] hover:text-[#123D2B]"
          >
            Continue Shopping
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-10 text-4xl font-black text-[#123D2B]">
          Shopping Cart
        </h1>

        {!loaded ? (
          <p className="text-[#68766D]">Loading your cart...</p>
        ) : cart.length === 0 ? (
          <div className="rounded-3xl border border-[#DED5C2] bg-white p-12 text-center shadow-lg shadow-[#123D2B]/5">
            <h2 className="text-2xl font-bold text-[#123D2B]">
              Your cart is empty
            </h2>

            <p className="mt-3 text-[#68766D]">
              Explore ALIQO Marketplace and add products to your cart.
            </p>

            <a
              href="/marketplace"
              className="mt-7 inline-block rounded-xl border border-[#D4AF37] bg-[#123D2B] px-8 py-3 font-bold text-white transition hover:bg-[#1B563C]"
            >
              Explore Marketplace
            </a>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-5 rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-md shadow-[#123D2B]/5 sm:flex-row sm:items-center"
                >
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#DED5C2] bg-[#F5F0E6]">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="font-black text-[#A17C26]">
                        ALIQO
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-[#123D2B]">
                      {item.product_name}
                    </h2>

                    <p className="mt-2 font-medium text-[#A17C26]">
                      {formatPrice(Number(item.price))}
                    </p>

                    <div className="mt-4 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.id)}
                        aria-label={`Decrease quantity of ${item.product_name}`}
                        className="h-9 w-9 rounded-lg border border-[#D4AF37] text-xl font-bold text-[#123D2B] transition hover:bg-[#F5F0E6]"
                      >
                        −
                      </button>

                      <span className="font-bold text-[#123D2B]">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => increaseQuantity(item.id)}
                        aria-label={`Increase quantity of ${item.product_name}`}
                        className="h-9 w-9 rounded-lg border border-[#D4AF37] text-xl font-bold text-[#123D2B] transition hover:bg-[#F5F0E6]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-bold text-[#A17C26]">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="mt-4 text-sm font-medium text-red-600 underline transition hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-2xl border border-[#DED5C2] bg-white p-6 shadow-lg shadow-[#123D2B]/5">
              <h2 className="text-xl font-bold text-[#123D2B]">
                Order Summary
              </h2>

              <div className="mt-6 flex justify-between text-[#68766D]">
                <span>Items</span>
                <span className="font-semibold text-[#123D2B]">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>

              <div className="mt-4 flex justify-between border-t border-[#DED5C2] pt-4 text-lg font-bold">
                <span className="text-[#123D2B]">Total</span>
                <span className="text-[#A17C26]">
                  {formatPrice(total)}
                </span>
              </div>

              <a
                href="/checkout"
                className="mt-8 block w-full rounded-xl border border-[#D4AF37] bg-[#123D2B] px-5 py-4 text-center font-bold text-white transition hover:bg-[#1B563C]"
              >
                Proceed to Checkout
              </a>

              <p className="mt-3 text-center text-xs text-[#68766D]">
                Secure checkout will be available soon.
              </p>
            </aside>
          </div>
        )}
      </section>

      <footer className="border-t border-[#D4AF37]/30 bg-[#123D2B] px-6 py-8 text-center text-sm text-[#F5F0E6]">
        © 2026 ALIQO. All rights reserved.
      </footer>
    </main>
  );
}

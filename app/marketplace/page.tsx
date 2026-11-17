
"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  product_name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  stock_quantity: number;
};

type CartItem = {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  image_url: string | null;
};

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/marketplace/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Products could not be loaded");
        }

        const data = await response.json();
        setProducts(data.products || []);
      } catch {
        setError("Marketplace is temporarily unavailable. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();

    // Keep older cart entries compatible with Cart and Checkout pages.
    try {
      const savedCart = localStorage.getItem("aliqo_cart");

      if (savedCart) {
        const parsed: unknown = JSON.parse(savedCart);

        if (Array.isArray(parsed)) {
          const normalizedCart: CartItem[] = parsed.map((item) => ({
            ...item,
            id: item.id || item.product_id,
            product_id: item.product_id || item.id,
          }));

          localStorage.setItem(
            "aliqo_cart",
            JSON.stringify(normalizedCart)
          );
        }
      }
    } catch {
      // Leave invalid cart data untouched; addToCart will show an error.
    }
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(price);

  function addToCart(product: Product) {
    try {
      if (product.stock_quantity <= 0) {
        setMessage("Sorry, this product is out of stock.");
        return;
      }

      const savedCart = localStorage.getItem("aliqo_cart");
      const parsed: unknown = savedCart ? JSON.parse(savedCart) : [];

      if (!Array.isArray(parsed)) {
        throw new Error("Invalid cart data");
      }

      const cart: CartItem[] = parsed.map((item) => ({
        ...item,
        id: item.id || item.product_id,
        product_id: item.product_id || item.id,
      }));

      const existingIndex = cart.findIndex(
        (item) => item.product_id === product.id
      );

      if (existingIndex !== -1) {
        if (cart[existingIndex].quantity >= product.stock_quantity) {
          setMessage("You cannot add more than the available stock.");
          return;
        }

        cart[existingIndex].quantity += 1;
      } else {
        cart.push({
          id: product.id,
          product_id: product.id,
          product_name: product.product_name,
          price: Number(product.price),
          quantity: 1,
          image_url: product.image_url,
        });
      }

      localStorage.setItem("aliqo_cart", JSON.stringify(cart));

      setMessage(`${product.product_name} added to your cart!`);
    } catch {
      setMessage("Unable to add product. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      <header className="border-b border-[#D4AF37]/30 bg-[#123D2B]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <a
            href="/"
            className="text-3xl font-black tracking-wider text-white"
          >
            ALI<span className="text-[#D4AF37]">QO</span>
          </a>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/cart"
              className="rounded-full border border-[#D4AF37] px-5 py-2 text-sm font-bold text-[#E8C95B] transition hover:bg-[#D4AF37] hover:text-[#123D2B]"
            >
              Shopping Cart
            </a>

            <a
              href="/"
              className="rounded-full border border-[#D4AF37]/60 px-5 py-2 text-sm font-bold text-[#E8C95B] transition hover:bg-[#D4AF37] hover:text-[#123D2B]"
            >
              Back to Home
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#A17C26]">
            Discover • Shop • Explore
          </p>

          <h1 className="text-4xl font-black text-[#123D2B] md:text-6xl">
            ALIQO <span className="text-[#A17C26]">Marketplace</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-[#68766D]">
            Explore products from ALIQO sellers, all in one place.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className="mb-8 rounded-xl border border-[#D4AF37]/50 bg-white p-4 text-center font-medium text-[#123D2B] shadow-sm"
          >
            {message}
          </div>
        )}

        {loading && (
          <p className="py-16 text-center font-semibold text-[#A17C26]">
            Loading products...
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="py-16 text-center font-medium text-red-700"
          >
            {error}
          </p>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl border border-[#DED5C2] bg-white px-6 py-16 text-center shadow-lg shadow-[#123D2B]/5">
            <h2 className="text-2xl font-bold text-[#123D2B]">
              Coming Soon
            </h2>

            <p className="mt-3 text-[#68766D]">
              Approved products will appear here soon.
            </p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-[#DED5C2] bg-white shadow-md shadow-[#123D2B]/5 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-xl hover:shadow-[#123D2B]/10"
              >
                <div className="flex h-56 items-center justify-center bg-[#F5F0E6]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl font-black text-[#A17C26]">
                      ALIQO
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#A17C26]">
                    {product.category}
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-[#123D2B]">
                    {product.product_name}
                  </h2>

                  <p className="mt-2 min-h-12 text-sm text-[#68766D]">
                    {product.description ||
                      "Explore this product on ALIQO."}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-lg font-bold text-[#A17C26]">
                      {formatPrice(Number(product.price))}
                    </span>

                    <span className="text-xs text-[#68766D]">
                      {product.stock_quantity > 0
                        ? `${product.stock_quantity} in stock`
                        : "Out of stock"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={product.stock_quantity <= 0}
                    className="mt-5 w-full rounded-xl border border-[#D4AF37] bg-[#123D2B] px-5 py-3 font-bold text-white transition hover:bg-[#1B563C] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {product.stock_quantity > 0
                      ? "Add to Cart"
                      : "Out of Stock"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-[#D4AF37]/30 bg-[#123D2B] px-6 py-8 text-center text-sm text-[#F5F0E6]">
        © 2026 ALIQO. All rights reserved.
      </footer>
    </main>
  );
}

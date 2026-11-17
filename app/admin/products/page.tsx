
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  seller_id: string;
  product_name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  stock_quantity: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/products", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load products");
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    const message =
      status === "approved"
        ? "Are you sure you want to approve this product?"
        : "Are you sure you want to reject this product?";

    if (!window.confirm(message)) return;

    setUpdating(id);
    setError("");

    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Product update failed");
      }

      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(null);
    }
  }

  const counts = useMemo(
    () => ({
      all: products.length,
      pending: products.filter((p) => p.status === "pending").length,
      approved: products.filter((p) => p.status === "approved").length,
      rejected: products.filter((p) => p.status === "rejected").length,
    }),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter = filter === "all" || product.status === filter;
      const term = search.toLowerCase().trim();

      const matchesSearch =
        product.product_name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.seller_id.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [products, filter, search]);

  const money = (price: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 2,
    }).format(price);

  function getStatusStyle(status: Product["status"]) {
    switch (status) {
      case "approved":
        return "border-green-200 bg-green-50 text-green-800";
      case "rejected":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-[#D4AF37]/40 bg-[#F5F0E6] text-[#8A681B]";
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6] p-4 text-[#123D2B] sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8 rounded-3xl border border-[#D4AF37]/40 bg-[#123D2B] p-6 shadow-xl md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <Link
                href="/admin"
                className="text-sm font-semibold text-[#E8C95B] transition hover:text-white hover:underline"
              >
                ← Back to Admin Dashboard
              </Link>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.3em] text-[#E8C95B]">
                ALIQO Administration
              </p>

              <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">
                Product Approval
              </h1>

              <p className="mt-3 text-sm text-[#E1E8DF]">
                Review and manage products submitted by sellers.
              </p>

              <div className="mt-5 h-1 w-20 rounded-full bg-[#D4AF37]" />
            </div>

            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C95B] px-5 py-3 font-bold text-[#123D2B] shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "↻ Refresh Products"}
            </button>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Statistics */}
        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "All Products", value: counts.all },
            { label: "Pending", value: counts.pending },
            { label: "Approved", value: counts.approved },
            { label: "Rejected", value: counts.rejected },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >
              <p className="text-sm font-semibold text-[#68766D]">
                {item.label}
              </p>

              <p className="mt-3 text-3xl font-black text-[#123D2B]">
                {item.value}
              </p>

              <div className="mt-4 h-1 w-12 rounded-full bg-[#D4AF37]" />
            </div>
          ))}
        </section>

        {/* Product Management */}
        <section className="rounded-2xl border border-[#DED5C2] bg-white p-4 shadow-sm md:p-6">

          <div className="mb-6">
            <h2 className="text-xl font-black text-[#123D2B]">
              Manage Seller Products
            </h2>

            <p className="mt-1 text-sm text-[#68766D]">
              Search, review, approve or reject seller submissions.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, category or seller ID..."
              className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] px-4 py-3 text-[#123D2B] outline-none placeholder:text-[#8A958C] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 md:max-w-md"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-[#DED5C2] bg-[#FDFBF7] px-4 py-3 text-[#123D2B] outline-none focus:border-[#D4AF37]"
            >
              <option value="all">All Products</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <p className="mb-5 text-sm font-semibold text-[#68766D]">
            Showing {filteredProducts.length} of {products.length} products
          </p>

          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#DED5C2] border-t-[#D4AF37]" />

              <p className="font-semibold text-[#8A681B]">
                Loading products...
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-[#DED5C2] bg-[#F5F0E6] py-14 text-center">
              <p className="text-xl font-bold text-[#123D2B]">
                No products found
              </p>

              <p className="mt-2 text-sm text-[#68766D]">
                Seller submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-[#DED5C2] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
                >
                  {/* Product Image */}
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      className="h-52 w-full bg-[#F5F0E6] object-cover"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-[#F5F0E6] text-sm font-semibold text-[#8A681B]">
                      No Product Image
                    </div>
                  )}

                  <div className="p-5">

                    {/* Category and Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8A681B]">
                        {product.category}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusStyle(product.status)}`}
                      >
                        {product.status}
                      </span>
                    </div>

                    {/* Product Information */}
                    <h2 className="mt-3 text-xl font-black text-[#123D2B]">
                      {product.product_name}
                    </h2>

                    <p className="mt-2 text-lg font-black text-[#8A681B]">
                      {money(Number(product.price))}
                    </p>

                    <div className="mt-4 rounded-xl border border-[#DED5C2] bg-[#F5F0E6] p-3">
                      <p className="text-sm font-semibold text-[#536457]">
                        Stock Quantity:{" "}
                        <span className="font-black text-[#123D2B]">
                          {product.stock_quantity}
                        </span>
                      </p>
                    </div>

                    <p className="mt-3 break-all text-xs text-[#68766D]">
                      <span className="font-bold text-[#8A681B]">
                        Seller ID:
                      </span>{" "}
                      {product.seller_id}
                    </p>

                    {product.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#536457]">
                        {product.description}
                      </p>
                    )}

                    <p className="mt-4 border-t border-[#DED5C2] pt-3 text-xs text-[#68766D]">
                      Submitted:{" "}
                      {new Date(product.created_at).toLocaleString()}
                    </p>

                    {/* Approval Actions */}
                    {product.status === "pending" && (
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => updateStatus(product.id, "approved")}
                          disabled={updating === product.id}
                          className="rounded-xl bg-[#123D2B] px-3 py-3 font-bold text-white transition hover:bg-[#1B563C] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updating === product.id
                            ? "Please wait..."
                            : "✓ Approve"}
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(product.id, "rejected")}
                          disabled={updating === product.id}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-8 border-t border-[#DED5C2] pt-6 text-center">
          <Link
            href="/admin"
            className="font-semibold text-[#8A681B] transition hover:text-[#123D2B] hover:underline"
          >
            ← Back to Admin Dashboard
          </Link>

          <p className="mt-3 text-sm text-[#68766D]">
            ALIQO Admin • Product Management
          </p>
        </footer>
      </div>
    </main>
  );
}

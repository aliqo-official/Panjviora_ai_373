
"use client";

import { useEffect, useState, type FormEvent } from "react";

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

export default function SellerDashboard() {
  const [seller, setSeller] = useState<Seller | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImage, setProductImage] = useState("");
  const [productStock, setProductStock] = useState("0");

  const [savingProduct, setSavingProduct] = useState(false);
  const [productMessage, setProductMessage] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const inputClass =
    "w-full rounded-xl border border-[#DED5C2] bg-white px-4 py-3.5 text-[#123D2B] outline-none transition placeholder:text-[#68766D] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20";

  async function loadSeller(token: string) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Database configuration missing");
    }

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      throw new Error("Session expired. Please login again.");
    }

    const user = await userResponse.json();

    const response = await fetch(
      `${supabaseUrl}/rest/v1/sellers?user_id=eq.${encodeURIComponent(user.id)}&select=*`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error("Unable to load seller information");
    }

    if (!data.length) {
      throw new Error("Seller account not found. Please register first.");
    }

    setSeller(data[0]);
    localStorage.setItem("aliqo_seller_token", token);

    const productResponse = await fetch(
      `${supabaseUrl}/rest/v1/products?seller_id=eq.${encodeURIComponent(user.id)}&select=*&order=created_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const productData = await productResponse.json();

    if (productResponse.ok) {
      setProducts(productData);
      setProductMessage("");
    } else {
      setProducts([]);
      setProductMessage(
        productData.message ||
          productData.details ||
          "Unable to load products. Please check database permissions."
      );
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("aliqo_seller_token");

    if (savedToken) {
      loadSeller(savedToken)
        .catch((error) => {
          localStorage.removeItem("aliqo_seller_token");
          setMessage(
            error instanceof Error ? error.message : "Session expired"
          );
        })
        .finally(() => setCheckingSession(false));
    } else {
      setCheckingSession(false);
    }
  }, []);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Database configuration missing");
      }

      const response = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.access_token) {
        throw new Error(
          data.msg || data.message || "Invalid email or password"
        );
      }

      await loadSeller(data.access_token);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("aliqo_seller_token");
    setSeller(null);
    setProducts([]);
    setPassword("");
    setMessage("You have been logged out.");
  }

  async function handleAddProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProductMessage("");

    if (!seller || seller.status !== "approved") {
      setProductMessage("Only approved sellers can add products.");
      return;
    }

    const price = Number(productPrice);
    const stock = Number(productStock);

    if (!productName.trim() || !productCategory.trim()) {
      setProductMessage("Please enter product name and category.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setProductMessage("Please enter a valid product price.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setProductMessage("Stock must be a whole number and cannot be negative.");
      return;
    }

    const token = localStorage.getItem("aliqo_seller_token");

    if (!token || !supabaseUrl || !supabaseKey) {
      setProductMessage("Please login again.");
      return;
    }

    setSavingProduct(true);

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/products`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify([
          {
            seller_id: seller.user_id,
            product_name: productName.trim(),
            description: productDescription.trim() || null,
            price,
            category: productCategory.trim(),
            image_url: productImage.trim() || null,
            stock_quantity: stock,
            status: "pending",
          },
        ]),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.details ||
            data.hint ||
            "Unable to save product. Please check database permissions."
        );
      }

      if (!Array.isArray(data) || !data.length) {
        throw new Error("Product was not returned by the database.");
      }

      setProducts((previous) => [data[0], ...previous]);

      setProductName("");
      setProductDescription("");
      setProductPrice("");
      setProductCategory("");
      setProductImage("");
      setProductStock("0");

      setProductMessage("Product submitted successfully for admin approval.");
    } catch (error) {
      setProductMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSavingProduct(false);
    }
  }

  const statusConfig = {
    pending: {
      label: "Pending Review",
      style: "bg-[#FFF4D6] text-[#946B08] border-[#E8C95B]",
      dot: "bg-[#D4AF37]",
      description:
        "Your application is under review. You can add products after approval.",
    },
    approved: {
      label: "Approved",
      style: "bg-[#E4F1E8] text-[#123D2B] border-[#9CC6A8]",
      dot: "bg-[#1B563C]",
      description:
        "Your seller account is approved. You can now submit products for review.",
    },
    rejected: {
      label: "Rejected",
      style: "bg-red-50 text-red-800 border-red-200",
      dot: "bg-red-500",
      description: "Please contact ALIQO support for further assistance.",
    },
  };

  const productStatusStyle = {
    pending: "bg-[#FFF4D6] text-[#946B08]",
    approved: "bg-[#E4F1E8] text-[#123D2B]",
    rejected: "bg-red-50 text-red-800",
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F0E6] px-5">
        <div className="text-center">
          <p className="text-3xl font-black text-[#123D2B]">
            ALIQO<span className="text-[#D4AF37]">.</span>
          </p>
          <p className="mt-4 text-sm text-[#68766D]">
            Loading your seller dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-5 py-10 text-[#123D2B]">
      <div className="mx-auto max-w-5xl">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <a
            href="/"
            className="text-3xl font-black tracking-tight text-[#123D2B]"
          >
            ALIQO<span className="text-[#D4AF37]">.</span>
          </a>

          <a
            href="/"
            className="rounded-full border border-[#123D2B]/20 px-5 py-2 text-sm font-semibold text-[#123D2B] transition hover:bg-[#123D2B] hover:text-white"
          >
            ← Back to Home
          </a>
        </nav>

        {!seller ? (
          <div className="mx-auto mt-12 max-w-md overflow-hidden rounded-3xl border border-[#DED5C2] bg-white shadow-xl shadow-[#123D2B]/10">
            <div className="bg-[#123D2B] px-8 py-10 text-white">
              <span className="inline-block rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold tracking-widest text-[#E8C95B]">
                ALIQO SELLER PORTAL
              </span>

              <h1 className="mt-6 text-3xl font-black">
                Seller Dashboard
              </h1>

              <p className="mt-3 text-sm leading-7 text-white/75">
                Login to manage your seller account and products.
              </p>
            </div>

            <div className="p-8">
              {message && (
                <div className="mt-1 rounded-xl border border-[#E8C95B] bg-[#FFF4D6] p-4 text-sm leading-6 text-[#765707]">
                  {message}
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#123D2B] py-4 font-bold text-white shadow-lg shadow-[#123D2B]/15 transition hover:bg-[#1B563C] hover:text-[#E8C95B] disabled:opacity-50"
                >
                  {loading ? "Please wait..." : "Login to Dashboard →"}
                </button>
              </form>

              <div className="mt-7 border-t border-[#DED5C2] pt-6 text-center">
                <p className="text-sm text-[#68766D]">
                  New seller?{" "}
                  <a
                    href="/seller/register"
                    className="font-bold text-[#123D2B] underline decoration-[#D4AF37] underline-offset-4 hover:text-[#B18B20]"
                  >
                    Register here
                  </a>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-12 overflow-hidden rounded-3xl bg-[#123D2B] p-8 text-white shadow-xl md:p-10">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div>
                  <span className="inline-block rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold tracking-widest text-[#E8C95B]">
                    SELLER ACCOUNT
                  </span>

                  <h1 className="mt-5 text-3xl font-black md:text-4xl">
                    Welcome, {seller.owner_name}
                  </h1>

                  <p className="mt-3 text-white/75">
                    Manage your ALIQO seller account and products.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-[#D4AF37]/50 px-6 py-3 text-sm font-bold text-[#E8C95B] transition hover:bg-[#D4AF37] hover:text-[#123D2B]"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="mt-7 grid gap-6 md:grid-cols-2">
              <section className="rounded-3xl border border-[#DED5C2] bg-white p-7 shadow-sm md:col-span-2">
                <p className="text-sm font-bold uppercase tracking-widest text-[#B18B20]">
                  Your Business
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#123D2B]">
                  Business Information
                </h2>

                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  {[
                    ["Business Name", seller.business_name],
                    ["Owner Name", seller.owner_name],
                    ["Email Address", seller.email],
                    ["Phone Number", seller.phone],
                    ["Category", seller.category],
                    ["City", seller.city],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#DED5C2] bg-[#F5F0E6] p-4"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-[#68766D]">
                        {label}
                      </p>
                      <p className="mt-2 break-words font-semibold text-[#123D2B]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-[#DED5C2] bg-white p-7 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-widest text-[#B18B20]">
                  Application
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#123D2B]">
                  Account Status
                </h2>

                <div
                  className={`mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${statusConfig[seller.status].style}`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${statusConfig[seller.status].dot}`}
                  />
                  {statusConfig[seller.status].label}
                </div>

                <p className="mt-5 text-sm leading-7 text-[#68766D]">
                  {statusConfig[seller.status].description}
                </p>
              </section>

              <section className="rounded-3xl border border-[#DED5C2] bg-white p-7 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-widest text-[#B18B20]">
                  Marketplace
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#123D2B]">
                  Product Overview
                </h2>

                <p className="mt-5 text-4xl font-black text-[#123D2B]">
                  {products.length}
                </p>

                <p className="mt-2 text-sm text-[#68766D]">
                  Total products submitted
                </p>
              </section>

              {seller.status === "approved" && (
                <section className="rounded-3xl border border-[#DED5C2] bg-white p-7 shadow-sm md:col-span-2">
                  <p className="text-sm font-bold uppercase tracking-widest text-[#B18B20]">
                    Marketplace
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-[#123D2B]">
                    Add New Product
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#68766D]">
                    Submit your product details. New products will remain
                    pending until reviewed by ALIQO admin.
                  </p>

                  <form
                    onSubmit={handleAddProduct}
                    className="mt-7 grid gap-5 sm:grid-cols-2"
                  >
                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                        Product Name *
                      </label>
                      <input
                        required
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Enter product name"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                        Category *
                      </label>
                      <input
                        required
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        placeholder="e.g. Electronics"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                        Price (PKR) *
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        placeholder="Enter price"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                        Stock Quantity *
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        value={productStock}
                        onChange={(e) => setProductStock(e.target.value)}
                        placeholder="Available quantity"
                        className={inputClass}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                        Product Image URL
                      </label>
                      <input
                        type="url"
                        value={productImage}
                        onChange={(e) => setProductImage(e.target.value)}
                        placeholder="https://example.com/product-image.jpg"
                        className={inputClass}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                        Product Description
                      </label>
                      <textarea
                        rows={4}
                        value={productDescription}
                        onChange={(e) =>
                          setProductDescription(e.target.value)
                        }
                        placeholder="Describe your product..."
                        className={inputClass}
                      />
                    </div>

                    {productMessage && (
                      <div className="sm:col-span-2 rounded-xl border border-[#DED5C2] bg-[#F5F0E6] p-4 text-sm leading-6 text-[#123D2B]">
                        {productMessage}
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={savingProduct}
                        className="w-full rounded-xl bg-[#123D2B] px-6 py-4 font-bold text-white transition hover:bg-[#1B563C] hover:text-[#E8C95B] disabled:opacity-50 sm:w-auto"
                      >
                        {savingProduct ? "Saving Product..." : "Submit Product →"}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              <section className="rounded-3xl border border-[#DED5C2] bg-white p-7 shadow-sm md:col-span-2">
                <p className="text-sm font-bold uppercase tracking-widest text-[#B18B20]">
                  Your Inventory
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#123D2B]">
                  My Products
                </h2>

                {productMessage && products.length === 0 && (
                  <p className="mt-4 rounded-xl border border-[#E8C95B] bg-[#FFF4D6] p-4 text-sm text-[#765707]">
                    {productMessage}
                  </p>
                )}

                {products.length === 0 ? (
                  <p className="mt-5 rounded-xl bg-[#F5F0E6] p-5 text-sm text-[#68766D]">
                    No products added yet.
                  </p>
                ) : (
                  <div className="mt-6 space-y-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-col gap-4 rounded-2xl border border-[#DED5C2] p-5 sm:flex-row sm:items-center"
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.product_name}
                            className="h-24 w-24 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-[#F5F0E6] text-3xl text-[#123D2B]">
                            ▦
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-lg font-bold text-[#123D2B]">
                            {product.product_name}
                          </h3>

                          <p className="mt-1 text-sm text-[#68766D]">
                            {product.category} · Stock: {product.stock_quantity}
                          </p>

                          <p className="mt-2 font-bold text-[#123D2B]">
                            Rs. {Number(product.price).toLocaleString("en-PK")}
                          </p>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-bold ${productStatusStyle[product.status]}`}
                        >
                          {product.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-[#D4AF37]/40 bg-[#FFF4D6] p-7 shadow-sm md:col-span-2">
                <p className="text-sm font-bold uppercase tracking-widest text-[#946B08]">
                  ALIQO Proposed Commission
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-5xl font-black text-[#123D2B]">
                      5%
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[#68766D]">
                      Proposed commission on completed sales only.
                      Cancelled or refunded orders are excluded.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#D4AF37]/40 bg-white px-6 py-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#68766D]">
                      Example Sale
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#123D2B]">
                      Rs. 10,000
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#946B08]">
                      Proposed fee: Rs. 500
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        <footer className="py-9 text-center text-sm text-[#68766D]">
          © 2026 ALIQO. All rights reserved.
          <p className="mt-2 font-semibold text-[#123D2B]">
            ALIQO — Discover More. Do More.
          </p>
        </footer>
      </div>
    </main>
  );
}

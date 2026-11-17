
"use client";

import { useEffect, useState } from "react";

type Seller = {
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  category: string;
  city: string;
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
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
    setPassword("");
    setMessage("You have been logged out.");
  }

  const statusConfig = {
    pending: {
      title: "Waiting for Admin Approval",
      label: "Pending Review",
      style: "bg-amber-50 text-[#85631B] border-[#D4AF37]/40",
      dot: "bg-amber-500",
      description:
        "Your application is under review. You can add products after approval.",
    },
    approved: {
      title: "Your Seller Account is Approved",
      label: "Approved",
      style: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-500",
      description:
        "Your account is approved. Product selling features will be available as they are added to ALIQO.",
    },
    rejected: {
      title: "Your Seller Application was Rejected",
      label: "Rejected",
      style: "bg-red-50 text-red-800 border-red-200",
      dot: "bg-red-500",
      description:
        "Please contact ALIQO support for further assistance.",
    },
  };

  const inputClass =
    "w-full rounded-xl border border-[#DED5C2] bg-white px-4 py-3.5 text-[#123D2B] outline-none transition placeholder:text-[#68766D] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20";

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F0E6] px-5">
        <div className="text-center">
          <p className="text-3xl font-black text-[#123D2B]">
            ALI<span className="text-[#D4AF37]">QO</span>
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
            ALI<span className="text-[#D4AF37]">QO</span>
          </a>

          <a
            href="/"
            className="rounded-full border border-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#123D2B] transition hover:bg-[#123D2B] hover:text-[#D4AF37]"
          >
            ← Back to Home
          </a>
        </nav>

        {!seller ? (
          <div className="mx-auto mt-12 max-w-md overflow-hidden rounded-3xl border border-[#DED5C2] bg-white shadow-xl">
            <div className="bg-[#123D2B] px-8 py-10 text-white">
              <span className="inline-block rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold tracking-widest text-[#D4AF37]">
                ALIQO SELLER PORTAL
              </span>

              <h1 className="mt-6 text-3xl font-black">
                Seller Dashboard
              </h1>

              <p className="mt-3 text-sm leading-7 text-[#F5F0E6]/80">
                Login to manage your seller account and view your business
                information.
              </p>
            </div>

            <div className="p-8">
              {message && (
                <div className="mt-1 rounded-xl border border-[#D4AF37]/40 bg-[#F5F0E6] p-4 text-sm leading-6 text-[#85631B]">
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
                  disabled={loading}
                  className="w-full rounded-xl bg-[#123D2B] py-4 font-bold text-[#D4AF37] shadow-lg transition hover:bg-[#1B563C] disabled:opacity-50"
                >
                  {loading ? "Please wait..." : "Login to Dashboard →"}
                </button>
              </form>

              <div className="mt-7 border-t border-[#DED5C2] pt-6 text-center">
                <p className="text-sm text-[#68766D]">
                  New seller?{" "}
                  <a
                    href="/seller/register"
                    className="font-bold text-[#123D2B] transition hover:text-[#A17C26]"
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
                  <span className="inline-block rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold tracking-widest text-[#D4AF37]">
                    SELLER ACCOUNT
                  </span>

                  <h1 className="mt-5 text-3xl font-black md:text-4xl">
                    Welcome, {seller.owner_name}
                  </h1>

                  <p className="mt-3 text-[#F5F0E6]/80">
                    Manage your ALIQO seller account.
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="rounded-full border border-[#D4AF37]/50 px-6 py-3 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#123D2B]"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="mt-7 grid gap-6 md:grid-cols-2">
              <section className="rounded-3xl border border-[#DED5C2] bg-white p-7 shadow-sm md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-[#A17C26]">
                      Your Business
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-[#123D2B]">
                      Business Information
                    </h2>
                  </div>

                  <span className="rounded-full bg-[#F5F0E6] px-4 py-2 text-xs font-bold text-[#123D2B]">
                    ALIQO SELLER
                  </span>
                </div>

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
                <p className="text-sm font-bold uppercase tracking-widest text-[#A17C26]">
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

                <p className="mt-5 font-bold text-[#123D2B]">
                  {statusConfig[seller.status].title}
                </p>

                <p className="mt-3 text-sm leading-7 text-[#68766D]">
                  {statusConfig[seller.status].description}
                </p>
              </section>

              <section className="rounded-3xl border border-[#DED5C2] bg-white p-7 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-widest text-[#A17C26]">
                  Marketplace
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#123D2B]">
                  Products
                </h2>

                <div className="mt-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F5F0E6] text-3xl text-[#123D2B]">
                  <span aria-hidden="true">▦</span>
                </div>

                <p className="mt-5 font-bold text-[#123D2B]">
                  Product Management
                </p>
                <p className="mt-2 text-sm leading-7 text-[#68766D]">
                  Product management tools are coming soon. They will be
                  available as ALIQO marketplace features are launched.
                </p>
              </section>

              <section className="rounded-3xl border border-[#D4AF37]/40 bg-[#F5F0E6] p-7 shadow-sm md:col-span-2">
                <p className="text-sm font-bold uppercase tracking-widest text-[#85631B]">
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
                    <p className="mt-1 text-sm font-semibold text-[#85631B]">
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

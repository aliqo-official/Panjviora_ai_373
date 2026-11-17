
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function SellerRegisterPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (active && !error) {
        setToken(data.session?.access_token || "");
        setEmail(data.session?.user.email || "");
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setToken(session?.access_token || "");
        setEmail(session?.user.email || "");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          setToken(data.session.access_token);
          setMessage(
            "Account created successfully! Now complete your seller registration."
          );
        } else {
          setMessage(
            "Account created! Please check your email for confirmation, then log in."
          );
          setMode("login");
        }
      } else {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (error) throw error;

        if (!data.session) {
          throw new Error("Login session could not be created.");
        }

        setToken(data.session.access_token);
        setMessage(
          "Login successful! Now complete your seller registration."
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegistration(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setToken("");
        throw new Error("Your login session has expired. Please login again.");
      }

      const response = await fetch("/api/sellers/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          business_name: businessName,
          owner_name: ownerName,
          phone,
          category,
          city,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setMessage(
        data.message ||
          "Congratulations! Your seller application has been submitted and is waiting for admin approval."
      );

      setBusinessName("");
      setOwnerName("");
      setPhone("");
      setCategory("");
      setCity("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setToken("");
      setPassword("");
      setMessage("You have been logged out successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to log out."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#DED5C2] bg-white px-4 py-3.5 text-[#123D2B] outline-none transition placeholder:text-[#68766D] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20";

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-5 py-10 text-[#123D2B]">
      <div className="mx-auto max-w-5xl">
        <nav className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="text-3xl font-black tracking-tight text-[#123D2B]"
          >
            ALIQO<span className="text-[#D4AF37]">.</span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-[#123D2B]/20 px-5 py-2 text-sm font-semibold text-[#123D2B] transition hover:bg-[#123D2B] hover:text-white"
          >
            ← Back to Home
          </Link>
        </nav>

        <div className="mt-12 grid overflow-hidden rounded-3xl border border-[#DED5C2] bg-white shadow-xl shadow-[#123D2B]/10 md:grid-cols-2">
          <section className="relative overflow-hidden bg-[#123D2B] p-8 text-white md:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-[#D4AF37]/25" />
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border border-[#D4AF37]/25" />

            <span className="inline-block rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold tracking-widest text-[#E8C95B]">
              ALIQO SELLER PROGRAM
            </span>

            <h1 className="mt-9 text-4xl font-black leading-tight md:text-5xl">
              Grow Your
              <span className="block text-[#D4AF37]">
                Business With ALIQO
              </span>
            </h1>

            <p className="mt-6 leading-8 text-white/80">
              Join our growing marketplace. Create your seller account,
              introduce your products and reach more customers.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-xl font-bold text-[#123D2B]">
                  1
                </span>
                <div>
                  <h3 className="font-bold text-white">Free Registration</h3>
                  <p className="mt-1 text-sm text-white/70">
                    No seller account registration fee.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-xl font-bold text-[#123D2B]">
                  2
                </span>
                <div>
                  <h3 className="font-bold text-white">Admin Approval</h3>
                  <p className="mt-1 text-sm text-white/70">
                    Your application will be reviewed by ALIQO.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-xl font-bold text-[#123D2B]">
                  3
                </span>
                <div>
                  <h3 className="font-bold text-white">Start Selling</h3>
                  <p className="mt-1 text-sm text-white/70">
                    Product selling tools will be available after approval
                    and launch.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 rounded-2xl border border-[#D4AF37]/30 bg-white/5 p-5">
              <p className="text-sm font-semibold text-[#E8C95B]">
                ALIQO PROPOSED COMMISSION
              </p>
              <p className="mt-2 text-4xl font-black text-white">5%</p>
              <p className="mt-2 text-sm text-white/70">
                On completed sales only. No commission on cancelled or
                refunded orders.
              </p>
            </div>
          </section>

          <section className="p-7 md:p-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-[#B18B20]">
                Seller Account
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#123D2B]">
                {token ? "Business Information" : "Join ALIQO Today"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#68766D]">
                {token
                  ? "Complete your business details to submit your seller application."
                  : "Create your account or login to continue."}
              </p>
            </div>

            {message && (
              <div className="mt-6 rounded-xl border border-[#D4AF37]/40 bg-[#F5F0E6] p-4 text-sm leading-6 text-[#123D2B]">
                {message}
              </div>
            )}

            {!token ? (
              <>
                <div className="mt-8 grid grid-cols-2 rounded-xl bg-[#F5F0E6] p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setMessage("");
                    }}
                    className={`rounded-lg py-3 text-sm font-bold transition ${
                      mode === "signup"
                        ? "bg-[#123D2B] text-white shadow"
                        : "text-[#123D2B] hover:bg-white"
                    }`}
                  >
                    Create Account
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setMessage("");
                    }}
                    className={`rounded-lg py-3 text-sm font-bold transition ${
                      mode === "login"
                        ? "bg-[#123D2B] text-white shadow"
                        : "text-[#123D2B] hover:bg-white"
                    }`}
                  >
                    Login
                  </button>
                </div>

                <form onSubmit={handleAuth} className="mt-7 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
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
                      minLength={6}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      placeholder="Minimum 6 characters"
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
                    {loading
                      ? "Please wait..."
                      : mode === "signup"
                        ? "Create Seller Account →"
                        : "Login to Continue →"}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-[#68766D]">
                  Already using ALIQO?{" "}
                  <Link
                    href="/login?next=%2Fseller%2Fregister"
                    className="font-bold text-[#123D2B] underline decoration-[#D4AF37] underline-offset-4"
                  >
                    Open shared login
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DED5C2] bg-[#F5F0E6] p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#1B563C]">
                      Logged in account
                    </p>
                    <p className="mt-1 break-all text-sm font-bold text-[#123D2B]">
                      {email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loading}
                    className="text-sm font-bold text-red-700 underline disabled:opacity-50"
                  >
                    Logout
                  </button>
                </div>

                <form
                  onSubmit={handleRegistration}
                  className="mt-7 space-y-4"
                >
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                      Business Name
                    </label>
                    <input
                      required
                      maxLength={150}
                      placeholder="Your business name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                      Owner Full Name
                    </label>
                    <input
                      required
                      maxLength={150}
                      placeholder="Your full name"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                      Phone Number
                    </label>
                    <input
                      required
                      type="tel"
                      maxLength={40}
                      placeholder="03XX XXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                      Business Category
                    </label>
                    <select
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Food">Food</option>
                      <option value="Home & Living">Home & Living</option>
                      <option value="Beauty">Beauty</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                      City
                    </label>
                    <input
                      required
                      maxLength={100}
                      placeholder="Your city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#123D2B] py-4 font-bold text-white shadow-lg transition hover:bg-[#1B563C] hover:text-[#E8C95B] disabled:opacity-50"
                  >
                    {loading ? "Submitting..." : "Submit Seller Application →"}
                  </button>
                </form>
              </>
            )}

            <div className="mt-7 border-t border-[#DED5C2] pt-5 text-center">
              <p className="text-xs leading-6 text-[#68766D]">
                Registration is free. The proposed 5% commission applies
                only to completed sales. Selling features will be enabled
                after approval and launch.
              </p>
              <p className="mt-4 text-sm font-bold text-[#123D2B]">
                ALIQO — Discover More. Do More.
              </p>
            </div>
          </section>
        </div>

        <footer className="py-8 text-center text-sm text-[#68766D]">
          © 2026 ALIQO. All rights reserved.
        </footer>
      </div>
    </main>
  );
}


"use client";

import { useState } from "react";

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function handleAuth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Database configuration missing");
      }

      const url =
        mode === "signup"
          ? `${supabaseUrl}/auth/v1/signup`
          : `${supabaseUrl}/auth/v1/token?grant_type=password`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.msg ||
            data.message ||
            data.error_description ||
            "Authentication failed"
        );
      }

      if (!data.access_token) {
        setMessage(
          "Account created! Please verify your email, then return here and login."
        );
        setMode("login");
        return;
      }

      setToken(data.access_token);
      setMessage("Login successful! Now complete your seller registration.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegistration(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/sellers/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  const inputClass =
    "w-full rounded-xl border border-[#DED5C2] bg-white p-3.5 text-[#123D2B] outline-none transition placeholder:text-[#68766D] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20";

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-5 py-12 text-[#123D2B]">
      <div className="mx-auto max-w-xl">
        <a href="/" className="text-3xl font-black tracking-tight text-[#123D2B]">
          ALI<span className="text-[#D4AF37]">QO</span>
        </a>

        <div className="mt-8 overflow-hidden rounded-3xl border border-[#DED5C2] bg-white shadow-xl">
          <div className="bg-[#123D2B] px-7 py-9 text-white">
            <span className="inline-block rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold tracking-widest text-[#D4AF37]">
              ALIQO SELLER PORTAL
            </span>

            <h1 className="mt-6 text-3xl font-black">
              Become an ALIQO Seller
            </h1>

            <p className="mt-3 leading-7 text-[#F5F0E6]/80">
              Create your seller account and start your journey with ALIQO.
              Registration is free.
            </p>
          </div>

          <div className="p-7">
            {message && (
              <div className="mt-1 rounded-xl border border-[#D4AF37]/40 bg-[#F5F0E6] p-4 text-sm leading-6 text-[#85631B]">
                {message}
              </div>
            )}

            {!token ? (
              <>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setMessage("");
                    }}
                    className={`flex-1 rounded-xl py-3 font-semibold transition ${
                      mode === "signup"
                        ? "bg-[#123D2B] text-[#D4AF37]"
                        : "bg-[#F5F0E6] text-[#123D2B] hover:bg-[#DED5C2]"
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
                    className={`flex-1 rounded-xl py-3 font-semibold transition ${
                      mode === "login"
                        ? "bg-[#123D2B] text-[#D4AF37]"
                        : "bg-[#F5F0E6] text-[#123D2B] hover:bg-[#DED5C2]"
                    }`}
                  >
                    Login
                  </button>
                </div>

                <form onSubmit={handleAuth} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
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
                      placeholder="Password (minimum 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <button
                    disabled={loading}
                    className="w-full rounded-xl bg-[#123D2B] py-3.5 font-bold text-[#D4AF37] transition hover:bg-[#1B563C] disabled:opacity-50"
                  >
                    {loading
                      ? "Please wait..."
                      : mode === "signup"
                        ? "Create Seller Account"
                        : "Login"}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={handleRegistration} className="mt-5 space-y-4">
                <h2 className="text-xl font-black text-[#123D2B]">
                  Business Information
                </h2>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                    Business Name
                  </label>
                  <input
                    required
                    placeholder="Business Name"
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
                    placeholder="Owner Full Name"
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
                    placeholder="Phone Number"
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
                    <option value="">Select Business Category</option>
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
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full rounded-xl bg-[#123D2B] py-3.5 font-bold text-[#D4AF37] transition hover:bg-[#1B563C] disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Seller Application"}
                </button>
              </form>
            )}

            <p className="mt-7 border-t border-[#DED5C2] pt-6 text-center text-sm leading-6 text-[#68766D]">
              Seller registration is free. ALIQO's proposed commission is 5%
              on completed sales.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm font-semibold text-[#123D2B] transition hover:text-[#A17C26]"
          >
            ← Back to ALIQO Home
          </a>
        </div>
      </div>
    </main>
  );
}

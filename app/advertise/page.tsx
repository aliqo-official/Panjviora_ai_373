
"use client";

import { useState } from "react";

export default function AdvertisePage() {
  const [business, setBusiness] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const inputStyle =
    "w-full rounded-xl border border-[#DED5C2] bg-white p-4 text-[#123D2B] placeholder:text-[#68766D] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setSuccess("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/advertising_requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            business_name: business,
            contact_name: name,
            email,
            phone,
            advertising_details: message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setSuccess(
        "Your advertising request has been submitted successfully. Our team will contact you by email."
      );

      setBusiness("");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      {/* Header */}
      <nav className="border-b border-[#D4AF37]/30 bg-[#123D2B] px-5 py-5 shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a
            href="/"
            className="text-3xl font-black tracking-wide text-white"
          >
            ALI<span className="text-[#D4AF37]">QO</span>.
          </a>

          <a
            href="/"
            className="rounded-full border border-[#D4AF37] px-6 py-2.5 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#123D2B]"
          >
            Home
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#DED5C2] px-5 py-16 text-center sm:py-20">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-80 w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#D4AF37]/15 via-white/70 to-[#123D2B]/10 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl">
          <span className="inline-block rounded-full border border-[#D4AF37]/50 bg-white px-5 py-2 text-xs font-bold tracking-[0.2em] text-[#85631B]">
            ALIQO BUSINESS PARTNERS
          </span>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-[#123D2B] sm:text-5xl md:text-6xl">
            Advertise with
            <span className="block text-[#B08B22]">ALIQO</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#68766D] sm:text-lg">
            Promote your business, reach new customers and grow your
            brand with ALIQO advertising.
          </p>

          <div className="mx-auto mt-8 h-1 w-24 rounded-full bg-[#D4AF37]" />
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Advertising Benefits */}
          <div className="rounded-3xl border border-[#DED5C2] bg-white p-8 shadow-sm transition hover:shadow-lg md:p-10">
            <div className="inline-flex rounded-2xl border border-[#D4AF37]/30 bg-[#F5F0E6] p-4 text-3xl">
              🌍
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[#B08B22]">
              Business Growth
            </p>

            <h2 className="mt-3 text-2xl font-black text-[#123D2B]">
              Why advertise with ALIQO?
            </h2>

            <div className="mt-9 space-y-8">
              <div className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F0E6] font-bold text-[#B08B22]">
                  01
                </span>
                <div>
                  <h3 className="font-bold text-[#123D2B]">
                    Sponsored Search Results
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#68766D]">
                    Promote your business in clearly labeled sponsored
                    search placements.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F0E6] font-bold text-[#B08B22]">
                  02
                </span>
                <div>
                  <h3 className="font-bold text-[#123D2B]">
                    Featured Business
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#68766D]">
                    Showcase your business name, website and services
                    to potential customers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F0E6] font-bold text-[#B08B22]">
                  03
                </span>
                <div>
                  <h3 className="font-bold text-[#123D2B]">
                    Custom Advertising
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#68766D]">
                    Discuss advertising options and pricing directly
                    with our team.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-10 rounded-2xl border border-[#D4AF37]/40 bg-[#F5F0E6] p-6">
              <h3 className="text-lg font-bold text-[#123D2B]">
                Contact ALIQO
              </h3>

              <p className="mt-2 text-sm text-[#68766D]">
                Have questions about advertising? Contact our team.
              </p>

              <a
                href="mailto:aliqo37311011@gmail.com"
                className="mt-4 block break-all font-bold text-[#1B563C] transition hover:text-[#B08B22]"
              >
                aliqo37311011@gmail.com
              </a>
            </div>
          </div>

          {/* Advertising Form */}
          <div className="rounded-3xl border border-[#D4AF37]/50 bg-white p-8 shadow-lg shadow-[#123D2B]/5 md:p-10">
            <div className="mb-8">
              <span className="inline-block rounded-full bg-[#F5F0E6] px-4 py-2 text-xs font-bold tracking-[0.2em] text-[#85631B]">
                PARTNER WITH US
              </span>

              <h2 className="mt-5 text-2xl font-black text-[#123D2B]">
                Advertising Request
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#68766D]">
                Tell us about your business. Our team will discuss
                suitable advertising options with you.
              </p>
            </div>

            {success && (
              <div
                role="status"
                className="mb-6 rounded-xl border border-[#1B563C]/20 bg-[#F0F5EF] p-4 text-sm font-semibold leading-6 text-[#123D2B]"
              >
                <span className="mr-2 text-[#1B563C]">✓</span>
                {success}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123D2B]">
                  Business Name
                </label>
                <input
                  required
                  maxLength={150}
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  placeholder="Enter your business name"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123D2B]">
                  Your Name
                </label>
                <input
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123D2B]">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123D2B]">
                  Phone Number
                </label>
                <input
                  required
                  type="tel"
                  maxLength={30}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123D2B]">
                  Advertising Details
                </label>
                <textarea
                  required
                  maxLength={3000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your advertising needs"
                  rows={5}
                  className={`${inputStyle} resize-y`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#123D2B] px-5 py-4 font-bold text-white shadow-md transition hover:bg-[#1B563C] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Submitting Request..."
                  : "Submit Advertising Request →"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-6 text-[#68766D]">
              Your information will be handled securely and used
              to respond to your advertising request.
            </p>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-12 rounded-3xl border border-[#DED5C2] bg-white p-8 text-center shadow-sm">
          <p className="text-sm leading-7 text-[#68766D]">
            All paid placements will be clearly identified as
            Sponsored advertisements.
          </p>

          <p className="mt-4 font-bold tracking-wide text-[#123D2B]">
            ALIQO — One Platform. Endless Possibilities.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/30 bg-[#123D2B] px-5 py-9 text-center text-sm text-white/75">
        <a href="/" className="text-2xl font-black text-white">
          ALI<span className="text-[#D4AF37]">QO</span>
        </a>

        <p className="mt-3">One Platform. Endless Possibilities.</p>

        <div className="mt-6 flex flex-wrap justify-center gap-6">
          <a href="/" className="transition hover:text-[#D4AF37]">
            Home
          </a>
          <a href="/advertisements" className="transition hover:text-[#D4AF37]">
            Advertisements
          </a>
          <a href="/deals" className="transition hover:text-[#D4AF37]">
            Deals
          </a>
        </div>

        <p className="mt-8 text-xs text-white/50">
          © 2026 ALIQO. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

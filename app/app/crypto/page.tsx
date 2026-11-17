
"use client";

import Link from "next/link";

const partners = [
  {
    name: "Binance",
    category: "Cryptocurrency Exchange",
    description:
      "Explore cryptocurrency markets, trading tools and digital asset services.",
    status: "Affiliate partnership pending",
    initials: "B",
  },
  {
    name: "Bybit",
    category: "Cryptocurrency Exchange",
    description:
      "Discover crypto trading products, market information and platform features.",
    status: "Affiliate partnership pending",
    initials: "By",
  },
];

export default function CryptoPage() {
  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      <header className="border-b border-[#D4AF37]/30 bg-[#123D2B] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-black">
            ALI<span className="text-[#D4AF37]">QO</span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-[#D4AF37]/50 px-5 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-white/10"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 py-20 text-center sm:py-28">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-80 w-[700px] -translate-x-1/2 rounded-full bg-[#D4AF37]/15 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl">
          <span className="inline-flex rounded-full border border-[#D4AF37]/50 bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-[#8A6B1F]">
            ALIQO Crypto Hub
          </span>

          <h1 className="mt-7 text-4xl font-black tracking-tight text-[#123D2B] sm:text-6xl">
            Explore the World of{" "}
            <span className="bg-gradient-to-r from-[#8A6B1F] to-[#D4AF37] bg-clip-text text-transparent">
              Crypto
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#68766D] sm:text-lg">
            Discover cryptocurrency platforms, learn about digital assets
            and explore useful resources in one place.
          </p>

          <a
            href="#partners"
            className="mt-9 inline-flex rounded-full bg-[#D4AF37] px-8 py-4 text-sm font-black text-[#123D2B] shadow-md transition hover:-translate-y-1 hover:bg-[#E8C95B]"
          >
            Explore Crypto Partners ↓
          </a>
        </div>
      </section>

      <section id="partners" className="px-5 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A6B1F]">
              PARTNER PLATFORMS
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#123D2B]">
              Explore Crypto Platforms
            </h2>

            <p className="mt-3 text-sm text-[#68766D]">
              Affiliate partnerships will be added after official approval.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {partners.map((partner) => (
              <article
                key={partner.name}
                className="rounded-3xl border border-[#DED5C2] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-xl sm:p-9"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#123D2B] text-2xl font-black text-[#D4AF37]">
                    {partner.initials}
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-[#123D2B]">
                      {partner.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-[#8A6B1F]">
                      {partner.category}
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-7 text-[#68766D]">
                  {partner.description}
                </p>

                <div className="mt-6 rounded-xl border border-[#D4AF37]/30 bg-[#F5F0E6] px-4 py-3 text-xs font-bold text-[#8A6B1F]">
                  {partner.status}
                </div>

                <button
                  type="button"
                  disabled
                  className="mt-6 w-full cursor-not-allowed rounded-xl bg-[#EAE6DC] px-5 py-4 text-sm font-bold text-[#68766D]"
                >
                  Official Partner Link Coming Soon
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#DED5C2] bg-white px-5 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F0E6] text-2xl text-[#A17C26]">
            ✦
          </div>

          <h2 className="mt-5 text-2xl font-black text-[#123D2B]">
            Learn Before You Invest
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#68766D]">
            Cryptocurrency markets involve significant risks. Prices can
            change rapidly, and you may lose some or all of your money.
            Always research a platform and understand the risks before
            making financial decisions.
          </p>
        </div>
      </section>

      <footer className="bg-[#123D2B] px-5 py-8 text-center text-xs text-[#F5F0E6]">
        <p>© 2026 ALIQO. All rights reserved.</p>
        <p className="mt-2">
          ALIQO may receive commissions from future affiliate partnerships.
          Any such relationship will be disclosed clearly.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block font-bold text-[#D4AF37] transition hover:text-[#E8C95B] hover:underline"
        >
          Return to ALIQO Home
        </Link>
      </footer>
    </main>
  );
}

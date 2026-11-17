
"use client";

import Link from "next/link";

const partners = [
  {
    name: "Binance",
    description:
      "Explore Binance, one of the world's leading cryptocurrency exchanges, and discover its digital asset services.",
    website: "https://www.binance.com/",
  },
  {
    name: "Bybit",
    description:
      "Discover Bybit and explore its cryptocurrency exchange and digital finance services.",
    website: "https://www.bybit.com/",
  },
  {
    name: "OKX",
    description:
      "Explore OKX and learn about its cryptocurrency exchange and digital asset services.",
    website: "https://www.okx.com/",
  },
  {
    name: "Bitget",
    description:
      "Discover Bitget and explore its cryptocurrency exchange and digital asset services.",
    website: "https://www.bitget.com/",
  },
];

export default function CryptoPage() {
  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      {/* Header */}
      <header className="border-b border-[#D4AF37]/30 bg-[#123D2B] px-5 py-5 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/"
            className="text-3xl font-black tracking-wide text-white"
          >
            ALI<span className="text-[#D4AF37]">QO</span>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#123D2B]"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-[#DED5C2] bg-[#123D2B] px-5 py-16 text-center sm:py-20">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
          ALIQO Financial Hub
        </p>

        <h1 className="mb-6 text-4xl font-black text-white md:text-6xl">
          Explore the World of{" "}
          <span className="text-[#D4AF37]">Crypto</span>
        </h1>

        <p className="mx-auto max-w-2xl text-base leading-8 text-white/80">
          Discover cryptocurrency platforms, explore educational
          resources, and learn about digital finance. Compare
          platforms and make informed decisions before using
          any cryptocurrency service.
        </p>

        <div className="mx-auto mt-8 h-1 w-24 rounded-full bg-[#D4AF37]" />
      </section>

      {/* Partner Cards */}
      <section className="mx-auto grid max-w-5xl gap-7 px-5 py-14 sm:grid-cols-2 sm:py-16">
        {partners.map((partner) => (
          <article
            key={partner.name}
            className="rounded-3xl border border-[#DED5C2] bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#F5F0E6] text-xl font-black text-[#B08B22]">
              {partner.name.charAt(0)}
            </div>

            <h2 className="mb-4 text-2xl font-black text-[#123D2B]">
              {partner.name}
            </h2>

            <p className="mb-6 min-h-20 leading-7 text-[#68766D]">
              {partner.description}
            </p>

            <span className="mb-5 inline-block rounded-full border border-[#D4AF37]/50 bg-[#F5F0E6] px-3 py-1.5 text-xs font-semibold text-[#8A6A18]">
              Affiliate partnership pending
            </span>

            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-[#123D2B] px-5 py-3.5 text-center font-bold text-white transition hover:bg-[#1B563C]"
            >
              Visit Official Website →
            </a>
          </article>
        ))}
      </section>

      {/* Risk Disclaimer */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="rounded-3xl border border-[#D4AF37]/50 bg-white p-7 shadow-sm sm:p-9">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F0E6] text-xl">
              ⚠
            </div>

            <h2 className="text-xl font-black text-[#123D2B]">
              Important Risk Disclaimer
            </h2>
          </div>

          <p className="text-sm leading-8 text-[#68766D]">
            Cryptocurrency involves significant financial risk.
            Prices can change rapidly, and you may lose some or
            all of your investment. ALIQO does not provide
            investment or financial advice. Always research
            platforms and understand the risks before making
            financial decisions.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/30 bg-[#123D2B] px-5 py-9 text-center">
        <Link href="/" className="text-2xl font-black text-white">
          ALI<span className="text-[#D4AF37]">QO</span>
        </Link>

        <p className="mt-4 text-sm text-white/75">
          © 2026 ALIQO. All rights reserved.
        </p>

        <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-white/65">
          Some links may become affiliate links in the future.
          Any such relationship will be disclosed clearly.
        </p>

        <p className="mt-4 text-xs font-semibold text-[#D4AF37]">
          Search Smarter. Discover More.
        </p>
      </footer>
    </main>
  );
}

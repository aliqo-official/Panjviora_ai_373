
"use client";

import { useEffect, useState } from "react";

type ApprovedAd = {
  id: number;
  business_name: string;
  advertising_details: string;
  created_at: string;
};

export default function AdvertisementsPage() {
  const [ads, setAds] = useState<ApprovedAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAds() {
      try {
        const response = await fetch("/api/ads");

        if (!response.ok) return;

        const data = await response.json();
        setAds(Array.isArray(data.ads) ? data.ads : []);
      } catch {
        setAds([]);
      } finally {
        setLoading(false);
      }
    }

    loadAds();
  }, []);

  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      {/* Header */}
      <header className="border-b border-[#D4AF37]/30 bg-[#123D2B] px-5 py-5 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="/" className="text-2xl font-black tracking-tight text-white">
            ALI<span className="text-[#D4AF37]">QO</span>
          </a>

          <a
            href="/advertise"
            className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#123D2B] transition hover:bg-[#E8C95B]"
          >
            Advertise With Us
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#DED5C2] px-5 py-20 text-center sm:py-24">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-80 w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#D4AF37]/15 via-white/70 to-[#123D2B]/10 blur-[100px]" />

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-block rounded-full border border-[#D4AF37]/50 bg-white px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#85631B]">
            ALIQO Business Partners
          </span>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-[#123D2B] sm:text-5xl md:text-6xl">
            Featured
            <span className="block text-[#B08B22]">
              Advertisements
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#68766D] sm:text-base">
            Discover businesses and services featured on ALIQO.
            Explore trusted business partners and discover more opportunities.
          </p>

          <a
            href="/advertise"
            className="mt-8 inline-flex rounded-full bg-[#123D2B] px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1B563C]"
          >
            Promote Your Business →
          </a>
        </div>
      </section>

      {/* Advertisements */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
        <div className="mb-9 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B08B22]">
              Business Directory
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-[#123D2B] sm:text-3xl">
              Our Featured Businesses
            </h2>
          </div>

          {!loading && ads.length > 0 && (
            <span className="rounded-full border border-[#D4AF37]/40 bg-white px-4 py-2 text-sm font-semibold text-[#123D2B]">
              {ads.length} Featured Business{ads.length !== 1 ? "es" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-[#DED5C2] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#DED5C2] border-t-[#D4AF37]" />

            <p className="font-semibold text-[#123D2B]">
              Loading advertisements...
            </p>
          </div>
        ) : ads.length === 0 ? (
          <div className="rounded-3xl border border-[#DED5C2] bg-white p-10 text-center shadow-sm sm:p-14">
            <div className="text-6xl">🏢</div>

            <h2 className="mt-5 text-xl font-bold text-[#123D2B] sm:text-2xl">
              No Advertisements Yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#68766D]">
              Approved business advertisements will appear here.
              Be among the businesses featured on ALIQO.
            </p>

            <a
              href="/advertise"
              className="mt-7 inline-flex rounded-full bg-[#123D2B] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1B563C]"
            >
              Submit Your Advertisement →
            </a>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ads.map((ad) => (
              <article
                key={ad.id}
                className="group rounded-3xl border border-[#DED5C2] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#F5F0E6] text-3xl">
                  🏢
                </div>

                <span className="mt-5 inline-flex rounded-full border border-[#D4AF37]/40 bg-[#F5F0E6] px-3 py-1 text-xs font-bold text-[#85631B]">
                  ✓ Featured Business
                </span>

                <h2 className="mt-5 text-xl font-extrabold text-[#123D2B]">
                  {ad.business_name}
                </h2>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[#68766D]">
                  {ad.advertising_details}
                </p>

                <div className="mt-6 border-t border-[#DED5C2] pt-4 text-xs font-medium text-[#68766D]">
                  <span className="text-[#B08B22]">✦</span>{" "}
                  Featured on ALIQO
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Business Promotion */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="rounded-[2rem] border border-[#D4AF37]/40 bg-[#123D2B] p-9 text-center text-white shadow-xl sm:p-14">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
            Grow Your Business
          </p>

          <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
            Get Featured on ALIQO
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
            Promote your business, showcase your services and connect
            with potential customers through ALIQO.
          </p>

          <a
            href="/advertise"
            className="mt-8 inline-flex rounded-full bg-[#D4AF37] px-8 py-4 font-bold text-[#123D2B] transition hover:bg-[#E8C95B]"
          >
            Advertise With Us →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/30 bg-[#123D2B] px-5 py-9 text-center text-sm text-white/75">
        <a href="/" className="text-2xl font-black text-white">
          ALI<span className="text-[#D4AF37]">QO</span>
        </a>

        <p className="mt-3">Explore more. Discover more.</p>

        <div className="mt-6 flex flex-wrap justify-center gap-6">
          <a href="/" className="transition hover:text-[#D4AF37]">
            Home
          </a>
          <a href="/deals" className="transition hover:text-[#D4AF37]">
            Deals
          </a>
          <a href="/advertisements" className="transition hover:text-[#D4AF37]">
            Advertisements
          </a>
          <a href="/advertise" className="transition hover:text-[#D4AF37]">
            Advertise With Us
          </a>
        </div>

        <p className="mt-8 text-xs text-white/50">
          © 2026 ALIQO. All rights reserved.
        </p>
      </footer>
    </main>
  );
}

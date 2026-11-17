
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Hotel = {
  id: string;
  hotel_name: string;
  city: string;
  address: string;
  description: string | null;
  website_url: string | null;
  image_url: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  created_at: string;
};

export default function PublicHotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHotels() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("hotel_profiles")
      .select(
        "id, hotel_name, city, address, description, website_url, image_url, phone, whatsapp_number, created_at"
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("ALIQO PUBLIC HOTELS ERROR:", fetchError);
      setError("Hotels could not be loaded. Please try again.");
      setHotels([]);
    } else {
      setHotels((data || []) as Hotel[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadHotels();
  }, []);

  const filteredHotels = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return hotels;

    return hotels.filter(
      (hotel) =>
        hotel.hotel_name.toLowerCase().includes(term) ||
        hotel.city.toLowerCase().includes(term) ||
        hotel.address.toLowerCase().includes(term)
    );
  }, [hotels, search]);

  function safeWebsite(url: string | null) {
    if (!url) return null;

    try {
      const parsed = new URL(url);

      return ["http:", "https:"].includes(parsed.protocol)
        ? parsed.href
        : null;
    } catch {
      return null;
    }
  }

  function whatsappLink(number: string | null) {
    if (!number) return null;

    let digits = number.replace(/\D/g, "");

    if (digits.startsWith("0092")) {
      digits = digits.slice(2);
    }

    if (digits.startsWith("92")) {
      // Already in international format.
    } else if (digits.startsWith("0")) {
      digits = "92" + digits.slice(1);
    } else {
      digits = "92" + digits;
    }

    return digits.length >= 12
      ? `https://wa.me/${digits}`
      : null;
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6]">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-[#123D2B] px-4 py-16 text-center text-white md:py-20">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border border-[#D4AF37]/20" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-[#D4AF37]/20" />

        <div className="relative mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
            ALIQO Accommodation
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Discover Hotels
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/80">
            Explore verified and approved hotels across Pakistan.
            Find accommodation for your next journey with ALIQO.
          </p>

          <div className="mx-auto mt-8 max-w-xl">
            <div className="flex items-center gap-3 rounded-2xl border border-[#D4AF37]/40 bg-white p-2 shadow-xl">
              <span className="pl-3 text-xl text-[#123D2B]">⌕</span>

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by hotel name or city..."
                className="w-full border-0 bg-transparent py-3 text-[#123D2B] outline-none placeholder:text-[#68766D] focus:border-0 focus:ring-0"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mr-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#123D2B] hover:bg-[#F5F0E6]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Hotels Listing */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#B08B22]">
              Find Your Stay
            </p>

            <h2 className="text-2xl font-extrabold text-[#123D2B] md:text-3xl">
              Available Hotels
            </h2>

            <p className="mt-2 text-sm text-[#68766D]">
              {hotels.length} approved hotel(s) listed
              {search.trim() && ` · ${filteredHotels.length} matching`}
            </p>
          </div>

          <button
            onClick={loadHotels}
            disabled={loading}
            className="rounded-xl border border-[#123D2B] bg-white px-5 py-3 font-semibold text-[#123D2B] transition hover:bg-[#123D2B] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#DED5C2] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#DED5C2] border-t-[#D4AF37]" />
            <p className="font-medium text-[#123D2B]">
              Loading approved hotels...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <div className="text-4xl">⚠️</div>

            <p className="mt-3 font-semibold text-red-700">
              {error}
            </p>

            <button
              onClick={loadHotels}
              className="mt-5 rounded-xl bg-[#123D2B] px-6 py-3 font-semibold text-white transition hover:bg-[#1B563C]"
            >
              Try Again
            </button>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="rounded-2xl border border-[#DED5C2] bg-white p-12 text-center shadow-sm">
            <div className="text-6xl">🏨</div>

            <h3 className="mt-5 text-xl font-bold text-[#123D2B]">
              {hotels.length === 0
                ? "No Hotels Available Yet"
                : "No Matching Hotels Found"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-[#68766D]">
              {hotels.length === 0
                ? "Approved hotels will appear here when they join ALIQO."
                : "Try searching with another hotel name or city."}
            </p>

            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-5 rounded-xl bg-[#123D2B] px-5 py-3 font-semibold text-white hover:bg-[#1B563C]"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHotels.map((hotel) => {
              const website = safeWebsite(hotel.website_url);
              const whatsapp = whatsappLink(hotel.whatsapp_number);

              return (
                <article
                  key={hotel.id}
                  className="group overflow-hidden rounded-2xl border border-[#DED5C2] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-xl"
                >
                  <div className="relative overflow-hidden">
                    {hotel.image_url ? (
                      <img
                        src={hotel.image_url}
                        alt={hotel.hotel_name}
                        className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-56 items-center justify-center bg-[#F5F0E6] text-7xl">
                        🏨
                      </div>
                    )}

                    <div className="absolute left-4 top-4 rounded-full border border-[#D4AF37]/50 bg-[#123D2B] px-3 py-1.5 text-xs font-bold text-[#D4AF37] shadow">
                      ✓ Approved
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-extrabold text-[#123D2B]">
                      {hotel.hotel_name}
                    </h3>

                    <div className="mt-3 flex items-start gap-2">
                      <span className="text-[#B08B22]">📍</span>
                      <div>
                        <p className="font-semibold text-[#123D2B]">
                          {hotel.city}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[#68766D]">
                          {hotel.address}
                        </p>
                      </div>
                    </div>

                    {hotel.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#68766D]">
                        {hotel.description}
                      </p>
                    )}

                    <div className="my-5 border-t border-[#DED5C2]" />

                    <div className="flex flex-wrap gap-2">
                      {hotel.phone && (
                        <a
                          href={`tel:${hotel.phone}`}
                          className="rounded-lg bg-[#123D2B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1B563C]"
                        >
                          ☎ Call Hotel
                        </a>
                      )}

                      {whatsapp && (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-[#1B563C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#123D2B]"
                        >
                          WhatsApp
                        </a>
                      )}

                      {website && (
                        <a
                          href={website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-[#D4AF37] bg-[#F5F0E6] px-4 py-2.5 text-sm font-semibold text-[#123D2B] transition hover:bg-[#D4AF37]"
                        >
                          Website ↗
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/30 bg-[#123D2B] px-4 py-9 text-center">
        <p className="text-sm font-semibold text-[#D4AF37]">
          ALIQO Accommodation
        </p>

        <p className="mt-2 text-sm text-white/75">
          © 2026 ALIQO. Explore more. Discover more.
        </p>
      </footer>
    </main>
  );
}


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

  // Convert Pakistani WhatsApp numbers into international format.
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
    <main className="min-h-screen bg-[#F3F6F1]">
      <section className="bg-[#173B2B] px-4 py-16 text-center text-white">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#D8BD72]">
          ALIQO Accommodation
        </p>

        <h1 className="text-4xl font-extrabold md:text-5xl">
          Discover Hotels
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-green-100">
          Explore verified and approved hotels across Pakistan.
          Find accommodation for your next journey with ALIQO.
        </p>

        <div className="mx-auto mt-8 max-w-xl">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by hotel name or city..."
            className="w-full rounded-xl border border-white/20 bg-white px-5 py-4 text-gray-900 outline-none focus:ring-4 focus:ring-[#D8BD72]/40"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#173B2B]">
              Available Hotels
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              {hotels.length} approved hotel(s) listed
            </p>
          </div>

          <button
            onClick={loadHotels}
            disabled={loading}
            className="rounded-lg border border-[#173B2B] px-5 py-2.5 font-semibold text-[#173B2B] hover:bg-[#173B2B] hover:text-white disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center text-gray-600">
            Loading approved hotels...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
            <p>{error}</p>

            <button
              onClick={loadHotels}
              className="mt-4 rounded-lg bg-[#173B2B] px-5 py-2 text-white"
            >
              Try Again
            </button>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <div className="text-5xl">🏨</div>

            <h3 className="mt-4 text-xl font-bold text-gray-900">
              {hotels.length === 0
                ? "No Hotels Available Yet"
                : "No Matching Hotels Found"}
            </h3>

            <p className="mt-2 text-gray-600">
              {hotels.length === 0
                ? "Approved hotels will appear here when they join ALIQO."
                : "Try searching with another hotel name or city."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHotels.map((hotel) => {
              const website = safeWebsite(hotel.website_url);
              const whatsapp = whatsappLink(hotel.whatsapp_number);

              return (
                <article
                  key={hotel.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {hotel.image_url ? (
                    <img
                      src={hotel.image_url}
                      alt={hotel.hotel_name}
                      className="h-52 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center bg-[#E7EEE8] text-6xl">
                      🏨
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold text-[#173B2B]">
                        {hotel.hotel_name}
                      </h3>

                      <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                        Approved
                      </span>
                    </div>

                    <p className="font-semibold text-gray-700">
                      📍 {hotel.city}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {hotel.address}
                    </p>

                    {hotel.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
                        {hotel.description}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      {hotel.phone && (
                        <a
                          href={`tel:${hotel.phone}`}
                          className="rounded-lg bg-[#173B2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#24543B]"
                        >
                          Call Hotel
                        </a>
                      )}

                      {whatsapp && (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          WhatsApp
                        </a>
                      )}

                      {website && (
                        <a
                          href={website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-[#173B2B] px-4 py-2 text-sm font-semibold text-[#173B2B] hover:bg-green-50"
                        >
                          Website
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

      <footer className="bg-[#173B2B] px-4 py-8 text-center text-sm text-green-100">
        © 2026 ALIQO. Explore more. Discover more.
      </footer>
    </main>
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Institution = {
  id: string;
  institution_name: string;
  institution_type: string;
  description?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
  website_url?: string | null;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
};

const types = [
  { value: "", label: "All Institutions" },
  { value: "school", label: "Schools" },
  { value: "college", label: "Colleges" },
  { value: "university", label: "Universities" },
  { value: "academy", label: "Academies" },
];

export default function EducationPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInstitutions() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (type) params.set("type", type);
        if (city.trim()) params.set("city", city.trim());
        if (search.trim()) params.set("search", search.trim());

        const query = params.toString();

        const response = await fetch(
          `/api/education/directory${query ? `?${query}` : ""}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load institutions."
          );
        }

        if (!Array.isArray(data.institutions)) {
          throw new Error("Invalid directory response.");
        }

        setInstitutions(data.institutions);
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === "AbortError"
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    // Debounce search requests
    const timer = setTimeout(() => {
      loadInstitutions();
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [type, city, search, retryCount]);

  function handleRetry() {
    setRetryCount((previous) => previous + 1);
  }

  function clearFilters() {
    setSearch("");
    setCity("");
    setType("");
    setRetryCount((previous) => previous + 1);
  }

  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      {/* Hero Section */}
      <section className="bg-[#123D2B] px-5 py-16 text-center text-white">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
            ALIQO Education
          </p>

          <h1 className="text-3xl font-bold sm:text-5xl">
            Discover Educational Institutions
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
            Explore schools, colleges, universities and academies
            across Pakistan. Find programs and connect with institutions.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8 rounded-2xl border border-[#D4AF37]/40 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">
            Find an Institution
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search institution..."
              aria-label="Search institution"
              className="w-full rounded-xl border border-[#123D2B]/20 bg-[#F5F0E6] px-4 py-3 outline-none focus:border-[#D4AF37]"
            />

            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city..."
              aria-label="Filter by city"
              className="w-full rounded-xl border border-[#123D2B]/20 bg-[#F5F0E6] px-4 py-3 outline-none focus:border-[#D4AF37]"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              aria-label="Institution type"
              className="w-full rounded-xl border border-[#123D2B]/20 bg-[#F5F0E6] px-4 py-3 outline-none focus:border-[#D4AF37]"
            >
              {types.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-[#123D2B]/20 px-4 py-2 text-sm font-semibold transition hover:bg-[#123D2B]/5"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Directory Heading */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">
            Education Directory
          </h2>

          {!loading && !error && (
            <span className="rounded-full bg-[#123D2B]/10 px-4 py-2 text-sm font-semibold">
              {institutions.length} institutions
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="font-semibold">
              Loading institutions...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <p className="font-semibold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 rounded-lg bg-[#123D2B] px-5 py-2 font-semibold text-white hover:bg-[#1b563d]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && institutions.length === 0 && (
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-white p-10 text-center">
            <h3 className="text-xl font-bold">
              No institutions found
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Try another search term, city or institution type.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-lg bg-[#123D2B] px-5 py-2 font-semibold text-white"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Institution Cards */}
        {!loading && !error && institutions.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution) => (
              <article
                key={institution.id}
                className="overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {institution.cover_image_url ? (
                  <img
                    src={institution.cover_image_url}
                    alt={`${institution.institution_name} cover`}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-[#123D2B]">
                    <span className="text-4xl font-bold text-[#D4AF37]">
                      ALIQO
                    </span>
                  </div>
                )}

                <div className="p-5">
                  <div className="mb-3 flex items-center gap-3">
                    {institution.logo_url ? (
                      <img
                        src={institution.logo_url}
                        alt={`${institution.institution_name} logo`}
                        className="h-14 w-14 rounded-xl border border-gray-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#123D2B]/10 text-xl font-bold">
                        {institution.institution_name
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#A17B16]">
                        {institution.institution_type}
                      </span>

                      <h3 className="line-clamp-2 font-bold">
                        {institution.institution_name}
                      </h3>
                    </div>
                  </div>

                  <p className="mb-3 min-h-12 text-sm leading-6 text-gray-600">
                    {institution.description
                      ? institution.description.slice(0, 120)
                      : "Explore institution details and available programs."}
                  </p>

                  <p className="mb-4 text-sm text-gray-600">
                    <span className="font-semibold text-[#123D2B]">
                      Location:
                    </span>{" "}
                    {[institution.city, institution.province]
                      .filter(Boolean)
                      .join(", ") || "Location not provided"}
                  </p>

                  <Link
                    href={`/education/${institution.id}`}
                    className="block rounded-xl bg-[#123D2B] px-4 py-3 text-center font-semibold text-white transition hover:bg-[#1b563d]"
                  >
                    View Institution
                    <span className="ml-2 text-[#D4AF37]">
                      →
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

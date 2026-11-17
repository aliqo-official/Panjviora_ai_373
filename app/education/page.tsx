
"use client";

import { useCallback, useEffect, useState } from "react";
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

const institutionTypes = [
  { label: "All Institutions", value: "" },
  { label: "Schools", value: "school" },
  { label: "Colleges", value: "college" },
  { label: "Universities", value: "university" },
  { label: "Academies", value: "academy" },
];

export default function EducationPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const fetchInstitutions = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (type) params.set("type", type);
        if (city.trim()) params.set("city", city.trim());
        if (search.trim()) params.set("search", search.trim());

        const response = await fetch(
          `/api/education/directory?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to load institutions."
          );
        }

        if (!Array.isArray(data?.institutions)) {
          throw new Error("Invalid response received from server.");
        }

        setInstitutions(data.institutions);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setInstitutions([]);
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [type, city, search, retryCount]
  );

  useEffect(() => {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      fetchInstitutions(controller.signal);
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [fetchInstitutions]);

  const clearFilters = () => {
    setSearch("");
    setCity("");
    setType("");
    setRetryCount((count) => count + 1);
  };

  const retry = () => {
    setRetryCount((count) => count + 1);
  };

  const getTypeLabel = (value: string) => {
    return (
      institutionTypes.find((item) => item.value === value)?.label ||
      value
    );
  };

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#17251d]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#103d2b] px-5 py-20 text-white">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#d5ad55]/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-black/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-4 inline-flex rounded-full border border-[#d5ad55]/40 bg-[#d5ad55]/10 px-4 py-2 text-sm font-semibold text-[#e8c777]">
            ALIQO EDUCATION DIRECTORY
          </div>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
            Discover the Right
            <span className="block text-[#e2bd69]">
              Educational Institution
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 md:text-lg">
            Explore schools, colleges, universities and academies.
            Find institutions that match your educational goals.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#institutions"
              className="rounded-xl bg-[#d5ad55] px-7 py-3 font-bold text-[#17251d] transition hover:bg-[#e7c879]"
            >
              Explore Institutions
            </a>

            <Link
              href="/"
              className="rounded-xl border border-white/30 px-7 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Directory */}
      <section
        id="institutions"
        className="mx-auto max-w-7xl px-5 py-14"
      >
        <div className="mb-9">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b18b37]">
            Find Your Future
          </p>

          <h2 className="mt-2 text-3xl font-extrabold text-[#103d2b] md:text-4xl">
            Educational Institutions
          </h2>

          <p className="mt-3 max-w-2xl text-[#657168]">
            Search and explore verified educational institutions
            available in the ALIQO directory.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-9 grid gap-4 rounded-2xl border border-[#e8e3d6] bg-white p-5 shadow-sm md:grid-cols-3">
          <div>
            <label
              htmlFor="education-search"
              className="mb-2 block text-sm font-bold text-[#243b2d]"
            >
              Search Institution
            </label>

            <input
              id="education-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Institution name..."
              className="w-full rounded-xl border border-[#deded5] bg-[#fafaf7] px-4 py-3 outline-none transition focus:border-[#b18b37] focus:ring-2 focus:ring-[#d5ad55]/20"
            />
          </div>

          <div>
            <label
              htmlFor="education-city"
              className="mb-2 block text-sm font-bold text-[#243b2d]"
            >
              City
            </label>

            <input
              id="education-city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Enter city..."
              className="w-full rounded-xl border border-[#deded5] bg-[#fafaf7] px-4 py-3 outline-none transition focus:border-[#b18b37] focus:ring-2 focus:ring-[#d5ad55]/20"
            />
          </div>

          <div>
            <label
              htmlFor="education-type"
              className="mb-2 block text-sm font-bold text-[#243b2d]"
            >
              Institution Type
            </label>

            <select
              id="education-type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-xl border border-[#deded5] bg-[#fafaf7] px-4 py-3 outline-none transition focus:border-[#b18b37] focus:ring-2 focus:ring-[#d5ad55]/20"
            >
              {institutionTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-[#103d2b] px-5 py-2.5 text-sm font-bold text-[#103d2b] transition hover:bg-[#103d2b] hover:text-white"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Results Heading */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-[#103d2b]">
            Explore Institutions
          </h3>

          {!loading && !error && (
            <span className="rounded-full bg-[#103d2b]/10 px-4 py-2 text-sm font-semibold text-[#103d2b]">
              {institutions.length} Results
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-2xl border border-[#e8e3d6] bg-white"
              >
                <div className="h-44 bg-[#e9e8df]" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-3/4 rounded bg-[#e9e8df]" />
                  <div className="h-4 w-1/2 rounded bg-[#e9e8df]" />
                  <div className="h-10 rounded bg-[#e9e8df]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h3 className="text-xl font-bold text-red-800">
              Unable to Load Institutions
            </h3>

            <p className="mt-3 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={retry}
              className="mt-5 rounded-xl bg-[#103d2b] px-6 py-3 font-bold text-white transition hover:bg-[#18543a]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && institutions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#d7d2c5] bg-white px-6 py-16 text-center">
            <div className="text-5xl">🎓</div>

            <h3 className="mt-5 text-2xl font-bold text-[#103d2b]">
              No Institutions Found
            </h3>

            <p className="mx-auto mt-3 max-w-md text-[#657168]">
              No institutions match your current search. Try another
              search term or clear your filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 rounded-xl bg-[#d5ad55] px-6 py-3 font-bold text-[#17251d] transition hover:bg-[#e7c879]"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Institution Cards */}
        {!loading && !error && institutions.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution) => (
              <article
                key={institution.id}
                className="group overflow-hidden rounded-2xl border border-[#e8e3d6] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d5ad55] hover:shadow-xl"
              >
                <div className="relative h-48 overflow-hidden bg-[#103d2b]">
                  {institution.cover_image_url ? (
                    <img
                      src={institution.cover_image_url}
                      alt={`${institution.institution_name} cover`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#103d2b] to-[#071d14]">
                      <span className="text-6xl text-[#d5ad55]">
                        🎓
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                  <span className="absolute bottom-4 left-4 rounded-full bg-[#d5ad55] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-[#17251d]">
                    {institution.institution_type}
                  </span>

                  {institution.logo_url && (
                    <div className="absolute right-4 top-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
                      <img
                        src={institution.logo_url}
                        alt={`${institution.institution_name} logo`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="line-clamp-2 text-xl font-extrabold text-[#103d2b] transition group-hover:text-[#a17a2d]">
                    {institution.institution_name}
                  </h3>

                  <p className="mt-2 text-sm font-semibold text-[#a17a2d]">
                    {getTypeLabel(institution.institution_type)}
                  </p>

                  {institution.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#657168]">
                      {institution.description}
                    </p>
                  )}

                  <div className="mt-5 space-y-2 border-t border-[#eeeae0] pt-4 text-sm text-[#657168]">
                    {institution.city && (
                      <p>
                        <span className="mr-2">📍</span>
                        {institution.city}
                        {institution.province
                          ? `, ${institution.province}`
                          : ""}
                      </p>
                    )}

                    {institution.address && (
                      <p className="line-clamp-2">
                        <span className="mr-2">🏫</span>
                        {institution.address}
                      </p>
                    )}

                    {institution.phone && (
                      <p>
                        <span className="mr-2">📞</span>
                        {institution.phone}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/education/${encodeURIComponent(
                      institution.id
                    )}`}
                    className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#103d2b] px-5 py-3 font-bold text-white transition hover:bg-[#18543a]"
                  >
                    View Institution Details
                    <span className="ml-2 text-[#e2bd69]">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Footer CTA */}
      <section className="bg-[#103d2b] px-5 py-12 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-extrabold md:text-3xl">
            Your Educational Journey Starts Here
          </h2>

          <p className="mt-3 text-white/70">
            Discover educational opportunities through ALIQO.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-[#d5ad55] px-7 py-3 font-bold text-[#17251d] transition hover:bg-[#e7c879]"
          >
            Explore ALIQO
          </Link>
        </div>
      </section>
    </main>
  );
}

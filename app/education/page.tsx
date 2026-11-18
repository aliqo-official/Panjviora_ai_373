
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

type DirectoryResponse = {
  institutions: Institution[];
  count: number;
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasMore: boolean;
};

const PAGE_SIZE = 12;

const institutionTypes = [
  { label: "All Institutions", value: "" },
  { label: "Schools", value: "school" },
  { label: "Colleges", value: "college" },
  { label: "Universities", value: "university" },
  { label: "Academies", value: "academy" },
];

function InstitutionImage({
  src,
  alt,
  fallback,
  className,
}: {
  src?: string | null;
  alt: string;
  fallback: React.ReactNode;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function EducationPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [type, setType] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const fetchInstitutions = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("per_page", String(PAGE_SIZE));

        if (type) params.set("type", type);
        if (city.trim()) params.set("city", city.trim());
        if (province.trim()) {
          params.set("province", province.trim());
        }
        if (search.trim()) {
          params.set("search", search.trim());
        }

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
          throw new Error(
            "Invalid response received from server."
          );
        }

        setInstitutions(data.institutions);
        setTotal(
          typeof data.total === "number"
            ? data.total
            : data.institutions.length
        );
        setTotalPages(
          typeof data.totalPages === "number"
            ? data.totalPages
            : 0
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setInstitutions([]);
        setTotal(0);
        setTotalPages(0);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [page, type, city, province, search, retryCount]
  );

  useEffect(() => {
    const controller = new AbortController();

    const timeout = window.setTimeout(() => {
      fetchInstitutions(controller.signal);
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [fetchInstitutions]);

  const clearFilters = () => {
    setSearch("");
    setCity("");
    setProvince("");
    setType("");
    setPage(1);
  };

  const retry = () => {
    setRetryCount((count) => count + 1);
  };

  const changePage = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === page
    ) {
      return;
    }

    setPage(nextPage);

    document
      .getElementById("institutions")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const getTypeLabel = (value: string) => {
    return (
      institutionTypes.find((item) => item.value === value)
        ?.label || value
    );
  };

  const hasFilters =
    Boolean(search.trim()) ||
    Boolean(city.trim()) ||
    Boolean(province.trim()) ||
    Boolean(type);

  return (
    <main className="min-h-screen bg-[#F7F3E8] text-[#26352D]">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#064B38] px-5 py-20 text-white">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#D6B45B]/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-black/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-4 inline-flex rounded-full border border-[#D6B45B]/40 bg-[#D6B45B]/10 px-4 py-2 text-sm font-semibold text-[#D6B45B]">
            ALIQO EDUCATION DIRECTORY
          </div>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
            Discover the Right
            <span className="block text-[#D6B45B]">
              Educational Institution
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 md:text-lg">
            Explore schools, colleges, universities and academies.
            Find institutions that match your educational goals.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#institutions"
              className="rounded-xl bg-[#D6B45B] px-7 py-3 font-bold text-[#064B38] transition hover:bg-[#E7CA7C]"
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
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#A98535]">
            Find Your Future
          </p>

          <h2 className="mt-2 text-3xl font-extrabold text-[#064B38] md:text-4xl">
            Educational Institutions
          </h2>

          <p className="mt-3 max-w-2xl text-[#657168]">
            Search and explore approved educational institutions
            available in the ALIQO directory.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-9 grid gap-4 rounded-2xl border border-[#D6B45B]/40 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-4">

          <div>
            <label
              htmlFor="education-search"
              className="mb-2 block text-sm font-bold text-[#064B38]"
            >
              Search Institution
            </label>

            <input
              id="education-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Institution name..."
              maxLength={100}
              className="w-full rounded-xl border border-gray-200 bg-[#F7F3E8]/60 px-4 py-3 outline-none transition focus:border-[#D6B45B] focus:ring-2 focus:ring-[#D6B45B]/20"
            />
          </div>

          <div>
            <label
              htmlFor="education-city"
              className="mb-2 block text-sm font-bold text-[#064B38]"
            >
              City
            </label>

            <input
              id="education-city"
              type="text"
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setPage(1);
              }}
              placeholder="Enter city..."
              maxLength={100}
              className="w-full rounded-xl border border-gray-200 bg-[#F7F3E8]/60 px-4 py-3 outline-none transition focus:border-[#D6B45B] focus:ring-2 focus:ring-[#D6B45B]/20"
            />
          </div>

          <div>
            <label
              htmlFor="education-province"
              className="mb-2 block text-sm font-bold text-[#064B38]"
            >
              Province / State
            </label>

            <input
              id="education-province"
              type="text"
              value={province}
              onChange={(event) => {
                setProvince(event.target.value);
                setPage(1);
              }}
              placeholder="e.g. Sindh"
              maxLength={100}
              className="w-full rounded-xl border border-gray-200 bg-[#F7F3E8]/60 px-4 py-3 outline-none transition focus:border-[#D6B45B] focus:ring-2 focus:ring-[#D6B45B]/20"
            />
          </div>

          <div>
            <label
              htmlFor="education-type"
              className="mb-2 block text-sm font-bold text-[#064B38]"
            >
              Institution Type
            </label>

            <select
              id="education-type"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-[#F7F3E8]/60 px-4 py-3 outline-none transition focus:border-[#D6B45B] focus:ring-2 focus:ring-[#D6B45B]/20"
            >
              {institutionTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:col-span-2 lg:col-span-4">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="rounded-lg border border-[#064B38] px-5 py-2.5 text-sm font-bold text-[#064B38] transition hover:bg-[#064B38] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear All Filters
            </button>

            {hasFilters && (
              <span className="text-sm text-[#657168]">
                Filters are applied automatically.
              </span>
            )}
          </div>
        </div>

        {/* Results Heading */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-[#064B38]">
              Explore Institutions
            </h3>

            {!loading && !error && (
              <p className="mt-1 text-sm text-[#657168]">
                Showing {institutions.length} of {total} institutions
              </p>
            )}
          </div>

          {!loading && !error && (
            <span className="rounded-full bg-[#064B38]/10 px-4 py-2 text-sm font-semibold text-[#064B38]">
              {total} Results
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-2xl border border-[#D6B45B]/30 bg-white"
              >
                <div className="h-48 bg-[#E8E4D8]" />

                <div className="space-y-3 p-5">
                  <div className="h-5 w-3/4 rounded bg-[#E8E4D8]" />
                  <div className="h-4 w-1/2 rounded bg-[#E8E4D8]" />
                  <div className="h-10 rounded bg-[#E8E4D8]" />
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

            <p className="mt-3 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={retry}
              className="mt-5 rounded-xl bg-[#064B38] px-6 py-3 font-bold text-white transition hover:bg-[#086148]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && institutions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#D6B45B] bg-white px-6 py-16 text-center">
            <div className="text-5xl">🎓</div>

            <h3 className="mt-5 text-2xl font-bold text-[#064B38]">
              No Institutions Found
            </h3>

            <p className="mx-auto mt-3 max-w-md text-[#657168]">
              No institutions match your current search.
              Try another search term or clear your filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 rounded-xl bg-[#D6B45B] px-6 py-3 font-bold text-[#064B38] transition hover:bg-[#E7CA7C]"
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
                className="group overflow-hidden rounded-2xl border border-[#D6B45B]/30 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D6B45B] hover:shadow-xl"
              >
                {/* Cover */}
                <div className="relative h-48 overflow-hidden bg-[#064B38]">

                  <InstitutionImage
                    src={institution.cover_image_url}
                    alt={`${institution.institution_name} cover`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    fallback={
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#064B38] to-[#032A1F]">
                        <span className="text-6xl text-[#D6B45B]">
                          🎓
                        </span>
                      </div>
                    }
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <span className="absolute bottom-4 left-4 rounded-full bg-[#D6B45B] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-[#064B38]">
                    {institution.institution_type}
                  </span>

                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-white/30 bg-[#064B38]/90 px-3 py-1.5 text-xs font-bold text-white shadow">
                    <span className="text-[#D6B45B]">✓</span>
                    ALIQO Verified
                  </div>

                  {/* Logo */}
                  <div className="absolute -bottom-1 right-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
                    <InstitutionImage
                      src={institution.logo_url}
                      alt={`${institution.institution_name} logo`}
                      className="h-full w-full object-contain p-1"
                      fallback={
                        <span className="text-3xl text-[#064B38]">
                          🎓
                        </span>
                      }
                    />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <h3 className="line-clamp-2 pr-16 text-xl font-extrabold text-[#064B38] transition group-hover:text-[#9B792E]">
                    {institution.institution_name}
                  </h3>

                  <p className="mt-2 text-sm font-semibold text-[#9B792E]">
                    {getTypeLabel(institution.institution_type)}
                  </p>

                  {institution.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#657168]">
                      {institution.description}
                    </p>
                  )}

                  <div className="mt-5 space-y-2 border-t border-[#EEEAE0] pt-4 text-sm text-[#657168]">
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
                    href={`/education/${encodeURIComponent(institution.id)}`}
                    className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#064B38] px-5 py-3 font-bold text-white transition hover:bg-[#086148]"
                  >
                    View Institution Details
                    <span className="ml-2 text-[#D6B45B]">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">

            <button
              type="button"
              onClick={() => changePage(page - 1)}
              disabled={page <= 1}
              className="rounded-xl border border-[#064B38] px-5 py-3 font-bold text-[#064B38] transition hover:bg-[#064B38] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            <div className="rounded-xl border border-[#D6B45B]/50 bg-white px-5 py-3 font-bold text-[#064B38]">
              Page {page} of {totalPages}
            </div>

            <button
              type="button"
              onClick={() => changePage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-xl bg-[#064B38] px-5 py-3 font-bold text-white transition hover:bg-[#086148] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}

        {!loading && !error && total > 0 && (
          <p className="mt-4 text-center text-sm text-[#657168]">
            Showing page {page} · {PAGE_SIZE} institutions per page maximum
          </p>
        )}
      </section>

      {/* Footer CTA */}
      <section className="bg-[#064B38] px-5 py-12 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-extrabold md:text-3xl">
            Your Educational Journey Starts Here
          </h2>

          <p className="mt-3 text-white/75">
            Discover educational opportunities through ALIQO.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-[#D6B45B] px-7 py-3 font-bold text-[#064B38] transition hover:bg-[#E7CA7C]"
          >
            Explore ALIQO
          </Link>
        </div>
      </section>
    </main>
  );
}

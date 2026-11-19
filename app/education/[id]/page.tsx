
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Institution = {
  id: string;
  institution_name: string;
  institution_type: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp_number?: string | null;
  website_url?: string | null;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
};

type Campus = {
  id: string;
  campus_name?: string | null;
  name?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
};

type Program = {
  id: string;
  program_name?: string | null;
  name?: string | null;
  description?: string | null;
  degree_level?: string | null;
  duration?: string | null;
  fee?: number | string | null;
  eligibility?: string | null;
  admission_open?: boolean | null;
};

type ApiResponse = {
  institution?: Institution;
  campuses?: Campus[];
  programs?: Program[];
  error?: string;
};

const GREEN = "#064B38";
const GOLD = "#D6B45B";
const CREAM = "#F7F3E8";

function getWhatsAppLink(number: string) {
  let digits = number.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = "92" + digits.slice(1);
  }

  return `https://wa.me/${digits}`;
}

function InstitutionDetailsContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [institution, setInstitution] =
    useState<Institution | null>(null);

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDetails = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/education/directory?id=${encodeURIComponent(id)}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          }
        );

        const data: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load institution details."
          );
        }

        if (!data.institution) {
          throw new Error("Institution details were not found.");
        }

        setInstitution(data.institution);
        setCampuses(
          Array.isArray(data.campuses) ? data.campuses : []
        );
        setPrograms(
          Array.isArray(data.programs) ? data.programs : []
        );
      } catch (err) {
        if (signal?.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    fetchDetails(controller.signal);

    return () => controller.abort();
  }, [id, fetchDetails]);

  if (loading) {
    return (
      <main
        className="min-h-screen px-4 py-16"
        style={{ backgroundColor: CREAM }}
      >
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div
            className="h-72 rounded-3xl"
            style={{ backgroundColor: GREEN }}
          />
          <div className="h-8 w-1/2 rounded bg-gray-200" />
          <div className="h-32 rounded-2xl bg-gray-200" />
          <div className="h-32 rounded-2xl bg-gray-200" />
        </div>
      </main>
    );
  }

  if (error || !institution) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-4 py-16"
        style={{ backgroundColor: CREAM }}
      >
        <div className="w-full max-w-xl rounded-3xl border border-[#e5dcc5] bg-white p-8 text-center shadow-lg">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
            style={{
              backgroundColor: "#fce8e8",
              color: "#b42318",
            }}
          >
            !
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Institution Not Available
          </h1>

          <p className="mt-3 text-gray-600">
            {error || "The requested institution could not be found."}
          </p>

          <button
            onClick={() => fetchDetails()}
            className="mt-7 rounded-xl px-7 py-3 font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: GREEN }}
          >
            Try Again
          </button>

          <a
            href="/education"
            className="mt-5 block font-semibold hover:underline"
            style={{ color: GREEN }}
          >
            ← Back to Education Directory
          </a>
        </div>
      </main>
    );
  }

  const institutionName =
    institution.institution_name?.trim() || "Institution Name";

  const institutionType =
    institution.institution_type?.replace(/_/g, " ") || "Institution";

  const location = [
    institution.city,
    institution.province,
  ]
    .filter(Boolean)
    .join(", ");

  const whatsappLink = institution.whatsapp_number
    ? getWhatsAppLink(institution.whatsapp_number)
    : null;

  return (
    <main
      className="min-h-screen text-gray-800"
      style={{ backgroundColor: CREAM }}
    >
      {/* Institution Hero */}
      <section
        className="relative isolate overflow-hidden"
        style={{ backgroundColor: GREEN }}
      >
        {institution.cover_image_url && (
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center"
            style={{
              backgroundImage: `url("${institution.cover_image_url}")`,
              opacity: 0.20,
            }}
          />
        )}

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#064B38]/95 via-[#064B38]/85 to-[#064B38]/65" />

        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <a
            href="/education"
            className="mb-10 inline-flex items-center gap-2 font-semibold transition hover:opacity-75"
            style={{ color: GOLD }}
          >
            <span>←</span>
            Back to Education Directory
          </a>

          <div className="flex flex-col items-start gap-7 sm:flex-row sm:items-center">
            {institution.logo_url && (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 bg-white p-2 shadow-xl sm:h-28 sm:w-28"
                style={{ borderColor: GOLD }}
              >
                <img
                  src={institution.logo_url}
                  alt={`${institutionName} logo`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col items-start">
              <span
                className="inline-block rounded-full px-5 py-2 text-xs font-extrabold uppercase tracking-widest"
                style={{
                  backgroundColor: GOLD,
                  color: GREEN,
                }}
              >
                {institutionType}
              </span>

              <div
                role="heading"
                aria-level={1}
                className="mt-5 block w-full break-words text-3xl font-extrabold leading-tight sm:text-5xl"
                style={{
                  color: "#FFFFFF",
                  display: "block",
                  visibility: "visible",
                  opacity: 1,
                  textShadow: "0 2px 12px rgba(0,0,0,0.35)",
                }}
              >
                {institutionName}
              </div>

              {location && (
                <p
                  className="mt-4 text-lg font-medium"
                  style={{ color: CREAM }}
                >
                  {location}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:py-14">

        {/* About Institution */}
        <section className="rounded-3xl border border-[#e8dfc9] bg-white p-6 shadow-sm sm:p-9">
          <div className="mb-5 flex items-center gap-3">
            <div
              className="h-9 w-1.5 rounded-full"
              style={{ backgroundColor: GOLD }}
            />
            <h2
              className="text-2xl font-extrabold"
              style={{ color: GREEN }}
            >
              About Institution
            </h2>
          </div>

          <p className="whitespace-pre-line text-base leading-8 text-gray-600">
            {institution.description ||
              "No description available yet."}
          </p>
        </section>

        {/* Contact Information */}
        <section className="rounded-3xl border border-[#e8dfc9] bg-white p-6 shadow-sm sm:p-9">
          <div className="mb-7 flex items-center gap-3">
            <div
              className="h-9 w-1.5 rounded-full"
              style={{ backgroundColor: GOLD }}
            />
            <h2
              className="text-2xl font-extrabold"
              style={{ color: GREEN }}
            >
              Contact Information
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">

            {institution.phone && (
              <div className="rounded-2xl p-5" style={{ backgroundColor: CREAM }}>
                <p className="text-sm font-bold text-gray-500">
                  Phone
                </p>
                <a
                  href={`tel:${institution.phone}`}
                  className="mt-2 inline-block break-all font-bold hover:underline"
                  style={{ color: GREEN }}
                >
                  {institution.phone}
                </a>
              </div>
            )}

            {institution.email && (
              <div className="rounded-2xl p-5" style={{ backgroundColor: CREAM }}>
                <p className="text-sm font-bold text-gray-500">
                  Email
                </p>
                <a
                  href={`mailto:${institution.email}`}
                  className="mt-2 inline-block break-all font-bold hover:underline"
                  style={{ color: GREEN }}
                >
                  {institution.email}
                </a>
              </div>
            )}

            {whatsappLink && (
              <div className="rounded-2xl p-5" style={{ backgroundColor: CREAM }}>
                <p className="text-sm font-bold text-gray-500">
                  WhatsApp
                </p>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 font-bold hover:underline"
                  style={{ color: GREEN }}
                >
                  Contact on WhatsApp →
                </a>
              </div>
            )}

            {institution.website_url && (
              <div className="rounded-2xl p-5" style={{ backgroundColor: CREAM }}>
                <p className="text-sm font-bold text-gray-500">
                  Website
                </p>
                <a
                  href={institution.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block break-all font-bold hover:underline"
                  style={{ color: GREEN }}
                >
                  Visit Website →
                </a>
              </div>
            )}

            {institution.address && (
              <div
                className="rounded-2xl p-5 sm:col-span-2"
                style={{ backgroundColor: CREAM }}
              >
                <p className="text-sm font-bold text-gray-500">
                  Address
                </p>
                <p className="mt-2 whitespace-pre-line leading-7 text-gray-700">
                  {institution.address}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Campuses */}
        <section className="rounded-3xl border border-[#e8dfc9] bg-white p-6 shadow-sm sm:p-9">
          <div className="mb-7 flex items-center gap-3">
            <div
              className="h-9 w-1.5 rounded-full"
              style={{ backgroundColor: GOLD }}
            />
            <h2
              className="text-2xl font-extrabold"
              style={{ color: GREEN }}
            >
              Our Campuses
            </h2>
          </div>

          {campuses.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ backgroundColor: CREAM }}
            >
              <p className="font-medium text-gray-500">
                No campus information available yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {campuses.map((campus) => (
                <article
                  key={campus.id}
                  className="rounded-2xl border border-[#e8dfc9] p-6 transition hover:shadow-md"
                >
                  <h3
                    className="text-xl font-bold"
                    style={{ color: GREEN }}
                  >
                    {campus.campus_name || campus.name || "Campus"}
                  </h3>

                  {campus.city && (
                    <p className="mt-3 text-gray-600">
                      {campus.city}
                    </p>
                  )}

                  {campus.address && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-500">
                      {campus.address}
                    </p>
                  )}

                  {campus.phone && (
                    <a
                      href={`tel:${campus.phone}`}
                      className="mt-4 inline-block font-semibold"
                      style={{ color: GREEN }}
                    >
                      {campus.phone}
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Programs */}
        <section className="rounded-3xl border border-[#e8dfc9] bg-white p-6 shadow-sm sm:p-9">
          <div className="mb-7 flex items-center gap-3">
            <div
              className="h-9 w-1.5 rounded-full"
              style={{ backgroundColor: GOLD }}
            />
            <h2
              className="text-2xl font-extrabold"
              style={{ color: GREEN }}
            >
              Programs & Courses
            </h2>
          </div>

          {programs.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ backgroundColor: CREAM }}
            >
              <p className="font-medium text-gray-500">
                No programs or courses available yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {programs.map((program) => (
                <article
                  key={program.id}
                  className="rounded-2xl border border-[#e8dfc9] p-6 transition hover:shadow-md"
                >
                  <h3
                    className="text-xl font-bold"
                    style={{ color: GREEN }}
                  >
                    {program.program_name || program.name || "Program"}
                  </h3>

                  {program.degree_level && (
                    <p className="mt-3 text-sm text-gray-600">
                      Level: {program.degree_level}
                    </p>
                  )}

                  {program.duration && (
                    <p className="mt-2 text-sm text-gray-600">
                      Duration: {program.duration}
                    </p>
                  )}

                  {program.fee !== null && program.fee !== undefined && (
                    <p className="mt-2 text-sm text-gray-600">
                      Fee: {program.fee}
                    </p>
                  )}

                  {program.eligibility && (
                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      Eligibility: {program.eligibility}
                    </p>
                  )}

                  {program.description && (
                    <p className="mt-3 leading-7 text-gray-600">
                      {program.description}
                    </p>
                  )}

                  {program.admission_open !== null &&
                    program.admission_open !== undefined && (
                      <span
                        className="mt-5 inline-block rounded-full px-4 py-2 text-xs font-bold"
                        style={{
                          backgroundColor: program.admission_open
                            ? "#DCFCE7"
                            : "#F3F4F6",
                          color: program.admission_open
                            ? "#166534"
                            : "#4B5563",
                        }}
                      >
                        {program.admission_open
                          ? "Admissions Open"
                          : "Admissions Closed"}
                      </span>
                    )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Contact CTA */}
        <section
          className="overflow-hidden rounded-3xl p-8 text-center shadow-lg sm:p-12"
          style={{ backgroundColor: GREEN }}
        >
          <div
            className="mx-auto mb-5 h-1.5 w-20 rounded-full"
            style={{ backgroundColor: GOLD }}
          />

          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Interested in {institutionName}?
          </h2>

          <p
            className="mx-auto mt-4 max-w-2xl leading-7"
            style={{ color: CREAM }}
          >
            Contact the institution directly for admission and further details.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {institution.phone && (
              <a
                href={`tel:${institution.phone}`}
                className="rounded-xl px-7 py-3 font-extrabold transition hover:opacity-90"
                style={{
                  backgroundColor: GOLD,
                  color: GREEN,
                }}
              >
                Contact Institution
              </a>
            )}

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border-2 px-7 py-3 font-bold text-white transition hover:bg-white hover:text-[#064B38]"
                style={{ borderColor: GOLD }}
              >
                WhatsApp Us
              </a>
            )}
          </div>
        </section>

        {/* Back to Directory */}
        <div className="pb-5 text-center">
          <a
            href="/education"
            className="inline-flex items-center gap-2 font-bold hover:underline"
            style={{ color: GREEN }}
          >
            ← Back to Education Directory
          </a>
        </div>
      </div>
    </main>
  );
}

export default function InstitutionDetailsPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen px-4 py-16"
          style={{ backgroundColor: CREAM }}
        >
          <div className="mx-auto max-w-6xl animate-pulse space-y-6">
            <div
              className="h-72 rounded-3xl"
              style={{ backgroundColor: GREEN }}
            />
            <div className="h-8 w-1/2 rounded bg-gray-200" />
            <div className="h-32 rounded-2xl bg-gray-200" />
          </div>
        </main>
      }
    >
      <InstitutionDetailsContent />
    </Suspense>
  );
}

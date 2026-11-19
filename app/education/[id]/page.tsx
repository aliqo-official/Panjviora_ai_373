
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

function getWhatsAppLink(number: string) {
  let digits = number.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = "92" + digits.slice(1);
  }

  return digits ? `https://wa.me/${digits}` : "";
}

function InstitutionDetailsContent() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDetails = useCallback(async (signal?: AbortSignal) => {
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
      setCampuses(Array.isArray(data.campuses) ? data.campuses : []);
      setPrograms(Array.isArray(data.programs) ? data.programs : []);
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
  }, [id]);

  useEffect(() => {
    if (!id) {
      setError("Institution ID is missing.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetchDetails(controller.signal);

    return () => controller.abort();
  }, [id, fetchDetails]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F3E8] px-4 py-16">
        <div className="mx-auto max-w-5xl animate-pulse space-y-5">
          <div className="h-64 rounded-3xl bg-gray-200" />
          <div className="h-8 w-1/2 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
        </div>
      </main>
    );
  }

  if (error || !institution) {
    return (
      <main className="min-h-screen bg-[#F7F3E8] px-4 py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#e8e1cf] bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-[#064B38]">
            Institution Not Available
          </h1>

          <p className="mt-3 text-gray-600">
            {error || "The requested institution could not be found."}
          </p>

          <button
            onClick={() => fetchDetails()}
            className="mt-6 rounded-xl bg-[#064B38] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#043b2c]"
          >
            Try Again
          </button>

          <a
            href="/education"
            className="mt-5 block font-semibold text-[#064B38] hover:underline"
          >
            Back to Education Directory
          </a>
        </div>
      </main>
    );
  }

  const institutionName =
    institution.institution_name?.trim() || "Institution";

  const location = [institution.city, institution.province]
    .filter(Boolean)
    .join(", ");

  const whatsappLink = institution.whatsapp_number
    ? getWhatsAppLink(institution.whatsapp_number)
    : "";

  return (
    <main className="min-h-screen bg-[#F7F3E8] text-gray-800">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden bg-[#064B38]">
        {institution.cover_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${institution.cover_image_url}")`,
              opacity: 0.18,
            }}
          />
        )}

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <a
            href="/education"
            className="mb-8 inline-block font-semibold text-[#D6B45B] transition-colors hover:text-white"
          >
            ← Back to Education Directory
          </a>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {institution.logo_url && (
              <img
                src={institution.logo_url}
                alt={`${institutionName} logo`}
                className="h-24 w-24 rounded-2xl border-2 border-[#D6B45B] bg-white object-contain p-2"
              />
            )}

            <div className="min-w-0">
              <span className="inline-block rounded-full bg-[#D6B45B] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-[#064B38]">
                {institution.institution_type || "Institution"}
              </span>

              <h1
                className="mt-4 block text-3xl font-extrabold leading-tight text-white sm:text-5xl"
                style={{
                  color: "#FFFFFF",
                  opacity: 1,
                  visibility: "visible",
                  display: "block",
                }}
              >
                {institutionName}
              </h1>

              {location && (
                <p className="mt-3 text-lg text-[#F7F3E8]">
                  {location}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
        {/* About Institution */}
        <section className="rounded-3xl border border-[#e8e1cf] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-[#064B38]">
            About Institution
          </h2>

          <div className="mt-3 h-1 w-16 rounded-full bg-[#D6B45B]" />

          <p className="mt-5 whitespace-pre-line leading-8 text-gray-600">
            {institution.description || "No description available yet."}
          </p>
        </section>

        {/* Contact Information */}
        <section className="rounded-3xl border border-[#e8e1cf] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-[#064B38]">
            Contact Information
          </h2>

          <div className="mt-3 h-1 w-16 rounded-full bg-[#D6B45B]" />

          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            {institution.phone && (
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Phone
                </p>

                <a
                  href={`tel:${institution.phone}`}
                  className="mt-2 inline-block font-semibold text-[#064B38] hover:underline"
                >
                  {institution.phone}
                </a>
              </div>
            )}

            {institution.email && (
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Email
                </p>

                <a
                  href={`mailto:${institution.email}`}
                  className="mt-2 inline-block break-all font-semibold text-[#064B38] hover:underline"
                >
                  {institution.email}
                </a>
              </div>
            )}

            {institution.whatsapp_number && (
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  WhatsApp
                </p>

                <a
                  href={whatsappLink || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-semibold text-[#064B38] hover:underline"
                >
                  Contact on WhatsApp
                </a>
              </div>
            )}

            {institution.website_url && (
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Website
                </p>

                <a
                  href={institution.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block break-all font-semibold text-[#064B38] hover:underline"
                >
                  Visit Website
                </a>
              </div>
            )}

            {institution.address && (
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-gray-500">
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
        <section className="rounded-3xl border border-[#e8e1cf] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-[#064B38]">
            Our Campuses
          </h2>

          <div className="mt-3 h-1 w-16 rounded-full bg-[#D6B45B]" />

          {campuses.length === 0 ? (
            <p className="mt-5 text-gray-500">
              No campus information available.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {campuses.map((campus) => (
                <article
                  key={campus.id}
                  className="rounded-2xl border border-[#e8e1cf] bg-[#F7F3E8] p-5"
                >
                  <h3 className="text-lg font-bold text-[#064B38]">
                    {campus.campus_name || campus.name || "Campus"}
                  </h3>

                  {campus.city && (
                    <p className="mt-2 text-gray-600">
                      {campus.city}
                    </p>
                  )}

                  {campus.address && (
                    <p className="mt-2 whitespace-pre-line text-sm text-gray-500">
                      {campus.address}
                    </p>
                  )}

                  {campus.phone && (
                    <a
                      href={`tel:${campus.phone}`}
                      className="mt-3 inline-block text-sm font-semibold text-[#064B38] hover:underline"
                    >
                      {campus.phone}
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Programs and Courses */}
        <section className="rounded-3xl border border-[#e8e1cf] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-[#064B38]">
            Programs & Courses
          </h2>

          <div className="mt-3 h-1 w-16 rounded-full bg-[#D6B45B]" />

          {programs.length === 0 ? (
            <p className="mt-5 text-gray-500">
              No programs or courses available.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {programs.map((program) => (
                <article
                  key={program.id}
                  className="rounded-2xl border border-[#e8e1cf] bg-[#F7F3E8] p-5"
                >
                  <h3 className="text-lg font-bold text-[#064B38]">
                    {program.program_name || program.name || "Program"}
                  </h3>

                  {program.degree_level && (
                    <p className="mt-2 text-sm text-gray-600">
                      Level: {program.degree_level}
                    </p>
                  )}

                  {program.duration && (
                    <p className="mt-1 text-sm text-gray-600">
                      Duration: {program.duration}
                    </p>
                  )}

                  {program.fee !== null && program.fee !== undefined && (
                    <p className="mt-1 text-sm text-gray-600">
                      Fee: {program.fee}
                    </p>
                  )}

                  {program.eligibility && (
                    <p className="mt-3 text-sm text-gray-600">
                      Eligibility: {program.eligibility}
                    </p>
                  )}

                  {program.description && (
                    <p className="mt-3 leading-6 text-gray-600">
                      {program.description}
                    </p>
                  )}

                  {program.admission_open !== null &&
                    program.admission_open !== undefined && (
                      <span
                        className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                          program.admission_open
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
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

        {/* Contact CTA - Always Visible */}
        <section
          className="relative isolate overflow-hidden rounded-3xl p-8 text-center shadow-lg sm:p-12"
          style={{
            backgroundColor: "#064B38",
            color: "#FFFFFF",
          }}
        >
          <div
            className="relative z-10 mx-auto mb-5 h-1.5 w-20 rounded-full"
            style={{
              backgroundColor: "#D6B45B",
              opacity: 1,
              visibility: "visible",
            }}
          />

          <h2
            className="relative z-10 block text-2xl font-extrabold sm:text-3xl"
            style={{
              color: "#FFFFFF",
              opacity: 1,
              visibility: "visible",
              display: "block",
              transition: "none",
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            Interested in {institutionName}?
          </h2>

          <p
            className="relative z-10 mx-auto mt-4 block max-w-2xl leading-7"
            style={{
              color: "#F7F3E8",
              opacity: 1,
              visibility: "visible",
              display: "block",
              transition: "none",
            }}
          >
            Contact the institution directly for admission and further details.
          </p>

          <div className="relative z-10 mt-7 flex flex-wrap justify-center gap-3">
            {institution.phone && (
              <a
                href={`tel:${institution.phone}`}
                className="rounded-xl px-7 py-3 font-extrabold transition-colors hover:brightness-110"
                style={{
                  backgroundColor: "#D6B45B",
                  color: "#064B38",
                  opacity: 1,
                  visibility: "visible",
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
                className="rounded-xl border-2 px-7 py-3 font-bold transition-colors hover:bg-white hover:text-[#064B38]"
                style={{
                  borderColor: "#D6B45B",
                  color: "#FFFFFF",
                  opacity: 1,
                  visibility: "visible",
                }}
              >
                WhatsApp Us
              </a>
            )}
          </div>
        </section>

        {/* Back to Directory */}
        <div className="pb-4 text-center">
          <a
            href="/education"
            className="inline-block font-bold text-[#064B38] hover:underline"
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
        <main className="min-h-screen bg-[#F7F3E8] px-4 py-16">
          <div className="mx-auto max-w-5xl animate-pulse space-y-5">
            <div className="h-64 rounded-3xl bg-gray-200" />
            <div className="h-8 w-1/2 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
          </div>
        </main>
      }
    >
      <InstitutionDetailsContent />
    </Suspense>
  );
}

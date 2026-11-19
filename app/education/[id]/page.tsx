
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Institution {
  id: string;
  institution_name: string;
  institution_type?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
  website_url?: string | null;
  province?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
}

interface Campus {
  id?: string;
  campus_name?: string | null;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface Program {
  id?: string;
  program_name?: string | null;
  name?: string | null;
  program_type?: string | null;
  degree_level?: string | null;
  description?: string | null;
  eligibility?: string | null;
  fee?: string | number | null;
  fee_min?: string | number | null;
  fee_max?: string | number | null;
  duration?: string | null;
  admission_open?: boolean | null;
}

interface ApiResponse {
  institution?: Institution;
  campuses?: Campus[];
  programs?: Program[];
  error?: string;
}

function getWhatsAppLink(number: string): string {
  let digits = number.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = "92" + digits.slice(1);
  }

  return `https://wa.me/${digits}`;
}

function formatFee(program: Program): string | null {
  if (program.fee) {
    return String(program.fee);
  }

  if (program.fee_min != null && program.fee_max != null) {
    return `${program.fee_min} - ${program.fee_max}`;
  }

  if (program.fee_min != null) {
    return `Starting from ${program.fee_min}`;
  }

  if (program.fee_max != null) {
    return `Up to ${program.fee_max}`;
  }

  return null;
}

function InstitutionDetailsContent() {
  const params = useParams();
  const rawId = params?.id;
  const institutionId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInstitution = useCallback(
    async (signal?: AbortSignal) => {
      if (!institutionId) {
        setError("Institution ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/education/directory?id=${encodeURIComponent(institutionId)}`,
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
          throw new Error("Institution details are not available.");
        }

        setInstitution(data.institution);
        setCampuses(Array.isArray(data.campuses) ? data.campuses : []);
        setPrograms(Array.isArray(data.programs) ? data.programs : []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

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
    [institutionId]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchInstitution(controller.signal);

    return () => controller.abort();
  }, [fetchInstitution]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8] px-5">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#D6B45B] border-t-[#064B38]" />
          <p className="mt-5 font-semibold text-[#064B38]">
            Loading institution details...
          </p>
        </div>
      </main>
    );
  }

  if (error || !institution) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8] px-5 py-12">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-lg">
          <div className="text-5xl">!</div>

          <h1 className="mt-4 text-2xl font-extrabold text-[#064B38]">
            Institution Not Available
          </h1>

          <p className="mt-3 leading-7 text-gray-600">
            {error || "Unable to load institution details."}
          </p>

          <button
            type="button"
            onClick={() => fetchInstitution()}
            className="mt-7 rounded-xl bg-[#064B38] px-7 py-3 font-bold text-white transition-colors hover:bg-[#043729]"
          >
            Try Again
          </button>

          <a
            href="/education"
            className="ml-3 inline-block rounded-xl border-2 border-[#D6B45B] px-7 py-3 font-bold text-[#064B38]"
          >
            Back to Directory
          </a>
        </div>
      </main>
    );
  }

  const institutionName =
    institution.institution_name?.trim() || "Institution";

  const location = [
    institution.city,
    institution.province,
    institution.country,
  ]
    .filter(Boolean)
    .join(", ");

  const whatsappLink = institution.whatsapp_number
    ? getWhatsAppLink(institution.whatsapp_number)
    : institution.phone
      ? getWhatsAppLink(institution.phone)
      : null;

  return (
    <main className="min-h-screen bg-[#F7F3E8] text-gray-800">
      {/* Back Navigation */}
      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
        <a
          href="/education"
          className="inline-flex items-center gap-2 font-bold text-[#064B38] transition-colors hover:text-[#D6B45B]"
        >
          <span aria-hidden="true">←</span>
          Back to Education Directory
        </a>
      </div>

      {/* Institution Hero */}
      <section className="mx-auto max-w-7xl px-5 pb-10 pt-6 sm:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#064B38] shadow-xl">
          {institution.cover_image_url ? (
            <div className="absolute inset-0">
              <img
                src={institution.cover_image_url}
                alt={`${institutionName} cover`}
                className="h-full w-full object-cover opacity-25"
              />
              <div className="absolute inset-0 bg-[#064B38]/80" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#064B38] via-[#07583F] to-[#032F24]" />
          )}

          <div className="relative z-10 px-6 py-14 text-center sm:px-12 sm:py-20">
            {institution.logo_url ? (
              <img
                src={institution.logo_url}
                alt={`${institutionName} logo`}
                className="mx-auto mb-6 h-28 w-28 rounded-2xl border-4 border-[#D6B45B] bg-white object-contain p-2 shadow-lg sm:h-32 sm:w-32"
              />
            ) : (
              <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-[#D6B45B] bg-[#F7F3E8] text-4xl font-extrabold text-[#064B38] shadow-lg sm:h-32 sm:w-32">
                {institutionName.charAt(0).toUpperCase()}
              </div>
            )}

            <span className="inline-block rounded-full border border-[#D6B45B] bg-[#D6B45B] px-5 py-2 text-sm font-extrabold uppercase tracking-wider text-[#064B38]">
              {institution.institution_type || "Educational Institution"}
            </span>

            <h1 className="mx-auto mt-6 max-w-4xl text-3xl font-extrabold leading-tight text-white sm:text-5xl">
              {institutionName}
            </h1>

            {location && (
              <p className="mt-4 text-base font-medium text-[#F7F3E8] sm:text-lg">
                <span className="mr-2">📍</span>
                {location}
              </p>
            )}

            <div className="mx-auto mt-7 h-1.5 w-24 rounded-full bg-[#D6B45B]" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 pb-14 sm:px-8 lg:grid-cols-3">
        {/* Left Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* About Institution */}
          <section className="rounded-3xl border border-[#D6B45B]/40 bg-white p-7 shadow-sm sm:p-9">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-9 w-1.5 rounded-full bg-[#D6B45B]" />
              <h2 className="text-2xl font-extrabold text-[#064B38]">
                About Institution
              </h2>
            </div>

            <p className="whitespace-pre-line text-base leading-8 text-gray-600">
              {institution.description ||
                `${institutionName} welcomes students and families to learn more about its educational services and programs. Contact the institution for further information.`}
            </p>
          </section>

          {/* Campuses */}
          <section className="rounded-3xl border border-[#D6B45B]/40 bg-white p-7 shadow-sm sm:p-9">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-9 w-1.5 rounded-full bg-[#D6B45B]" />
              <h2 className="text-2xl font-extrabold text-[#064B38]">
                Campuses
              </h2>
            </div>

            {campuses.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {campuses.map((campus, index) => (
                  <article
                    key={campus.id || `${campus.campus_name || campus.name}-${index}`}
                    className="rounded-2xl border border-[#D6B45B]/40 bg-[#F7F3E8] p-6"
                  >
                    <h3 className="text-lg font-extrabold text-[#064B38]">
                      {campus.campus_name || campus.name || `Campus ${index + 1}`}
                    </h3>

                    {(campus.address || campus.city || campus.province) && (
                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        <span className="mr-2">📍</span>
                        {[
                          campus.address,
                          campus.city,
                          campus.province,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}

                    {campus.phone && (
                      <a
                        href={`tel:${campus.phone}`}
                        className="mt-3 inline-block text-sm font-bold text-[#064B38] hover:text-[#B18D36]"
                      >
                        📞 {campus.phone}
                      </a>
                    )}

                    {campus.email && (
                      <a
                        href={`mailto:${campus.email}`}
                        className="mt-2 block break-all text-sm font-semibold text-[#064B38] hover:text-[#B18D36]"
                      >
                        ✉️ {campus.email}
                      </a>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-[#F7F3E8] p-6 text-center text-gray-500">
                Campus information will be available soon.
              </p>
            )}
          </section>

          {/* Programs */}
          <section className="rounded-3xl border border-[#D6B45B]/40 bg-white p-7 shadow-sm sm:p-9">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-9 w-1.5 rounded-full bg-[#D6B45B]" />
              <h2 className="text-2xl font-extrabold text-[#064B38]">
                Programs & Courses
              </h2>
            </div>

            {programs.length > 0 ? (
              <div className="space-y-5">
                {programs.map((program, index) => {
                  const fee = formatFee(program);

                  return (
                    <article
                      key={program.id || `${program.program_name || program.name}-${index}`}
                      className="rounded-2xl border border-[#D6B45B]/40 bg-[#F7F3E8] p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="text-lg font-extrabold text-[#064B38]">
                          {program.program_name ||
                            program.name ||
                            `Program ${index + 1}`}
                        </h3>

                        {program.admission_open != null && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              program.admission_open
                                ? "bg-[#064B38] text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {program.admission_open
                              ? "Admissions Open"
                              : "Admissions Closed"}
                          </span>
                        )}
                      </div>

                      {(program.program_type || program.degree_level) && (
                        <p className="mt-2 text-sm font-semibold text-[#8B702F]">
                          {[program.program_type, program.degree_level]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      )}

                      {program.description && (
                        <p className="mt-3 leading-7 text-gray-600">
                          {program.description}
                        </p>
                      )}

                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        {program.duration && (
                          <p className="text-gray-600">
                            <strong className="text-[#064B38]">
                              Duration:
                            </strong>{" "}
                            {program.duration}
                          </p>
                        )}

                        {fee && (
                          <p className="text-gray-600">
                            <strong className="text-[#064B38]">
                              Fee:
                            </strong>{" "}
                            {fee}
                          </p>
                        )}

                        {program.eligibility && (
                          <p className="text-gray-600 sm:col-span-2">
                            <strong className="text-[#064B38]">
                              Eligibility:
                            </strong>{" "}
                            {program.eligibility}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-2xl bg-[#F7F3E8] p-6 text-center text-gray-500">
                Programs and courses will be available soon.
              </p>
            )}
          </section>
        </div>

        {/* Contact Information */}
        <aside className="h-fit rounded-3xl border border-[#D6B45B]/40 bg-white p-7 shadow-sm lg:sticky lg:top-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-9 w-1.5 rounded-full bg-[#D6B45B]" />
            <h2 className="text-xl font-extrabold text-[#064B38]">
              Contact Information
            </h2>
          </div>

          <div className="space-y-5">
            {institution.phone && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Phone
                </p>
                <a
                  href={`tel:${institution.phone}`}
                  className="mt-1 block break-all font-semibold text-[#064B38] hover:text-[#B18D36]"
                >
                  {institution.phone}
                </a>
              </div>
            )}

            {institution.email && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Email
                </p>
                <a
                  href={`mailto:${institution.email}`}
                  className="mt-1 block break-all font-semibold text-[#064B38] hover:text-[#B18D36]"
                >
                  {institution.email}
                </a>
              </div>
            )}

            {institution.whatsapp_number && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  WhatsApp
                </p>
                <a
                  href={whatsappLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block font-semibold text-[#064B38] hover:text-[#B18D36]"
                >
                  {institution.whatsapp_number}
                </a>
              </div>
            )}

            {institution.website_url && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Website
                </p>
                <a
                  href={institution.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all font-semibold text-[#064B38] hover:text-[#B18D36]"
                >
                  Visit Website ↗
                </a>
              </div>
            )}

            {institution.address && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Address
                </p>
                <p className="mt-1 whitespace-pre-line leading-7 text-gray-600">
                  {institution.address}
                </p>
              </div>
            )}

            {!institution.phone &&
              !institution.email &&
              !institution.whatsapp_number &&
              !institution.website_url &&
              !institution.address && (
                <p className="text-sm leading-6 text-gray-500">
                  Contact information will be available soon.
                </p>
              )}
          </div>

          {institution.phone && (
            <a
              href={`tel:${institution.phone}`}
              className="mt-7 block rounded-xl bg-[#064B38] px-5 py-3 text-center font-extrabold text-white transition-colors hover:bg-[#043729]"
            >
              Contact Institution
            </a>
          )}

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block rounded-xl border-2 border-[#D6B45B] px-5 py-3 text-center font-extrabold text-[#064B38] transition-colors hover:bg-[#F7F3E8]"
            >
              WhatsApp Us
            </a>
          )}
        </aside>
      </div>

      {/* Contact CTA - Always Visible */}
      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8">
        <div
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
                className="rounded-xl px-7 py-3 font-extrabold transition-colors"
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
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D6B45B]/40 bg-[#064B38] px-5 py-7 text-center text-sm text-[#F7F3E8]">
        © {new Date().getFullYear()} ALIQO. All rights reserved.
      </footer>
    </main>
  );
}

export default function InstitutionDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8]">
          <p className="font-semibold text-[#064B38]">
            Loading institution...
          </p>
        </main>
      }
    >
      <InstitutionDetailsContent />
    </Suspense>
  );
}

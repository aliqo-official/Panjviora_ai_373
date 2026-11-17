
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Institution = {
  id: string;
  institution_name: string;
  institution_type: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
  website_url?: string | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
};

type Campus = {
  id: string;
  campus_name: string;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

type Program = {
  id: string;
  campus_id?: string | null;
  program_type?: string | null;
  program_name: string;
  description?: string | null;
  eligibility?: string | null;
  fee_min?: number | null;
  fee_max?: number | null;
  duration?: string | null;
  admission_open?: boolean | null;
};

export default function InstitutionDetailsPage() {
  const params = useParams<{ id: string }>();
  const institutionId = params.id;

  const [institution, setInstitution] =
    useState<Institution | null>(null);

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!institutionId) return;

    const controller = new AbortController();

    async function loadDetails() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/education/directory?id=${encodeURIComponent(institutionId)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load institution details."
          );
        }

        if (!data.institution) {
          throw new Error("Institution not found.");
        }

        setInstitution(data.institution);
        setCampuses(
          Array.isArray(data.campuses) ? data.campuses : []
        );
        setPrograms(
          Array.isArray(data.programs) ? data.programs : []
        );
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

    loadDetails();

    return () => controller.abort();
  }, [institutionId]);

  const whatsappNumber = institution?.whatsapp_number?.replace(
    /\D/g,
    ""
  );

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : "";

  const websiteUrl = institution?.website_url
    ? /^https?:\/\//i.test(institution.website_url)
      ? institution.website_url
      : `https://${institution.website_url}`
    : "";

  const money = (value?: number | null) => {
    if (value == null) return null;

    return `PKR ${value.toLocaleString("en-PK")}`;
  };

  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      {/* Navigation */}
      <div className="mx-auto max-w-7xl px-5 pt-6">
        <Link
          href="/education"
          className="inline-flex items-center gap-2 font-semibold text-[#123D2B] hover:text-[#A17B16]"
        >
          <span>←</span> Back to Education Directory
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mx-auto max-w-7xl px-5 py-20 text-center">
          <div className="rounded-2xl bg-white p-10 shadow-sm">
            <p className="font-semibold">
              Loading institution details...
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <div className="rounded-2xl border border-red-200 bg-white p-10">
            <h2 className="text-2xl font-bold text-red-700">
              Unable to Load Institution
            </h2>

            <p className="mt-3 text-gray-600">{error}</p>

            <Link
              href="/education"
              className="mt-6 inline-block rounded-xl bg-[#123D2B] px-6 py-3 font-semibold text-white"
            >
              Return to Directory
            </Link>
          </div>
        </div>
      )}

      {/* Institution Details */}
      {!loading && !error && institution && (
        <>
          {/* Hero */}
          <section className="mt-6 bg-[#123D2B] text-white">
            <div className="mx-auto max-w-7xl px-5 py-12">
              {institution.cover_image_url && (
                <img
                  src={institution.cover_image_url}
                  alt="Institution cover"
                  className="mb-8 h-56 w-full rounded-2xl object-cover sm:h-72"
                />
              )}

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                {institution.logo_url ? (
                  <img
                    src={institution.logo_url}
                    alt={`${institution.institution_name} logo`}
                    className="h-24 w-24 rounded-2xl border-2 border-[#D4AF37] bg-white object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-[#D4AF37] bg-white text-4xl font-bold text-[#123D2B]">
                    {institution.institution_name.charAt(0)}
                  </div>
                )}

                <div className="flex-1">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#D4AF37]">
                    {institution.institution_type}
                  </p>

                  <h1 className="text-3xl font-bold sm:text-4xl">
                    {institution.institution_name}
                  </h1>

                  <p className="mt-3 text-sm text-white/80">
                    {[institution.city, institution.province, institution.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-8 lg:col-span-2">
              {/* About */}
              <section className="rounded-2xl border border-[#D4AF37]/30 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-2xl font-bold">
                  About Institution
                </h2>

                <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                  {institution.description ||
                    "Institution information will be updated soon."}
                </p>
              </section>

              {/* Campuses */}
              <section className="rounded-2xl border border-[#D4AF37]/30 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    Our Campuses
                  </h2>

                  <span className="rounded-full bg-[#123D2B]/10 px-3 py-1 text-sm font-semibold">
                    {campuses.length}
                  </span>
                </div>

                {campuses.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No campus information available.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {campuses.map((campus) => (
                      <article
                        key={campus.id}
                        className="rounded-xl border border-[#123D2B]/10 bg-[#F5F0E6] p-5"
                      >
                        <h3 className="text-lg font-bold">
                          {campus.campus_name}
                        </h3>

                        <p className="mt-3 text-sm text-gray-600">
                          {[campus.city, campus.province, campus.address]
                            .filter(Boolean)
                            .join(", ") || "Location not provided"}
                        </p>

                        {campus.phone && (
                          <p className="mt-2 text-sm">
                            Phone: {campus.phone}
                          </p>
                        )}

                        {campus.email && (
                          <p className="mt-1 break-all text-sm">
                            Email: {campus.email}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Programs */}
              <section className="rounded-2xl border border-[#D4AF37]/30 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    Available Programs
                  </h2>

                  <span className="rounded-full bg-[#123D2B]/10 px-3 py-1 text-sm font-semibold">
                    {programs.length}
                  </span>
                </div>

                {programs.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No programs available currently.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {programs.map((program) => (
                      <article
                        key={program.id}
                        className="rounded-xl border border-[#123D2B]/10 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold">
                              {program.program_name}
                            </h3>

                            {program.program_type && (
                              <p className="mt-1 text-xs font-semibold uppercase text-[#A17B16]">
                                {program.program_type}
                              </p>
                            )}
                          </div>

                          {program.admission_open && (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                              Admissions Open
                            </span>
                          )}
                        </div>

                        {program.description && (
                          <p className="mt-3 text-sm leading-6 text-gray-600">
                            {program.description}
                          </p>
                        )}

                        {program.eligibility && (
                          <p className="mt-3 text-sm text-gray-600">
                            <strong>Eligibility:</strong>{" "}
                            {program.eligibility}
                          </p>
                        )}

                        {program.duration && (
                          <p className="mt-2 text-sm text-gray-600">
                            <strong>Duration:</strong>{" "}
                            {program.duration}
                          </p>
                        )}

                        {(program.fee_min != null ||
                          program.fee_max != null) && (
                          <p className="mt-2 text-sm text-gray-600">
                            <strong>Fee:</strong>{" "}
                            {money(program.fee_min) || "Not specified"}
                            {" - "}
                            {money(program.fee_max) || "Not specified"}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Contact Sidebar */}
            <aside className="h-fit rounded-2xl border border-[#D4AF37]/40 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold">
                Contact Institution
              </h2>

              {institution.address && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase text-[#A17B16]">
                    Address
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {institution.address}
                  </p>
                </div>
              )}

              {institution.phone && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase text-[#A17B16]">
                    Phone
                  </p>
                  <a
                    href={`tel:${institution.phone}`}
                    className="mt-1 block text-sm font-semibold hover:text-[#A17B16]"
                  >
                    {institution.phone}
                  </a>
                </div>
              )}

              {institution.email && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase text-[#A17B16]">
                    Email
                  </p>
                  <a
                    href={`mailto:${institution.email}`}
                    className="mt-1 block break-all text-sm font-semibold hover:text-[#A17B16]"
                  >
                    {institution.email}
                  </a>
                </div>
              )}

              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 block rounded-xl border border-[#123D2B] px-4 py-3 text-center text-sm font-semibold text-[#123D2B] hover:bg-[#123D2B]/5"
                >
                  Visit Website
                </a>
              )}

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-[#123D2B] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#1b563d]"
                >
                  Contact via WhatsApp
                </a>
              )}

              {!institution.phone &&
                !institution.email &&
                !websiteUrl &&
                !whatsappUrl && (
                  <p className="text-sm text-gray-500">
                    Contact information is not available.
                  </p>
                )}

              <p className="mt-5 border-t border-gray-100 pt-4 text-xs leading-5 text-gray-500">
                Contact the institution directly for admission,
                program and fee confirmation.
              </p>
            </aside>
          </div>
        </>
      )}
    </main>
  );
}

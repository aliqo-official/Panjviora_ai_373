
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

function InstitutionDetailsContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;

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
    if (!id) return;

    const controller = new AbortController();

    fetchDetails(controller.signal);

    return () => controller.abort();
  }, [id, fetchDetails]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f4] px-4 py-16">
        <div className="mx-auto max-w-5xl animate-pulse space-y-5">
          <div className="h-64 rounded-2xl bg-gray-200" />
          <div className="h-8 w-1/2 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
        </div>
      </main>
    );
  }

  if (error || !institution) {
    return (
      <main className="min-h-screen bg-[#f7f8f4] px-4 py-20">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Institution Not Available
          </h1>

          <p className="mt-3 text-gray-600">
            {error || "The requested institution could not be found."}
          </p>

          <button
            onClick={() => fetchDetails()}
            className="mt-6 rounded-lg bg-[#075b42] px-6 py-3 font-semibold text-white hover:bg-[#064832]"
          >
            Try Again
          </button>

          <a
            href="/education"
            className="mt-4 block font-semibold text-[#075b42]"
          >
            Back to Education Directory
          </a>
        </div>
      </main>
    );
  }

  const institutionName = institution.institution_name;

  const location = [institution.city, institution.province]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-gray-800">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#064b38]">
        {institution.cover_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: `url("${institution.cover_image_url}")`,
            }}
          />
        )}

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <a
            href="/education"
            className="mb-8 inline-block text-sm font-semibold text-[#e8c66a] hover:text-white"
          >
            ← Back to Education Directory
          </a>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {institution.logo_url && (
              <img
                src={institution.logo_url}
                alt={`${institutionName} logo`}
                className="h-24 w-24 rounded-2xl border-2 border-[#d6b45b] bg-white object-contain p-2"
              />
            )}

            <div>
              <span className="inline-block rounded-full bg-[#d6b45b] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#173c2e]">
                {institution.institution_type}
              </span>

              <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-5xl">
                {institutionName}
              </h1>

              {location && (
                <p className="mt-3 text-lg text-gray-200">
                  {location}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
        {/* About */}
        <section className="rounded-2xl border border-[#e8e1cf] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-[#075b42]">
            About Institution
          </h2>

          <p className="mt-4 whitespace-pre-line leading-8 text-gray-600">
            {institution.description || "No description available yet."}
          </p>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-[#e8e1cf] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-[#075b42]">
            Contact Information
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {institution.phone && (
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Phone
                </p>
                <a
                  href={`tel:${institution.phone}`}
                  className="mt-1 inline-block font-semibold text-[#075b42] hover:underline"
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
                  className="mt-1 inline-block break-all font-semibold text-[#075b42] hover:underline"
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
                  href={`https://wa.me/${institution.whatsapp_number.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-semibold text-[#075b42] hover:underline"
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
                  className="mt-1 inline-block break-all font-semibold text-[#075b42] hover:underline"
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
                <p className="mt-1 text-gray-700">
                  {institution.address}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Campuses */}
        <section className="rounded-2xl border border-[#e8e1cf] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-[#075b42]">
            Our Campuses
          </h2>

          {campuses.length === 0 ? (
            <p className="mt-5 text-gray-500">
              No campus information available.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {campuses.map((campus) => (
                <article
                  key={campus.id}
                  className="rounded-xl border border-[#e8e1cf] p-5"
                >
                  <h3 className="text-lg font-bold text-[#075b42]">
                    {campus.campus_name || campus.name || "Campus"}
                  </h3>

                  {campus.city && (
                    <p className="mt-2 text-gray-600">
                      {campus.city}
                    </p>
                  )}

                  {campus.address && (
                    <p className="mt-1 text-sm text-gray-500">
                      {campus.address}
                    </p>
                  )}

                  {campus.phone && (
                    <a
                      href={`tel:${campus.phone}`}
                      className="mt-3 inline-block text-sm font-semibold text-[#075b42]"
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
        <section className="rounded-2xl border border-[#e8e1cf] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-[#075b42]">
            Programs & Courses
          </h2>

          {programs.length === 0 ? (
            <p className="mt-5 text-gray-500">
              No programs or courses available.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {programs.map((program) => (
                <article
                  key={program.id}
                  className="rounded-xl border border-[#e8e1cf] p-5"
                >
                  <h3 className="text-lg font-bold text-[#075b42]">
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

        {/* Footer CTA */}
        <section className="rounded-2xl bg-[#064b38] p-8 text-center text-white">
          <h2 className="text-2xl font-bold">
            Interested in {institutionName}?
          </h2>

          <p className="mt-3 text-gray-200">
            Contact the institution directly for admission and further details.
          </p>

          {institution.phone && (
            <a
              href={`tel:${institution.phone}`}
              className="mt-6 inline-block rounded-lg bg-[#d6b45b] px-7 py-3 font-bold text-[#173c2e] hover:bg-[#e8c66a]"
            >
              Contact Institution
            </a>
          )}
        </section>
      </div>
    </main>
  );
}

export default function InstitutionDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f8f4] px-4 py-16">
          <div className="mx-auto max-w-5xl animate-pulse space-y-5">
            <div className="h-64 rounded-2xl bg-gray-200" />
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

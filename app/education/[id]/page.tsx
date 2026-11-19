
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
  campus_id?: string | null;
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

function cleanText(value?: string | null): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function formatLocation(parts: Array<string | null | undefined>): string {
  const result: string[] = [];

  for (const part of parts) {
    const value = cleanText(part);
    if (!value) continue;

    const duplicate = result.some(
      (existing) => existing.toLowerCase() === value.toLowerCase()
    );

    if (!duplicate) result.push(value);
  }

  return result.join(", ");
}

function formatCampusLocation(campus: Campus): string {
  const address = cleanText(campus.address);
  const city = cleanText(campus.city);
  const province = cleanText(campus.province);
  const addressLower = address.toLowerCase();

  const cityAlreadyIncluded =
    city && addressLower.includes(city.toLowerCase());

  const provinceAlreadyIncluded =
    province && addressLower.includes(province.toLowerCase());

  return formatLocation([
    address,
    cityAlreadyIncluded ? null : city,
    provinceAlreadyIncluded ? null : province,
  ]);
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
  if (program.fee != null && String(program.fee).trim() !== "") {
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

function formatProgramTypes(program: Program): string {
  const types = [
    cleanText(program.program_type),
    cleanText(program.degree_level),
  ].filter(Boolean);

  const uniqueTypes = types.filter(
    (value, index) =>
      types.findIndex(
        (item) => item.toLowerCase() === value.toLowerCase()
      ) === index
  );

  return uniqueTypes
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
    .join(" • ");
}

function formatInstitutionType(value?: string | null): string {
  const type = cleanText(value);

  if (!type) return "Educational Institution";

  return type
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

  // Admission inquiry form state
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [studentMessage, setStudentMessage] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState("");
  const [inquiryError, setInquiryError] = useState("");

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

  const submitInquiry = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setInquirySuccess("");
    setInquiryError("");

    if (!institution?.id) {
      setInquiryError("Institution information is unavailable.");
      return;
    }

    if (
      !studentName.trim() ||
      !studentPhone.trim() ||
      !studentMessage.trim()
    ) {
      setInquiryError("Please complete all required fields.");
      return;
    }

    if (studentPhone.trim().length < 7) {
      setInquiryError("Please enter a valid phone number.");
      return;
    }

    const selectedProgramData = programs.find(
      (program) => program.id === selectedProgram
    );

    if (
      selectedProgramData?.campus_id &&
      selectedProgramData.campus_id !== selectedCampus
    ) {
      setInquiryError(
        "Please select the correct campus for your chosen program."
      );
      return;
    }

    setInquirySubmitting(true);

    try {
      const response = await fetch("/api/education/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution_id: institution.id,
          campus_id: selectedCampus || null,
          program_id: selectedProgram || null,
          student_name: studentName.trim(),
          student_email: studentEmail.trim() || null,
          student_phone: studentPhone.trim(),
          message: studentMessage.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Unable to submit your inquiry."
        );
      }

      setInquirySuccess(
        data.message ||
          "Your admission inquiry has been submitted successfully. The institution may contact you soon."
      );

      setStudentName("");
      setStudentEmail("");
      setStudentPhone("");
      setSelectedCampus("");
      setSelectedProgram("");
      setStudentMessage("");
    } catch (err) {
      setInquiryError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setInquirySubmitting(false);
    }
  };

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
        <div className="w-full max-w-lg rounded-3xl border border-[#D6B45B]/40 bg-white p-8 text-center shadow-lg">
          <div className="text-5xl font-bold text-[#D6B45B]">!</div>

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
            className="ml-3 inline-block rounded-xl border-2 border-[#D6B45B] px-7 py-3 font-bold text-[#064B38] transition-colors hover:bg-[#F7F3E8]"
          >
            Back to Directory
          </a>
        </div>
      </main>
    );
  }

  const institutionName =
    cleanText(institution.institution_name) || "Institution";

  const location = formatLocation([
    institution.city,
    institution.province,
    institution.country,
  ]);

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
          className="inline-flex items-center gap-2 rounded-lg font-bold text-[#064B38] transition-colors hover:text-[#B18D36]"
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
              {formatInstitutionType(institution.institution_type)}
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
        <div className="space-y-8 lg:col-span-2">
          {/* About Institution */}
          <section className="rounded-3xl border border-[#D6B45B]/40 bg-white p-7 shadow-sm transition-shadow hover:shadow-md sm:p-9">
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
          <section className="rounded-3xl border border-[#D6B45B]/40 bg-white p-7 shadow-sm transition-shadow hover:shadow-md sm:p-9">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-9 w-1.5 rounded-full bg-[#D6B45B]" />
              <h2 className="text-2xl font-extrabold text-[#064B38]">
                Campuses
              </h2>
            </div>

            {campuses.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {campuses.map((campus, index) => {
                  const campusLocation = formatCampusLocation(campus);

                  return (
                    <article
                      key={
                        campus.id ||
                        `${campus.campus_name || campus.name}-${index}`
                      }
                      className="rounded-2xl border border-[#D6B45B]/40 bg-[#F7F3E8] p-6 transition-all hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#064B38] text-xl text-[#D6B45B]">
                        🏫
                      </div>

                      <h3 className="text-lg font-extrabold text-[#064B38]">
                        {campus.campus_name ||
                          campus.name ||
                          `Campus ${index + 1}`}
                      </h3>

                      {campusLocation && (
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          <span className="mr-2">📍</span>
                          {campusLocation}
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
                  );
                })}
              </div>
            ) : (
              <p className="rounded-2xl bg-[#F7F3E8] p-6 text-center text-gray-500">
                Campus information will be available soon.
              </p>
            )}
          </section>

          {/* Programs */}
          <section className="rounded-3xl border border-[#D6B45B]/40 bg-white p-7 shadow-sm transition-shadow hover:shadow-md sm:p-9">
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
                  const programTypes = formatProgramTypes(program);

                  return (
                    <article
                      key={
                        program.id ||
                        `${program.program_name || program.name}-${index}`
                      }
                      className="rounded-2xl border border-[#D6B45B]/40 bg-[#F7F3E8] p-6 transition-all hover:shadow-md"
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

                      {programTypes && (
                        <p className="mt-2 text-sm font-semibold text-[#8B702F]">
                          {programTypes}
                        </p>
                      )}

                      {program.description && (
                        <p className="mt-3 leading-7 text-gray-600">
                          {program.description}
                        </p>
                      )}

                      <div className="mt-5 grid gap-4 border-t border-[#D6B45B]/40 pt-4 text-sm sm:grid-cols-2">
                        {program.duration && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Duration
                            </p>
                            <p className="mt-1 font-semibold text-[#064B38]">
                              {program.duration}
                            </p>
                          </div>
                        )}

                        {fee && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Fee
                            </p>
                            <p className="mt-1 font-semibold text-[#064B38]">
                              {fee}
                            </p>
                          </div>
                        )}

                        {program.eligibility && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Eligibility
                            </p>
                            <p className="mt-1 font-semibold text-[#064B38]">
                              {program.eligibility}
                            </p>
                          </div>
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

          {/* Student Admission Inquiry */}
          <section
            id="admission-inquiry"
            className="rounded-3xl border border-[#D6B45B]/40 bg-white p-7 shadow-sm sm:p-9"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="h-9 w-1.5 rounded-full bg-[#D6B45B]" />
              <h2 className="text-2xl font-extrabold text-[#064B38]">
                Admission Inquiry
              </h2>
            </div>

            <p className="mb-6 leading-7 text-gray-600">
              Interested in studying at {institutionName}? Submit your details
              and the institution can contact you regarding admissions.
            </p>

            {programs.some(
              (program) => program.admission_open === false
            ) && (
              <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4">
                <p className="font-bold text-amber-800">
                  Admissions Currently Closed
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-700">
                  You can still submit an inquiry for future admission
                  opportunities. Submitting an inquiry does not confirm
                  admission.
                </p>
              </div>
            )}

            {inquirySuccess && (
              <div
                role="status"
                className="mb-6 rounded-2xl border border-green-300 bg-green-50 p-4"
              >
                <p className="font-bold text-green-800">
                  Inquiry Submitted Successfully!
                </p>
                <p className="mt-1 text-sm leading-6 text-green-700">
                  {inquirySuccess}
                </p>
              </div>
            )}

            {inquiryError && (
              <div
                role="alert"
                className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4"
              >
                <p className="font-bold text-red-800">
                  Submission Failed
                </p>
                <p className="mt-1 text-sm leading-6 text-red-700">
                  {inquiryError}
                </p>
              </div>
            )}

            <form onSubmit={submitInquiry} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="studentName"
                    className="mb-2 block text-sm font-bold text-[#064B38]"
                  >
                    Student Name *
                  </label>
                  <input
                    id="studentName"
                    type="text"
                    required
                    maxLength={120}
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-gray-300 bg-[#F7F3E8] px-4 py-3 outline-none transition focus:border-[#064B38] focus:ring-2 focus:ring-[#064B38]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="studentPhone"
                    className="mb-2 block text-sm font-bold text-[#064B38]"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="studentPhone"
                    type="tel"
                    required
                    maxLength={30}
                    value={studentPhone}
                    onChange={(event) => setStudentPhone(event.target.value)}
                    placeholder="03XXXXXXXXX"
                    className="w-full rounded-xl border border-gray-300 bg-[#F7F3E8] px-4 py-3 outline-none transition focus:border-[#064B38] focus:ring-2 focus:ring-[#064B38]/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="studentEmail"
                  className="mb-2 block text-sm font-bold text-[#064B38]"
                >
                  Email Address (Optional)
                </label>
                <input
                  id="studentEmail"
                  type="email"
                  maxLength={254}
                  value={studentEmail}
                  onChange={(event) => setStudentEmail(event.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-gray-300 bg-[#F7F3E8] px-4 py-3 outline-none transition focus:border-[#064B38] focus:ring-2 focus:ring-[#064B38]/20"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="selectedCampus"
                    className="mb-2 block text-sm font-bold text-[#064B38]"
                  >
                    Select Campus (Optional)
                  </label>
                  <select
                    id="selectedCampus"
                    value={selectedCampus}
                    onChange={(event) => {
                      const campusId = event.target.value;
                      setSelectedCampus(campusId);

                      if (
                        selectedProgram &&
                        !programs.some(
                          (program) =>
                            program.id === selectedProgram &&
                            (!program.campus_id ||
                              program.campus_id === campusId)
                        )
                      ) {
                        setSelectedProgram("");
                      }

                      setInquiryError("");
                    }}
                    className="w-full rounded-xl border border-gray-300 bg-[#F7F3E8] px-4 py-3 outline-none focus:border-[#064B38] focus:ring-2 focus:ring-[#064B38]/20"
                  >
                    <option value="">Any Campus</option>
                    {campuses.map((campus, index) => (
                      <option
                        key={campus.id || index}
                        value={campus.id || ""}
                        disabled={!campus.id}
                      >
                        {campus.campus_name ||
                          campus.name ||
                          `Campus ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="selectedProgram"
                    className="mb-2 block text-sm font-bold text-[#064B38]"
                  >
                    Select Program (Optional)
                  </label>
                  <select
                    id="selectedProgram"
                    value={selectedProgram}
                    onChange={(event) => {
                      const programId = event.target.value;
                      const program = programs.find(
                        (item) => item.id === programId
                      );

                      setSelectedProgram(programId);

                      if (program?.campus_id) {
                        setSelectedCampus(program.campus_id);
                      }

                      setInquiryError("");
                    }}
                    className="w-full rounded-xl border border-gray-300 bg-[#F7F3E8] px-4 py-3 outline-none focus:border-[#064B38] focus:ring-2 focus:ring-[#064B38]/20"
                  >
                    <option value="">General Inquiry</option>
                    {programs
                      .filter(
                        (program) =>
                          !program.campus_id ||
                          !selectedCampus ||
                          program.campus_id === selectedCampus
                      )
                      .map((program, index) => (
                        <option
                          key={program.id || index}
                          value={program.id || ""}
                          disabled={!program.id}
                        >
                          {program.program_name ||
                            program.name ||
                            `Program ${index + 1}`}
                          {program.admission_open === false
                            ? " (Admissions Closed)"
                            : ""}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="studentMessage"
                  className="mb-2 block text-sm font-bold text-[#064B38]"
                >
                  Your Message *
                </label>
                <textarea
                  id="studentMessage"
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={5}
                  value={studentMessage}
                  onChange={(event) => setStudentMessage(event.target.value)}
                  placeholder="Tell the institution about your admission inquiry..."
                  className="w-full resize-y rounded-xl border border-gray-300 bg-[#F7F3E8] px-4 py-3 outline-none transition focus:border-[#064B38] focus:ring-2 focus:ring-[#064B38]/20"
                />
              </div>

              <button
                type="submit"
                disabled={inquirySubmitting}
                className="w-full rounded-xl bg-[#064B38] px-6 py-4 font-extrabold text-white shadow-sm transition-all hover:bg-[#043729] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {inquirySubmitting
                  ? "Submitting Inquiry..."
                  : "Submit Admission Inquiry →"}
              </button>

              <p className="text-xs leading-5 text-gray-500">
                Your information will be shared with this institution for
                admission-related communication.
              </p>
            </form>
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
                  {institution.address.trim()}
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
              className="mt-7 block rounded-xl bg-[#064B38] px-5 py-3 text-center font-extrabold text-white shadow-sm transition-all hover:bg-[#043729] hover:shadow-md"
            >
              📞 Contact Institution
            </a>
          )}

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block rounded-xl border-2 border-[#D6B45B] px-5 py-3 text-center font-extrabold text-[#064B38] transition-all hover:bg-[#F7F3E8]"
            >
              WhatsApp Us
            </a>
          )}
        </aside>
      </div>

      {/* Contact CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#064B38] to-[#032F24] p-8 text-center shadow-lg sm:p-12">
          <div className="relative z-10 mx-auto mb-5 h-1.5 w-20 rounded-full bg-[#D6B45B]" />

          <h2 className="relative z-10 text-2xl font-extrabold text-white sm:text-3xl">
            Interested in {institutionName}?
          </h2>

          <p className="relative z-10 mx-auto mt-4 max-w-2xl leading-7 text-[#F7F3E8]">
            Submit an admission inquiry or contact the institution directly
            for further details.
          </p>

          <div className="relative z-10 mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="#admission-inquiry"
              className="rounded-xl bg-[#D6B45B] px-7 py-3 font-extrabold text-[#064B38] transition-colors hover:bg-[#E5CA7D]"
            >
              Submit Admission Inquiry
            </a>

            {institution.phone && (
              <a
                href={`tel:${institution.phone}`}
                className="rounded-xl border-2 border-[#D6B45B] px-7 py-3 font-bold text-white transition-colors hover:bg-[#D6B45B] hover:text-[#064B38]"
              >
                📞 Contact Institution
              </a>
            )}

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border-2 border-[#D6B45B] px-7 py-3 font-bold text-white transition-colors hover:bg-[#D6B45B] hover:text-[#064B38]"
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

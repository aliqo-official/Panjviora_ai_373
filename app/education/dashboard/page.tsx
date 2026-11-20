
"use client";

import { useEffect, useState, type FormEvent } from "react";

type Institution = {
  id: string;
  owner_user_id: string;
  institution_name: string;
  institution_type: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  verification_status: string;
  is_active: boolean;
  created_at: string;
};

type InquiryStatus =
  | "new"
  | "contacted"
  | "in_review"
  | "accepted"
  | "rejected"
  | "closed";

type Inquiry = {
  id: string;
  institution_id: string;
  campus_id: string | null;
  program_id: string | null;
  campus_name?: string | null;
  program_name?: string | null;
  student_user_id: string | null;
  student_name: string;
  student_email: string | null;
  student_phone: string;
  message: string;
  status: InquiryStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

type InquiryDraft = {
  status: InquiryStatus;
  admin_notes: string;
};

const ALLOWED_STATUSES: InquiryStatus[] = [
  "new",
  "contacted",
  "in_review",
  "accepted",
  "rejected",
  "closed",
];

const STATUS_CONFIG: Record<
  InquiryStatus,
  { label: string; style: string }
> = {
  new: {
    label: "New",
    style: "border-[#E8C95B] bg-[#FFF4D6] text-[#946B08]",
  },
  contacted: {
    label: "Contacted",
    style: "border-blue-200 bg-blue-50 text-blue-800",
  },
  in_review: {
    label: "In Review",
    style: "border-purple-200 bg-purple-50 text-purple-800",
  },
  accepted: {
    label: "Accepted",
    style: "border-[#9CC6A8] bg-[#E4F1E8] text-[#123D2B]",
  },
  rejected: {
    label: "Rejected",
    style: "border-red-200 bg-red-50 text-red-800",
  },
  closed: {
    label: "Closed",
    style: "border-gray-200 bg-gray-100 text-gray-700",
  },
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getErrorMessage(data: any, fallback: string) {
  return (
    data?.error ||
    data?.message ||
    data?.msg ||
    data?.details ||
    fallback
  );
}

export default function EducationOwnerDashboard() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institution, setInstitution] = useState<Institution | null>(null);

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [drafts, setDrafts] = useState<Record<string, InquiryDraft>>({});

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  const [savingInquiry, setSavingInquiry] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");

  const [filterStatus, setFilterStatus] = useState("all");

  const inputClass =
    "w-full rounded-xl border border-[#DED5C2] bg-white px-4 py-3 text-[#123D2B] outline-none transition placeholder:text-[#68766D] focus:border-[#D6B45B] focus:ring-2 focus:ring-[#D6B45B]/20";

  async function loadInquiries(token: string, institutionId: string) {
    setLoadingInquiries(true);
    setInquiryMessage("");

    try {
      const response = await fetch(
        `/api/education/inquiries?institution_id=${encodeURIComponent(
          institutionId
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to load admission inquiries.")
        );
      }

      const inquiryList: Inquiry[] = Array.isArray(data.inquiries)
        ? data.inquiries
        : [];

      setInquiries(inquiryList);

      const nextDrafts: Record<string, InquiryDraft> = {};

      inquiryList.forEach((item) => {
        nextDrafts[item.id] = {
          status: item.status,
          admin_notes: item.admin_notes || "",
        };
      });

      setDrafts(nextDrafts);
    } catch (error) {
      setInquiries([]);
      setDrafts({});
      setInquiryMessage(
        error instanceof Error
          ? error.message
          : "Unable to load inquiries."
      );
    } finally {
      setLoadingInquiries(false);
    }
  }

  async function loadOwner(token: string) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Database configuration is missing.");
    }

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      throw new Error("Session expired. Please login again.");
    }

    const user = await userResponse.json();

    if (!user?.id) {
      throw new Error("Unable to verify your account.");
    }

    const institutionResponse = await fetch(
      `${supabaseUrl}/rest/v1/institutions?owner_user_id=eq.${encodeURIComponent(
        user.id
      )}&select=id,owner_user_id,institution_name,institution_type,email,phone,city,verification_status,is_active,created_at&order=created_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const institutionData = await institutionResponse.json();

    if (!institutionResponse.ok) {
      throw new Error(
        getErrorMessage(
          institutionData,
          "Unable to load your institution information."
        )
      );
    }

    if (!Array.isArray(institutionData) || !institutionData.length) {
      throw new Error(
        "No institution is linked to this account. Please register your institution first."
      );
    }

    setInstitutions(institutionData);
    setInstitution(institutionData[0]);

    localStorage.setItem("aliqo_education_token", token);

    await loadInquiries(token, institutionData[0].id);
  }

  useEffect(() => {
    let active = true;

    async function checkSavedSession() {
      const savedToken = localStorage.getItem("aliqo_education_token");

      if (!savedToken) {
        if (active) setCheckingSession(false);
        return;
      }

      try {
        await loadOwner(savedToken);
      } catch (error) {
        localStorage.removeItem("aliqo_education_token");

        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Please login again."
          );
        }
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    checkSavedSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Database configuration is missing.");
      }

      const response = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.access_token) {
        throw new Error(
          getErrorMessage(data, "Invalid email or password.")
        );
      }

      await loadOwner(data.access_token);
      setMessage("");
      setPassword("");
    } catch (error) {
      localStorage.removeItem("aliqo_education_token");

      setInstitution(null);
      setInstitutions([]);
      setInquiries([]);

      setMessage(
        error instanceof Error ? error.message : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleInstitutionChange(institutionId: string) {
    const selected = institutions.find(
      (item) => item.id === institutionId
    );

    if (!selected) return;

    const token = localStorage.getItem("aliqo_education_token");

    if (!token) {
      handleLogout();
      return;
    }

    setInstitution(selected);
    setFilterStatus("all");

    await loadInquiries(token, selected.id);
  }

  function handleLogout() {
    localStorage.removeItem("aliqo_education_token");

    setInstitution(null);
    setInstitutions([]);
    setInquiries([]);
    setDrafts({});
    setPassword("");

    setMessage("You have been logged out.");
    setInquiryMessage("");
  }

  function updateDraft(
    inquiryId: string,
    field: keyof InquiryDraft,
    value: string
  ) {
    setDrafts((previous) => ({
      ...previous,
      [inquiryId]: {
        status: previous[inquiryId]?.status || "new",
        admin_notes: previous[inquiryId]?.admin_notes || "",
        [field]: value,
      },
    }));
  }

  async function handleSaveInquiry(inquiryId: string) {
    if (!institution) return;

    const token = localStorage.getItem("aliqo_education_token");

    if (!token) {
      handleLogout();
      return;
    }

    const draft = drafts[inquiryId];

    if (!draft || !ALLOWED_STATUSES.includes(draft.status)) {
      setInquiryMessage("Please select a valid inquiry status.");
      return;
    }

    setSavingInquiry(inquiryId);
    setInquiryMessage("");

    try {
      const response = await fetch("/api/education/inquiries", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          institution_id: institution.id,
          status: draft.status,
          admin_notes: draft.admin_notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to update this inquiry.")
        );
      }

      if (data.inquiry) {
        setInquiries((previous) =>
          previous.map((item) =>
            item.id === inquiryId
              ? { ...item, ...data.inquiry }
              : item
          )
        );

        setDrafts((previous) => ({
          ...previous,
          [inquiryId]: {
            status: data.inquiry.status,
            admin_notes: data.inquiry.admin_notes || "",
          },
        }));
      }

      setInquiryMessage("Inquiry updated successfully.");
    } catch (error) {
      setInquiryMessage(
        error instanceof Error
          ? error.message
          : "Unable to update inquiry."
      );
    } finally {
      setSavingInquiry(null);
    }
  }

  const filteredInquiries = inquiries.filter((item) =>
    filterStatus === "all" ? true : item.status === filterStatus
  );

  const newCount = inquiries.filter(
    (item) => item.status === "new"
  ).length;

  const contactedCount = inquiries.filter(
    (item) => item.status === "contacted"
  ).length;

  const inReviewCount = inquiries.filter(
    (item) => item.status === "in_review"
  ).length;

  const completedCount = inquiries.filter((item) =>
    ["accepted", "rejected", "closed"].includes(item.status)
  ).length;

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8] px-5">
        <div className="text-center">
          <p className="text-3xl font-black text-[#064B38]">
            ALIQO<span className="text-[#D6B45B]">.</span>
          </p>
          <p className="mt-4 text-sm text-[#68766D]">
            Loading Education Dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3E8] px-4 py-8 text-[#064B38] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <a
            href="/"
            className="text-3xl font-black tracking-tight text-[#064B38]"
          >
            ALIQO<span className="text-[#D6B45B]">.</span>
          </a>

          <div className="flex flex-wrap gap-3">
            <a
              href="/education"
              className="rounded-full border border-[#064B38]/20 px-5 py-2.5 text-sm font-semibold transition hover:bg-[#064B38] hover:text-white"
            >
              ← Education Directory
            </a>

            {institution && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-[#D6B45B] px-5 py-2.5 text-sm font-bold text-[#064B38] transition hover:bg-[#D6B45B]"
              >
                Logout
              </button>
            )}
          </div>
        </nav>

        {!institution ? (
          <div className="mx-auto mt-12 max-w-md overflow-hidden rounded-3xl border border-[#DED5C2] bg-white shadow-xl shadow-[#064B38]/10">
            <div className="bg-[#064B38] px-8 py-10 text-[#F7F3E8]">
              <span className="inline-block rounded-full border border-[#D6B45B]/50 bg-[#D6B45B]/10 px-4 py-2 text-xs font-bold tracking-widest text-[#E8C95B]">
                ALIQO EDUCATION PORTAL
              </span>

              <h1 className="mt-6 text-3xl font-black text-[#F7F3E8]">
                Institution Owner Login
              </h1>

              <p className="mt-3 text-sm leading-7 text-[#F7F3E8]/80">
                Login to manage your institution and student admission
                inquiries.
              </p>
            </div>

            <div className="p-8">
              {message && (
                <div className="mb-5 rounded-xl border border-[#E8C95B] bg-[#FFF4D6] p-4 text-sm leading-6 text-[#765707]">
                  {message}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#064B38]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#064B38]">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#064B38] py-4 font-bold text-white shadow-lg transition hover:bg-[#0B6048] hover:text-[#E8C95B] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Please wait..." : "Login to Dashboard →"}
                </button>
              </form>

              <div className="mt-7 border-t border-[#DED5C2] pt-6 text-center">
                <p className="text-sm text-[#68766D]">
                  Need an institution account?{" "}
                  <a
                    href="/education/register"
                    className="font-bold text-[#064B38] underline decoration-[#D6B45B] underline-offset-4"
                  >
                    Register Institution
                  </a>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="mt-10 overflow-hidden rounded-3xl bg-[#064B38] p-7 text-[#F7F3E8] shadow-xl md:p-10">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div>
                  <span className="inline-block rounded-full border border-[#D6B45B]/50 bg-[#D6B45B]/10 px-4 py-2 text-xs font-bold tracking-widest text-[#E8C95B]">
                    INSTITUTION OWNER PORTAL
                  </span>

                  <h1 className="mt-5 text-3xl font-black text-[#F7F3E8] md:text-4xl">
                    Welcome to Your Dashboard
                  </h1>

                  <p className="mt-3 text-[#F7F3E8]/80">
                    Manage your institution and student admission inquiries.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#D6B45B]/40 bg-white/5 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#E8C95B]">
                    Institution
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#F7F3E8]">
                    {institution.institution_name}
                  </p>
                  <p className="mt-1 text-sm text-[#F7F3E8]/80">
                    {institution.city || "Location not specified"}
                  </p>
                </div>
              </div>
            </section>

            {institutions.length > 1 && (
              <section className="mt-6 rounded-2xl border border-[#DED5C2] bg-white p-5">
                <label className="mb-2 block text-sm font-bold text-[#064B38]">
                  Select Institution
                </label>

                <select
                  value={institution.id}
                  onChange={(e) => handleInstitutionChange(e.target.value)}
                  className={inputClass}
                >
                  {institutions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.institution_name}
                    </option>
                  ))}
                </select>
              </section>
            )}

            <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Total Inquiries",
                  value: inquiries.length,
                  description: "All received inquiries",
                },
                {
                  label: "New Inquiries",
                  value: newCount,
                  description: "Waiting for your response",
                },
                {
                  label: "Contacted",
                  value: contactedCount,
                  description: "Students contacted",
                },
                {
                  label: "In Review",
                  value: inReviewCount,
                  description: "Currently being reviewed",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#DED5C2] bg-white p-6 shadow-sm"
                >
                  <p className="text-sm font-bold text-[#68766D]">
                    {item.label}
                  </p>
                  <p className="mt-3 text-4xl font-black text-[#064B38]">
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs text-[#68766D]">
                    {item.description}
                  </p>
                </div>
              ))}
            </section>

            <section className="mt-7 rounded-3xl border border-[#DED5C2] bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#B18B20]">
                    Institution Profile
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#064B38]">
                    Account Information
                  </h2>
                </div>

                <span
                  className={`rounded-full border px-4 py-2 text-xs font-bold ${
                    institution.verification_status === "approved" &&
                    institution.is_active
                      ? "border-[#9CC6A8] bg-[#E4F1E8] text-[#123D2B]"
                      : institution.verification_status === "rejected"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-[#E8C95B] bg-[#FFF4D6] text-[#946B08]"
                  }`}
                >
                  {institution.is_active
                    ? institution.verification_status.toUpperCase()
                    : "INACTIVE"}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Institution Name", institution.institution_name],
                  ["Institution Type", institution.institution_type],
                  ["Email Address", institution.email || "Not provided"],
                  ["Phone Number", institution.phone || "Not provided"],
                  ["City", institution.city || "Not provided"],
                  ["Account Created", formatDate(institution.created_at)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#DED5C2] bg-[#F7F3E8] p-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-[#68766D]">
                      {label}
                    </p>
                    <p className="mt-2 break-words text-sm font-semibold text-[#064B38]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-7 rounded-3xl border border-[#DED5C2] bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#B18B20]">
                    Student Communication
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#064B38]">
                    Admission Inquiries
                  </h2>
                  <p className="mt-2 text-sm text-[#68766D]">
                    View student requests, contact applicants and update
                    inquiry progress.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const token = localStorage.getItem(
                      "aliqo_education_token"
                    );

                    if (token && institution) {
                      loadInquiries(token, institution.id);
                    }
                  }}
                  disabled={loadingInquiries}
                  className="rounded-xl border border-[#D6B45B] px-5 py-3 text-sm font-bold text-[#064B38] transition hover:bg-[#FFF4D6] disabled:opacity-50"
                >
                  {loadingInquiries ? "Refreshing..." : "↻ Refresh Inquiries"}
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#F7F3E8] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#68766D]">
                    Completed / Closed
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#064B38]">
                    {completedCount}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F7F3E8] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#68766D]">
                    Total Students
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#064B38]">
                    {inquiries.length}
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <label className="mb-2 block text-sm font-bold text-[#064B38]">
                  Filter Inquiries
                </label>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={inputClass}
                >
                  <option value="all">All Inquiries</option>
                  {ALLOWED_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_CONFIG[status].label}
                    </option>
                  ))}
                </select>
              </div>

              {inquiryMessage && (
                <div className="mt-5 rounded-xl border border-[#E8C95B] bg-[#FFF4D6] p-4 text-sm leading-6 text-[#765707]">
                  {inquiryMessage}
                </div>
              )}

              {loadingInquiries ? (
                <div className="mt-6 rounded-2xl bg-[#F7F3E8] p-8 text-center text-sm text-[#68766D]">
                  Loading admission inquiries...
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-[#DED5C2] bg-[#F7F3E8] p-8 text-center">
                  <p className="text-lg font-bold text-[#064B38]">
                    No inquiries found
                  </p>
                  <p className="mt-2 text-sm text-[#68766D]">
                    {inquiries.length === 0
                      ? "Student admission inquiries will appear here when someone submits the public form."
                      : "There are no inquiries with the selected status."}
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {filteredInquiries.map((item) => {
                    const draft = drafts[item.id] || {
                      status: item.status,
                      admin_notes: item.admin_notes || "",
                    };

                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-[#DED5C2] bg-white p-5 sm:p-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#B18B20]">
                              Admission Inquiry
                            </p>
                            <h3 className="mt-2 text-xl font-black text-[#064B38]">
                              {item.student_name}
                            </h3>
                            <p className="mt-1 text-xs text-[#68766D]">
                              Received: {formatDate(item.created_at)}
                            </p>
                          </div>

                          <span
                            className={`rounded-full border px-4 py-2 text-xs font-bold ${
                              STATUS_CONFIG[item.status]?.style ||
                              "border-gray-200 bg-gray-100 text-gray-700"
                            }`}
                          >
                            {STATUS_CONFIG[item.status]?.label ||
                              item.status}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div className="rounded-xl bg-[#F7F3E8] p-4">
                            <p className="text-xs font-bold uppercase text-[#68766D]">
                              Phone Number
                            </p>
                            <a
                              href={`tel:${item.student_phone}`}
                              className="mt-2 inline-block break-all font-semibold text-[#064B38] underline decoration-[#D6B45B] underline-offset-4"
                            >
                              {item.student_phone}
                            </a>
                            <a
                              href={`https://wa.me/${item.student_phone.replace(
                                /[^0-9]/g,
                                ""
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 block text-sm font-bold text-[#064B38] hover:text-[#B18B20]"
                            >
                              Contact on WhatsApp →
                            </a>
                          </div>

                          <div className="rounded-xl bg-[#F7F3E8] p-4">
                            <p className="text-xs font-bold uppercase text-[#68766D]">
                              Email Address
                            </p>
                            {item.student_email ? (
                              <a
                                href={`mailto:${item.student_email}`}
                                className="mt-2 inline-block break-all font-semibold text-[#064B38] underline decoration-[#D6B45B] underline-offset-4"
                              >
                                {item.student_email}
                              </a>
                            ) : (
                              <p className="mt-2 text-sm text-[#68766D]">
                                Not provided
                              </p>
                            )}
                          </div>

                          <div className="rounded-xl bg-[#F7F3E8] p-4">
                            <p className="text-xs font-bold uppercase text-[#68766D]">
                              Campus Name
                            </p>
                            <p className="mt-2 break-words text-sm font-semibold text-[#064B38]">
                              {item.campus_name ||
                                (item.campus_id
                                  ? "Campus name unavailable"
                                  : "General Inquiry")}
                            </p>
                          </div>

                          <div className="rounded-xl bg-[#F7F3E8] p-4">
                            <p className="text-xs font-bold uppercase text-[#68766D]">
                              Program Name
                            </p>
                            <p className="mt-2 break-words text-sm font-semibold text-[#064B38]">
                              {item.program_name ||
                                (item.program_id
                                  ? "Program name unavailable"
                                  : "General Inquiry")}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-[#DED5C2] p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#68766D]">
                            Student Message
                          </p>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#123D2B]">
                            {item.message}
                          </p>
                        </div>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-bold text-[#064B38]">
                              Update Inquiry Status
                            </label>

                            <select
                              value={draft.status}
                              onChange={(e) =>
                                updateDraft(
                                  item.id,
                                  "status",
                                  e.target.value
                                )
                              }
                              className={inputClass}
                            >
                              {ALLOWED_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {STATUS_CONFIG[status].label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-bold text-[#064B38]">
                              Internal Admin Notes
                            </label>

                            <textarea
                              rows={3}
                              maxLength={2000}
                              value={draft.admin_notes}
                              onChange={(e) =>
                                updateDraft(
                                  item.id,
                                  "admin_notes",
                                  e.target.value
                                )
                              }
                              placeholder="Write internal notes about this inquiry..."
                              className={inputClass}
                            />

                            <p className="mt-1 text-right text-xs text-[#68766D]">
                              {draft.admin_notes.length}/2000
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-[#68766D]">
                            Notes are for institution management and are
                            not displayed on the public institution page.
                          </p>

                          <button
                            type="button"
                            onClick={() => handleSaveInquiry(item.id)}
                            disabled={savingInquiry === item.id}
                            className="rounded-xl bg-[#064B38] px-6 py-3 font-bold text-white transition hover:bg-[#0B6048] hover:text-[#E8C95B] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingInquiry === item.id
                              ? "Saving..."
                              : "Save Changes →"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        <footer className="py-9 text-center text-sm text-[#68766D]">
          © 2026 ALIQO. All rights reserved.
          <p className="mt-2 font-semibold text-[#064B38]">
            ALIQO — Discover More. Do More.
          </p>
        </footer>
      </div>
    </main>
  );
}

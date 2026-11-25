
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";

type Request = {
  id?: number | string;
  business_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  advertising_details?: string;
  created_at?: string;
  status?: string;
};

type StatusFilter = "All" | "Pending" | "Approved" | "Rejected";
type InstitutionFilter = "All" | "Pending" | "Approved" | "Rejected";

type Institution = {
  id: string;
  owner_user_id?: string;
  institution_name: string;
  institution_type: string;
  email?: string | null;
  phone?: string;
  whatsapp_number?: string | null;
  website_url?: string | null;
  province?: string | null;
  city?: string;
  address?: string | null;
  description?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  verification_status: string;
  is_active: boolean;
  admin_notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

type AdmissionInquiry = {
  id: string;
  institution_id: string;
  campus_id: string | null;
  program_id: string | null;
  campus_name: string | null;
  program_name: string | null;
  student_user_id: string | null;
  student_name: string;
  student_email: string;
  student_phone: string | null;
  message: string;
  status:
    | "new"
    | "contacted"
    | "in_review"
    | "accepted"
    | "rejected"
    | "closed";
  admin_private_notes: string | null;
  created_at: string;
  updated_at: string;
};

type InquiryStatus = AdmissionInquiry["status"];

function normalizeStatus(status?: string): StatusFilter {
  const value = (status || "pending").toLowerCase();

  if (value === "approved") return "Approved";
  if (value === "rejected") return "Rejected";

  return "Pending";
}

function formatInquiryStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AdminPage() {
  // ==========================================
  // AUTHENTICATION
  // ==========================================

  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [authenticated, setAuthenticated] = useState(false);
const [authChecking, setAuthChecking] = useState(true);
  // ==========================================
  // ADVERTISING REQUESTS
  // ==========================================

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [selected, setSelected] = useState<Request | null>(null);

  // ==========================================
  // EDUCATION MANAGEMENT
  // ==========================================

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [educationLoading, setEducationLoading] = useState(false);
  const [educationError, setEducationError] = useState("");

  const [educationSearch, setEducationSearch] = useState("");
  const [institutionFilter, setInstitutionFilter] =
    useState<InstitutionFilter>("All");

  const [updatingInstitutionId, setUpdatingInstitutionId] =
    useState<string | null>(null);

  const [selectedInstitution, setSelectedInstitution] =
    useState<Institution | null>(null);

  // ==========================================
  // ADMISSION INQUIRY MANAGEMENT
  // ==========================================

  const [admissionInquiries, setAdmissionInquiries] =
    useState<AdmissionInquiry[]>([]);

  const [admissionInquiryLoading, setAdmissionInquiryLoading] =
    useState(false);

  const [admissionInquiryError, setAdmissionInquiryError] =
    useState("");

  const [admissionInstitutionFilter, setAdmissionInstitutionFilter] =
    useState("All");

  const [admissionCampusFilter, setAdmissionCampusFilter] =
    useState("All");

  const [admissionProgramFilter, setAdmissionProgramFilter] =
    useState("All");

  const [admissionStatusFilter, setAdmissionStatusFilter] =
    useState("All");

  const [admissionSearch, setAdmissionSearch] = useState("");

  const [updatingInquiryId, setUpdatingInquiryId] =
    useState<string | null>(null);

  const [savingInquiryNotesId, setSavingInquiryNotesId] =
    useState<string | null>(null);

  const [inquiryNotesDrafts, setInquiryNotesDrafts] =
    useState<Record<string, string>>({});

  // ==========================================
  // LOAD ADVERTISING REQUESTS
  // ==========================================

  async function loadRequests() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/requests", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        setAuthenticated(false);
        setRequests([]);

        if (response.status !== 401) {
          throw new Error("Could not load advertising requests.");
        }

        return;
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid advertising requests response.");
      }

      setRequests(data);
      setAuthenticated(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load requests."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // LOAD EDUCATION INSTITUTIONS
  // ==========================================

  async function loadEducationInstitutions() {
    setEducationLoading(true);
    setEducationError("");

    try {
      const response = await fetch("/api/education/institutions", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load institution applications."
        );
      }

      if (!Array.isArray(data.institutions)) {
        throw new Error("Invalid institution response.");
      }

      setInstitutions(data.institutions);
    } catch (err) {
      setEducationError(
        err instanceof Error
          ? err.message
          : "Unable to load education applications."
      );
    } finally {
      setEducationLoading(false);
    }
  }

  // ==========================================
  // LOAD ALL ADMISSION INQUIRIES
  // ==========================================

  async function loadAdmissionInquiries() {
    setAdmissionInquiryLoading(true);
    setAdmissionInquiryError("");

    try {
      const response = await fetch(
        "/api/admin/education/inquiries",
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load admission inquiries."
        );
      }

      if (!Array.isArray(data.inquiries)) {
        throw new Error("Invalid admission inquiries response.");
      }

      setAdmissionInquiries(data.inquiries);

      setInquiryNotesDrafts(
  Object.fromEntries(
    (data.inquiries as AdmissionInquiry[]).map((inquiry) => [
      inquiry.id,
      inquiry.admin_private_notes || "",
    ])
  )
);
    } catch (err) {
      setAdmissionInquiryError(
        err instanceof Error
          ? err.message
          : "Unable to load admission inquiries."
      );
    } finally {
      setAdmissionInquiryLoading(false);
    }
  }

  // ==========================================
  // ADMIN LOGIN
  // ==========================================

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      setPassword("");

      await Promise.all([
        loadRequests(),
        loadEducationInstitutions(),
        loadAdmissionInquiries(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // ADVERTISING STATUS UPDATE
  // ==========================================

  async function updateStatus(
    item: Request,
    newStatus: "Approved" | "Rejected"
  ) {
    if (item.id == null) {
      setError("This request has no ID.");
      return;
    }

    setUpdatingId(item.id);
    setError("");

    try {
      const response = await fetch("/api/admin/requests", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          status: newStatus.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Status update failed.");
      }

      if (!data || data.length === 0) {
        throw new Error("No request was updated.");
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === item.id
            ? { ...request, status: newStatus }
            : request
        )
      );

      if (selected?.id === item.id) {
        setSelected({
          ...selected,
          status: newStatus,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Status update failed."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // ==========================================
  // DELETE ADVERTISING REQUEST
  // ==========================================

  async function deleteRequest(item: Request) {
    if (item.id == null) {
      setError("This request has no ID.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this request?")) {
      return;
    }

    setDeletingId(item.id);
    setError("");

    try {
      const response = await fetch("/api/admin/requests", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed.");
      }

      if (!data || data.length === 0) {
        throw new Error("No request was deleted.");
      }

      setRequests((current) =>
        current.filter((request) => request.id !== item.id)
      );

      if (selected?.id === item.id) {
        setSelected(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Delete failed."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================
  // EDUCATION APPROVAL / REJECTION
  // ==========================================

  async function updateInstitutionStatus(
    institution: Institution,
    status: "approved" | "rejected"
  ) {
    let adminNotes = "";

    if (status === "rejected") {
      const reason = window.prompt(
        "Please enter the reason for rejecting this institution:"
      );

      if (reason === null) return;

      adminNotes = reason.trim();

      if (!adminNotes) {
        setEducationError("Rejection reason is required.");
        return;
      }
    } else {
      const confirmed = window.confirm(
        `Are you sure you want to approve ${institution.institution_name}?`
      );

      if (!confirmed) return;

      adminNotes = "Approved by ALIQO administrator.";
    }

    setUpdatingInstitutionId(institution.id);
    setEducationError("");

    try {
      const response = await fetch("/api/education/institutions", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution_id: institution.id,
          status,
          admin_notes: adminNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Institution status update failed."
        );
      }

      if (!data.institution) {
        throw new Error("Updated institution was not returned.");
      }

      setInstitutions((current) =>
        current.map((item) =>
          item.id === institution.id
            ? data.institution
            : item
        )
      );

      if (selectedInstitution?.id === institution.id) {
        setSelectedInstitution(data.institution);
      }
    } catch (err) {
      setEducationError(
        err instanceof Error
          ? err.message
          : "Institution update failed."
      );
    } finally {
      setUpdatingInstitutionId(null);
    }
  }

  // ==========================================
  // UPDATE ADMISSION INQUIRY STATUS
  // ==========================================

  async function updateAdmissionInquiryStatus(
    inquiry: AdmissionInquiry,
    newStatus: InquiryStatus
  ) {
    setUpdatingInquiryId(inquiry.id);
    setAdmissionInquiryError("");

    try {
      const response = await fetch(
        "/api/admin/education/inquiries",
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inquiry_id: inquiry.id,
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update inquiry status."
        );
      }

      setAdmissionInquiries((current) =>
        current.map((item) =>
          item.id === inquiry.id
            ? {
                ...item,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (err) {
      setAdmissionInquiryError(
        err instanceof Error
          ? err.message
          : "Unable to update inquiry status."
      );
    } finally {
      setUpdatingInquiryId(null);
    }
  }

  // ==========================================
  // SAVE SEPARATE ADMIN PRIVATE NOTES
  // ==========================================

  async function saveAdmissionInquiryNotes(
    inquiry: AdmissionInquiry
  ) {
    const notes = inquiryNotesDrafts[inquiry.id] ?? "";

    setSavingInquiryNotesId(inquiry.id);
    setAdmissionInquiryError("");

    try {
      const response = await fetch(
        "/api/admin/education/inquiries",
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inquiry_id: inquiry.id,
            admin_private_notes: notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save Admin private notes."
        );
      }

      setAdmissionInquiries((current) =>
        current.map((item) =>
          item.id === inquiry.id
            ? {
                ...item,
                admin_private_notes: notes,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (err) {
      setAdmissionInquiryError(
        err instanceof Error
          ? err.message
          : "Unable to save Admin private notes."
      );
    } finally {
      setSavingInquiryNotesId(null);
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      setAuthenticated(false);

      setRequests([]);
      setInstitutions([]);
      setAdmissionInquiries([]);

      setInquiryNotesDrafts({});

      setEmail("");
      setPassword("");

      setSearch("");
      setFilter("All");

      setEducationSearch("");
      setInstitutionFilter("All");

      setAdmissionInstitutionFilter("All");
      setAdmissionCampusFilter("All");
      setAdmissionProgramFilter("All");
      setAdmissionStatusFilter("All");
      setAdmissionSearch("");

      setSelected(null);
      setSelectedInstitution(null);

      setError("");
      setEducationError("");
      setAdmissionInquiryError("");
    }
  }

  // ==========================================
  // STATUS STYLES
  // ==========================================

  function statusStyle(status?: string) {
    const value = normalizeStatus(status);

    if (value === "Approved") {
      return "border border-green-200 bg-green-50 text-green-800";
    }

    if (value === "Rejected") {
      return "border border-red-200 bg-red-50 text-red-700";
    }

    return "border border-[#D4AF37]/40 bg-[#F5F0E6] text-[#8A681B]";
  }

  function institutionStatusStyle(status: string) {
    if (status === "approved") {
      return "border border-green-200 bg-green-50 text-green-800";
    }

    if (status === "rejected") {
      return "border border-red-200 bg-red-50 text-red-700";
    }

    return "border border-[#D4AF37]/40 bg-[#F5F0E6] text-[#8A681B]";
  }

  function inquiryStatusStyle(status: string) {
    if (status === "accepted") {
      return "border border-green-200 bg-green-50 text-green-800";
    }

    if (status === "rejected" || status === "closed") {
      return "border border-red-200 bg-red-50 text-red-700";
    }

    if (status === "contacted" || status === "in_review") {
      return "border border-blue-200 bg-blue-50 text-blue-800";
    }

    return "border border-[#D4AF37]/40 bg-[#F5F0E6] text-[#8A681B]";
  }

  // ==========================================
  // ADVERTISING STATISTICS
  // ==========================================

  const pendingCount = requests.filter(
    (item) => normalizeStatus(item.status) === "Pending"
  ).length;

  const approvedCount = requests.filter(
    (item) => normalizeStatus(item.status) === "Approved"
  ).length;

  const rejectedCount = requests.filter(
    (item) => normalizeStatus(item.status) === "Rejected"
  ).length;

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((item) => {
      const matchesSearch = [
        item.business_name,
        item.contact_name,
        item.email,
        item.phone,
        item.advertising_details,
      ].some((value) =>
        (value || "").toLowerCase().includes(query)
      );

      const matchesStatus =
        filter === "All" ||
        normalizeStatus(item.status) === filter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, filter]);

  // ==========================================
  // EDUCATION STATISTICS
  // ==========================================

  const educationPendingCount = institutions.filter(
    (item) => item.verification_status === "pending"
  ).length;

  const educationApprovedCount = institutions.filter(
    (item) => item.verification_status === "approved"
  ).length;

  const educationRejectedCount = institutions.filter(
    (item) => item.verification_status === "rejected"
  ).length;

  const filteredInstitutions = useMemo(() => {
    const query = educationSearch.trim().toLowerCase();

    return institutions.filter((institution) => {
      const matchesSearch = [
        institution.institution_name,
        institution.institution_type,
        institution.city,
        institution.province,
        institution.email,
        institution.phone,
      ].some((value) =>
        (value || "").toLowerCase().includes(query)
      );

      const matchesStatus =
        institutionFilter === "All" ||
        institution.verification_status.toLowerCase() ===
          institutionFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [institutions, educationSearch, institutionFilter]);

  // ==========================================
  // ADMISSION INQUIRY FILTER OPTIONS
  // ==========================================

  const admissionCampusOptions = useMemo(() => {
    const source = admissionInstitutionFilter === "All"
      ? admissionInquiries
      : admissionInquiries.filter(
          (item) => item.institution_id === admissionInstitutionFilter
        );

    return Array.from(
      new Set(
        source
          .map((item) => item.campus_name)
          .filter((name): name is string => Boolean(name))
      )
    ).sort();
  }, [admissionInquiries, admissionInstitutionFilter]);

  const admissionProgramOptions = useMemo(() => {
    let source = admissionInquiries;

    if (admissionInstitutionFilter !== "All") {
      source = source.filter(
        (item) => item.institution_id === admissionInstitutionFilter
      );
    }

    if (admissionCampusFilter !== "All") {
      source = source.filter(
        (item) => item.campus_name === admissionCampusFilter
      );
    }

    return Array.from(
      new Set(
        source
          .map((item) => item.program_name)
          .filter((name): name is string => Boolean(name))
      )
    ).sort();
  }, [
    admissionInquiries,
    admissionInstitutionFilter,
    admissionCampusFilter,
  ]);

  // ==========================================
  // ADMISSION INQUIRY STATISTICS
  // ==========================================

  const inquiryNewCount = admissionInquiries.filter(
    (item) => item.status === "new"
  ).length;

  const inquiryContactedCount = admissionInquiries.filter(
    (item) => item.status === "contacted"
  ).length;

  const inquiryReviewCount = admissionInquiries.filter(
    (item) => item.status === "in_review"
  ).length;

  const inquiryAcceptedCount = admissionInquiries.filter(
    (item) => item.status === "accepted"
  ).length;

  const filteredAdmissionInquiries = useMemo(() => {
    const query = admissionSearch.trim().toLowerCase();

    return admissionInquiries.filter((inquiry) => {
      const institution = institutions.find(
        (item) => item.id === inquiry.institution_id
      );

      const institutionName = institution?.institution_name || "";

      const matchesSearch = [
        inquiry.student_name,
        inquiry.student_email,
        inquiry.student_phone,
        inquiry.message,
        inquiry.campus_name,
        inquiry.program_name,
        institutionName,
      ].some((value) =>
        (value || "").toLowerCase().includes(query)
      );

      const matchesInstitution =
        admissionInstitutionFilter === "All" ||
        inquiry.institution_id === admissionInstitutionFilter;

      const matchesCampus =
        admissionCampusFilter === "All" ||
        inquiry.campus_name === admissionCampusFilter;

      const matchesProgram =
        admissionProgramFilter === "All" ||
        inquiry.program_name === admissionProgramFilter;

      const matchesStatus =
        admissionStatusFilter === "All" ||
        inquiry.status === admissionStatusFilter;

      return (
        matchesSearch &&
        matchesInstitution &&
        matchesCampus &&
        matchesProgram &&
        matchesStatus
      );
    });
  }, [
    admissionInquiries,
    institutions,
    admissionSearch,
    admissionInstitutionFilter,
    admissionCampusFilter,
    admissionProgramFilter,
    admissionStatusFilter,
  ]);

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-4 py-10 text-[#123D2B] sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <header className="mb-10 rounded-3xl border border-[#D4AF37]/30 bg-[#123D2B] px-6 py-9 text-center shadow-xl sm:py-11">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E8C95B] bg-gradient-to-br from-[#E8C95B] to-[#B68A25] text-3xl font-black text-[#123D2B] shadow-lg">
            A
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            <span className="text-[#F7F3E8]">ALI</span>
            <span className="text-[#D6B45B]">QO Admin</span>
          </h1>

          <p className="mt-3 text-sm text-[#E1E8DF] sm:text-base">
            Professional ALIQO Management Dashboard
          </p>

          <div className="mx-auto mt-5 h-1 w-24 rounded-full bg-[#D4AF37]" />
        </header>

        {/* LOGIN */}

        {!authenticated ? (
          <form
            onSubmit={handleLogin}
            className="mx-auto max-w-md space-y-5 rounded-3xl border border-[#DED5C2] bg-white p-8 shadow-xl"
          >
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F0E6] text-2xl text-[#123D2B]">
                ♙
              </div>

              <h2 className="text-2xl font-black text-[#123D2B]">
                Admin Login
              </h2>

              <p className="mt-2 text-sm text-[#68766D]">
                Sign in to manage ALIQO services.
              </p>
            </div>

            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin Email"
              autoComplete="username"
              className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none placeholder:text-[#89958C] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />

            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none placeholder:text-[#89958C] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />

            {error && (
              <p className="break-words rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C95B] p-3 font-bold text-[#123D2B] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Secure Admin Login"}
            </button>
          </form>
        ) : (
          <section>

            {/* ADVERTISING STATISTICS */}

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Total Requests",
                  count: requests.length,
                  icon: "▤",
                },
                {
                  label: "Pending",
                  count: pendingCount,
                  icon: "◷",
                },
                {
                  label: "Approved",
                  count: approvedCount,
                  icon: "✓",
                },
                {
                  label: "Rejected",
                  count: rejectedCount,
                  icon: "×",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#68766D]">
                      {stat.label}
                    </p>

                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E6] text-xl font-bold text-[#A17C26]">
                      {stat.icon}
                    </span>
                  </div>

                  <p className="mt-3 text-3xl font-black text-[#123D2B]">
                    {stat.count}
                  </p>

                  <div className="mt-4 h-1 w-full rounded-full bg-[#F5F0E6]">
                    <div className="h-1 w-1/3 rounded-full bg-[#D4AF37]" />
                  </div>
                </div>
              ))}
            </div>

            {/* ADVERTISING ACTIONS */}

            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-[#123D2B]">
                  Advertising Requests
                </h2>

                <p className="mt-1 text-sm text-[#68766D]">
                  Review and manage business advertising applications.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin/deals"
                  className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C95B] px-4 py-2.5 font-bold text-[#123D2B] shadow-sm transition hover:brightness-105"
                >
                  Manage Deals →
                </Link>

                <Link
                  href="/admin/sellers"
                  className="rounded-xl bg-[#123D2B] px-4 py-2.5 font-bold text-white transition hover:bg-[#1B563C]"
                >
                  Manage Sellers →
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    loadRequests();
                    loadEducationInstitutions();
                    loadAdmissionInquiries();
                  }}
                  disabled={
                    loading ||
                    educationLoading ||
                    admissionInquiryLoading
                  }
                  className="rounded-xl border border-[#D4AF37]/60 bg-white px-4 py-2.5 font-semibold text-[#123D2B] transition hover:bg-[#F5F0E6] disabled:opacity-50"
                >
                  ↻ Refresh All
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Logout
                </button>
              </div>
            </div>

            {error && (
              <p className="mb-5 break-words rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                ⚠ {error}
              </p>
            )}

            {/* ADVERTISING SEARCH */}

            <div className="mb-6 grid gap-3 rounded-2xl border border-[#DED5C2] bg-white p-4 shadow-sm sm:grid-cols-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search business, name, email or phone..."
                className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none placeholder:text-[#89958C] focus:border-[#D4AF37]"
              />

              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as StatusFilter)
                }
                className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none"
              >
                <option value="All">All Requests</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <p className="mb-4 text-sm font-medium text-[#68766D]">
              Showing {filteredRequests.length} of {requests.length} requests
            </p>

            {/* ADVERTISING REQUEST LIST */}

            {filteredRequests.length === 0 ? (
              <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center shadow-sm">
                <div className="mb-4 text-4xl text-[#B58B2B]">▤</div>

                <h3 className="font-bold text-[#123D2B]">
                  No matching requests
                </h3>

                <p className="mt-2 text-sm text-[#68766D]">
                  No matching advertising requests found.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredRequests.map((item, index) => {
                  const status = normalizeStatus(item.status);

                  return (
                    <article
                      key={item.id ?? index}
                      className="rounded-2xl border border-[#DED5C2] bg-white p-6 shadow-sm transition hover:border-[#D4AF37] hover:shadow-lg sm:p-7"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-xl font-black text-[#123D2B]">
                          {item.business_name || "Business"}
                        </h3>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-bold ${statusStyle(status)}`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm text-[#123D2B] sm:grid-cols-2">
                        <p>
                          <strong>Contact:</strong>{" "}
                          {item.contact_name || "—"}
                        </p>

                        <p>
                          <strong>Email:</strong>{" "}
                          {item.email || "—"}
                        </p>

                        <p>
                          <strong>Phone:</strong>{" "}
                          {item.phone || "—"}
                        </p>
                      </div>

                      <div className="mt-5 rounded-xl border border-[#DED5C2] bg-[#F5F0E6] p-4">
                        <p className="mb-2 font-bold text-[#8A681B]">
                          Advertising Details
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-7 text-[#536457]">
                          {item.advertising_details || "—"}
                        </p>
                      </div>

                      {item.created_at && (
                        <p className="mt-4 text-xs text-[#68766D]">
                          Submitted:{" "}
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="rounded-xl border border-[#D4AF37]/50 bg-[#F5F0E6] px-4 py-2 font-semibold text-[#123D2B]"
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(item, "Approved")}
                          disabled={
                            updatingId === item.id ||
                            status === "Approved"
                          }
                          className="rounded-xl bg-[#123D2B] px-4 py-2 font-semibold text-white disabled:opacity-40"
                        >
                          {updatingId === item.id
                            ? "Updating..."
                            : "✓ Approve"}
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(item, "Rejected")}
                          disabled={
                            updatingId === item.id ||
                            status === "Rejected"
                          }
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 disabled:opacity-40"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteRequest(item)}
                          disabled={deletingId === item.id}
                          className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-700 disabled:opacity-40"
                        >
                          {deletingId === item.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* ======================================
                EDUCATION MANAGEMENT
            ====================================== */}

            <section className="mt-14">
              <div className="mb-6 rounded-3xl border border-[#D4AF37]/40 bg-[#123D2B] p-6 text-white shadow-xl sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold tracking-widest text-[#D6B45B]">
                      ALIQO EDUCATION
                    </p>

                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                      Education Management
                    </h2>

                    <p className="mt-2 text-sm text-[#E1E8DF]">
                      Review and manage school, college and university applications.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadEducationInstitutions}
                    disabled={educationLoading}
                    className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C95B] px-5 py-3 font-bold text-[#123D2B] disabled:opacity-50"
                  >
                    {educationLoading
                      ? "Loading..."
                      : "↻ Refresh Education"}
                  </button>
                </div>
              </div>

              {/* EDUCATION STATISTICS */}

              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Total Institutions",
                    count: institutions.length,
                    icon: "▤",
                  },
                  {
                    label: "Pending",
                    count: educationPendingCount,
                    icon: "◷",
                  },
                  {
                    label: "Approved",
                    count: educationApprovedCount,
                    icon: "✓",
                  },
                  {
                    label: "Rejected",
                    count: educationRejectedCount,
                    icon: "×",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#68766D]">
                        {stat.label}
                      </p>

                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E6] text-xl font-bold text-[#A17C26]">
                        {stat.icon}
                      </span>
                    </div>

                    <p className="mt-3 text-3xl font-black text-[#123D2B]">
                      {stat.count}
                    </p>
                  </div>
                ))}
              </div>

              {educationError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  ⚠ {educationError}
                </div>
              )}

              {/* EDUCATION SEARCH AND FILTER */}

              <div className="mb-6 grid gap-3 rounded-2xl border border-[#DED5C2] bg-white p-4 shadow-sm sm:grid-cols-2">
                <input
                  value={educationSearch}
                  onChange={(e) => setEducationSearch(e.target.value)}
                  placeholder="Search institution, city, email or phone..."
                  className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none focus:border-[#D4AF37]"
                />

                <select
                  value={institutionFilter}
                  onChange={(e) =>
                    setInstitutionFilter(
                      e.target.value as InstitutionFilter
                    )
                  }
                  className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none"
                >
                  <option value="All">All Institutions</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <p className="mb-4 text-sm font-medium text-[#68766D]">
                Showing {filteredInstitutions.length} of {institutions.length} institutions
              </p>

              {/* EDUCATION APPLICATIONS */}

              {educationLoading && institutions.length === 0 ? (
                <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center">
                  Loading institution applications...
                </div>
              ) : filteredInstitutions.length === 0 ? (
                <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center shadow-sm">
                  <div className="mb-4 text-4xl text-[#B58B2B]">
                    ▤
                  </div>

                  <h3 className="font-bold text-[#123D2B]">
                    No matching institutions
                  </h3>

                  <p className="mt-2 text-sm text-[#68766D]">
                    Institution applications will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredInstitutions.map((institution) => (
                    <article
                      key={institution.id}
                      className="rounded-2xl border border-[#DED5C2] bg-white p-6 shadow-sm transition hover:border-[#D4AF37] hover:shadow-lg sm:p-7"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black text-[#123D2B]">
                            {institution.institution_name}
                          </h3>

                          <p className="mt-1 text-sm capitalize text-[#68766D]">
                            {institution.institution_type}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-bold ${institutionStatusStyle(institution.verification_status)}`}
                        >
                          {institution.verification_status}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm text-[#123D2B] sm:grid-cols-2">
                        <p>
                          <strong>City:</strong>{" "}
                          {institution.city || "—"}
                        </p>

                        <p>
                          <strong>Province:</strong>{" "}
                          {institution.province || "—"}
                        </p>

                        <p>
                          <strong>Email:</strong>{" "}
                          {institution.email || "—"}
                        </p>

                        <p>
                          <strong>Phone:</strong>{" "}
                          {institution.phone || "—"}
                        </p>

                        <p>
                          <strong>Active:</strong>{" "}
                          {institution.is_active ? "Yes" : "No"}
                        </p>
                      </div>

                      {institution.admin_notes && (
                        <div className="mt-4 rounded-xl bg-[#F5F0E6] p-3 text-sm text-[#536457]">
                          <strong>Admin Notes:</strong>{" "}
                          {institution.admin_notes}
                        </div>
                      )}

                      {institution.created_at && (
                        <p className="mt-4 text-xs text-[#68766D]">
                          Submitted:{" "}
                          {new Date(institution.created_at).toLocaleString()}
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedInstitution(institution)
                          }
                          className="rounded-xl border border-[#D4AF37]/50 bg-[#F5F0E6] px-4 py-2 font-semibold text-[#123D2B]"
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateInstitutionStatus(
                              institution,
                              "approved"
                            )
                          }
                          disabled={
                            updatingInstitutionId === institution.id ||
                            institution.verification_status === "approved"
                          }
                          className="rounded-xl bg-[#123D2B] px-4 py-2 font-semibold text-white transition hover:bg-[#1B563C] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {updatingInstitutionId === institution.id
                            ? "Updating..."
                            : "✓ Approve"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateInstitutionStatus(
                              institution,
                              "rejected"
                            )
                          }
                          disabled={
                            updatingInstitutionId === institution.id ||
                            institution.verification_status === "rejected"
                          }
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* ======================================
                ADMIN ADMISSION INQUIRY MANAGEMENT
            ====================================== */}

            <section className="mt-14">
              <div className="mb-6 rounded-3xl border border-[#D4AF37]/40 bg-[#123D2B] p-6 text-white shadow-xl sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold tracking-widest text-[#D6B45B]">
                      ALIQO EDUCATION
                    </p>

                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                      Admission Inquiry Management
                    </h2>

                    <p className="mt-2 text-sm text-[#E1E8DF]">
                      Centralized management of admission inquiries across all institutions.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadAdmissionInquiries}
                    disabled={admissionInquiryLoading}
                    className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C95B] px-5 py-3 font-bold text-[#123D2B] disabled:opacity-50"
                  >
                    {admissionInquiryLoading
                      ? "Loading..."
                      : "↻ Refresh Inquiries"}
                  </button>
                </div>
              </div>

              {/* INQUIRY STATISTICS */}

              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  {
                    label: "Total Inquiries",
                    count: admissionInquiries.length,
                  },
                  {
                    label: "New",
                    count: inquiryNewCount,
                  },
                  {
                    label: "Contacted",
                    count: inquiryContactedCount,
                  },
                  {
                    label: "In Review",
                    count: inquiryReviewCount,
                  },
                  {
                    label: "Accepted",
                    count: inquiryAcceptedCount,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-[#68766D]">
                      {stat.label}
                    </p>

                    <p className="mt-3 text-3xl font-black text-[#123D2B]">
                      {stat.count}
                    </p>
                  </div>
                ))}
              </div>

              {admissionInquiryError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  ⚠ {admissionInquiryError}
                </div>
              )}

              {/* INQUIRY FILTERS */}

              <div className="mb-6 space-y-3 rounded-2xl border border-[#DED5C2] bg-white p-4 shadow-sm">
                <input
                  value={admissionSearch}
                  onChange={(e) => setAdmissionSearch(e.target.value)}
                  placeholder="Search student, email, phone, institution or message..."
                  className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none focus:border-[#D4AF37]"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={admissionInstitutionFilter}
                    onChange={(e) => {
                      setAdmissionInstitutionFilter(e.target.value);
                      setAdmissionCampusFilter("All");
                      setAdmissionProgramFilter("All");
                    }}
                    className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B]"
                  >
                    <option value="All">All Institutions</option>
                    {institutions.map((institution) => (
                      <option key={institution.id} value={institution.id}>
                        {institution.institution_name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={admissionCampusFilter}
                    onChange={(e) => {
                      setAdmissionCampusFilter(e.target.value);
                      setAdmissionProgramFilter("All");
                    }}
                    className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B]"
                  >
                    <option value="All">All Campuses</option>
                    {admissionCampusOptions.map((campus) => (
                      <option key={campus} value={campus}>
                        {campus}
                      </option>
                    ))}
                  </select>

                  <select
                    value={admissionProgramFilter}
                    onChange={(e) =>
                      setAdmissionProgramFilter(e.target.value)
                    }
                    className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B]"
                  >
                    <option value="All">All Programs</option>
                    {admissionProgramOptions.map((program) => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>

                  <select
                    value={admissionStatusFilter}
                    onChange={(e) =>
                      setAdmissionStatusFilter(e.target.value)
                    }
                    className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B]"
                  >
                    <option value="All">All Inquiry Statuses</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="in_review">In Review</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAdmissionSearch("");
                    setAdmissionInstitutionFilter("All");
                    setAdmissionCampusFilter("All");
                    setAdmissionProgramFilter("All");
                    setAdmissionStatusFilter("All");
                  }}
                  className="rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-sm font-semibold text-[#123D2B] hover:bg-[#F5F0E6]"
                >
                  Clear Filters
                </button>
              </div>

              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#68766D]">
                  Showing {filteredAdmissionInquiries.length} of{" "}
                  {admissionInquiries.length} inquiries
                </p>

                <p className="text-xs text-[#68766D]">
                  Admin private notes are separate from Owner notes.
                </p>
              </div>

              {/* INQUIRY LIST */}

              {admissionInquiryLoading &&
              admissionInquiries.length === 0 ? (
                <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center">
                  Loading admission inquiries...
                </div>
              ) : filteredAdmissionInquiries.length === 0 ? (
                <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center shadow-sm">
                  <div className="mb-4 text-4xl text-[#B58B2B]">
                    ▤
                  </div>

                  <h3 className="font-bold text-[#123D2B]">
                    No matching admission inquiries
                  </h3>

                  <p className="mt-2 text-sm text-[#68766D]">
                    Admission inquiries will appear here when students submit applications.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredAdmissionInquiries.map((inquiry) => {
                    const institution = institutions.find(
                      (item) => item.id === inquiry.institution_id
                    );

                    return (
                      <article
                        key={inquiry.id}
                        className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:border-[#D4AF37] hover:shadow-lg sm:p-7"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#A17C26]">
                              Admission Inquiry
                            </p>

                            <h3 className="mt-1 text-xl font-black text-[#123D2B]">
                              {inquiry.student_name || "Student"}
                            </h3>

                            <p className="mt-1 text-sm text-[#68766D]">
                              {institution?.institution_name ||
                                "Institution information unavailable"}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-4 py-2 text-sm font-bold ${inquiryStatusStyle(inquiry.status)}`}
                          >
                            {formatInquiryStatus(inquiry.status)}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-3 text-sm text-[#123D2B] sm:grid-cols-2">
                          <p>
                            <strong>Student Email:</strong>{" "}
                            {inquiry.student_email || "—"}
                          </p>

                          <p>
                            <strong>Student Phone:</strong>{" "}
                            {inquiry.student_phone || "—"}
                          </p>

                          <p>
                            <strong>Campus:</strong>{" "}
                            {inquiry.campus_name || "—"}
                          </p>

                          <p>
                            <strong>Program:</strong>{" "}
                            {inquiry.program_name || "—"}
                          </p>

                          <p>
                            <strong>Submitted:</strong>{" "}
                            {inquiry.created_at
                              ? new Date(inquiry.created_at).toLocaleString()
                              : "—"}
                          </p>

                          <p>
                            <strong>Last Updated:</strong>{" "}
                            {inquiry.updated_at
                              ? new Date(inquiry.updated_at).toLocaleString()
                              : "—"}
                          </p>
                        </div>

                        <div className="mt-5 rounded-xl border border-[#DED5C2] bg-[#F5F0E6] p-4">
                          <p className="mb-2 font-bold text-[#8A681B]">
                            Student Message
                          </p>

                          <p className="whitespace-pre-wrap text-sm leading-7 text-[#536457]">
                            {inquiry.message || "No message provided."}
                          </p>
                        </div>

                        {/* ADMIN STATUS */}

                        <div className="mt-5">
                          <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                            Update Inquiry Status
                          </label>

                          <select
                            value={inquiry.status}
                            disabled={updatingInquiryId === inquiry.id}
                            onChange={(e) =>
                              updateAdmissionInquiryStatus(
                                inquiry,
                                e.target.value as InquiryStatus
                              )
                            }
                            className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-sm text-[#123D2B] outline-none focus:border-[#D4AF37] disabled:opacity-50 sm:max-w-sm"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="in_review">In Review</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="closed">Closed</option>
                          </select>

                          {updatingInquiryId === inquiry.id && (
                            <p className="mt-2 text-xs text-[#68766D]">
                              Updating status...
                            </p>
                          )}
                        </div>

                        {/* ADMIN PRIVATE NOTES */}

                        <div className="mt-5 rounded-xl border border-[#D4AF37]/40 bg-[#FDFBF7] p-4">
                          <div className="mb-3">
                            <p className="font-bold text-[#123D2B]">
                              Admin Private Notes
                            </p>

                            <p className="mt-1 text-xs leading-5 text-[#68766D]">
                              These notes are for Admin use only and are separate from institution Owner notes and institution approval notes.
                            </p>
                          </div>

                          <textarea
                            value={
                              inquiryNotesDrafts[inquiry.id] ??
                              inquiry.admin_private_notes ??
                              ""
                            }
                            onChange={(e) =>
                              setInquiryNotesDrafts((current) => ({
                                ...current,
                                [inquiry.id]: e.target.value,
                              }))
                            }
                            rows={3}
                            maxLength={5000}
                            placeholder="Write private Admin notes..."
                            className="w-full resize-y rounded-xl border border-[#DED5C2] bg-white p-3 text-sm text-[#123D2B] outline-none focus:border-[#D4AF37]"
                          />

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs text-[#68766D]">
                              {(inquiryNotesDrafts[inquiry.id] ??
                                inquiry.admin_private_notes ??
                                "").length}/5000 characters
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                saveAdmissionInquiryNotes(inquiry)
                              }
                              disabled={
                                savingInquiryNotesId === inquiry.id ||
                                (
                                  inquiryNotesDrafts[inquiry.id] ??
                                  inquiry.admin_private_notes ??
                                  ""
                                ) === (inquiry.admin_private_notes || "")
                              }
                              className="rounded-xl bg-[#123D2B] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1B563C] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {savingInquiryNotesId === inquiry.id
                                ? "Saving..."
                                : "Save Admin Notes"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ADVERTISING DETAILS MODAL */}

            {selected && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123D2B]/70 p-4 backdrop-blur-sm">
                <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#D4AF37]/50 bg-white p-6 text-[#123D2B] shadow-2xl">
                  <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#DED5C2] pb-4">
                    <h2 className="text-xl font-black">
                      Request Details
                    </h2>

                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="rounded-xl bg-[#123D2B] px-4 py-2 font-semibold text-white"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-4 text-sm">
                    <p>
                      <strong>Business:</strong>{" "}
                      {selected.business_name || "—"}
                    </p>

                    <p>
                      <strong>Contact:</strong>{" "}
                      {selected.contact_name || "—"}
                    </p>

                    <p>
                      <strong>Email:</strong>{" "}
                      {selected.email || "—"}
                    </p>

                    <p>
                      <strong>Phone:</strong>{" "}
                      {selected.phone || "—"}
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      {normalizeStatus(selected.status)}
                    </p>

                    <div className="rounded-xl bg-[#F5F0E6] p-4">
                      <strong className="text-[#8A681B]">
                        Advertising Details:
                      </strong>

                      <p className="mt-2 whitespace-pre-wrap leading-7 text-[#536457]">
                        {selected.advertising_details || "—"}
                      </p>
                    </div>

                    {selected.created_at && (
                      <p>
                        <strong>Submitted:</strong>{" "}
                        {new Date(selected.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* INSTITUTION DETAILS MODAL */}

            {selectedInstitution && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#123D2B]/70 p-4 backdrop-blur-sm">
                <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#D4AF37]/50 bg-white p-6 text-[#123D2B] shadow-2xl">
                  <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#DED5C2] pb-4">
                    <h2 className="text-xl font-black">
                      Institution Details
                    </h2>

                    <button
                      type="button"
                      onClick={() => setSelectedInstitution(null)}
                      className="rounded-xl bg-[#123D2B] px-4 py-2 font-semibold text-white"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-4 text-sm">
                    <p>
                      <strong>Institution:</strong>{" "}
                      {selectedInstitution.institution_name}
                    </p>

                    <p>
                      <strong>Type:</strong>{" "}
                      {selectedInstitution.institution_type}
                    </p>

                    <p>
                      <strong>Email:</strong>{" "}
                      {selectedInstitution.email || "—"}
                    </p>

                    <p>
                      <strong>Phone:</strong>{" "}
                      {selectedInstitution.phone || "—"}
                    </p>

                    <p>
                      <strong>WhatsApp:</strong>{" "}
                      {selectedInstitution.whatsapp_number || "—"}
                    </p>

                    <p>
                      <strong>Website:</strong>{" "}
                      {selectedInstitution.website_url || "—"}
                    </p>

                    <p>
                      <strong>Location:</strong>{" "}
                      {[
                        selectedInstitution.address,
                        selectedInstitution.city,
                        selectedInstitution.province,
                      ].filter(Boolean).join(", ") || "—"}
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      {selectedInstitution.verification_status}
                    </p>

                    <p>
                      <strong>Active:</strong>{" "}
                      {selectedInstitution.is_active ? "Yes" : "No"}
                    </p>

                    <div>
                      <strong>Description:</strong>

                      <p className="mt-2 whitespace-pre-wrap rounded-xl bg-[#F5F0E6] p-4 leading-7">
                        {selectedInstitution.description ||
                          "No description provided."}
                      </p>
                    </div>

                    {selectedInstitution.admin_notes && (
                      <p>
                        <strong>Admin Notes:</strong>{" "}
                        {selectedInstitution.admin_notes}
                      </p>
                    )}

                    {selectedInstitution.created_at && (
                      <p>
                        <strong>Submitted:</strong>{" "}
                        {new Date(
                          selectedInstitution.created_at
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

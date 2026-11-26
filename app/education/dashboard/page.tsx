
"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";

type Institution = {
  id: string;
  institution_name: string;
  institution_type: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  website_url: string | null;
  country: string;
  province: string | null;
  city: string;
  address: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  verification_status: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

type Campus = {
  id: string;
  institution_id: string;
  campus_name: string;
  city: string;
  province: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active?: boolean;
};

type CampusDraft = {
  campus_name: string;
  province: string;
  city: string;
  address: string;
  phone: string;
  email: string;
};

const EMPTY_CAMPUS: CampusDraft = {
  campus_name: "",
  province: "",
  city: "",
  address: "",
  phone: "",
  email: "",
};

type Program = {
  id: string;
  institution_id: string;
  campus_id: string | null;
  program_type: "school_class" | "course" | "degree";
  program_name: string;
  description: string | null;
  eligibility: string | null;
  fee_min: number | null;
  fee_max: number | null;
  duration: string | null;
  admission_open: boolean;
  is_active: boolean;
  created_at: string;
};

type ProgramDraft = {
  campus_id: string;
  program_type: "school_class" | "course" | "degree";
  program_name: string;
  description: string;
  eligibility: string;
  fee_min: string;
  fee_max: string;
  duration: string;
  admission_open: boolean;
};

const EMPTY_PROGRAM: ProgramDraft = {
  campus_id: "",
  program_type: "course",
  program_name: "",
  description: "",
  eligibility: "",
  fee_min: "",
  fee_max: "",
  duration: "",
  admission_open: false,
};

type ProfileDraft = {
  institution_name: string;
  institution_type: string;
  description: string;
  phone: string;
  whatsapp_number: string;
  website_url: string;
  country: string;
  province: string;
  city: string;
  address: string;
  logo_url: string;
  cover_image_url: string;
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
  owner_notes: string | null;
  created_at: string;
  updated_at: string;
};

type InquiryDraft = {
  status: InquiryStatus;
  owner_notes: string;
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

const EMPTY_PROFILE: ProfileDraft = {
  institution_name: "",
  institution_type: "academy",
  description: "",
  phone: "",
  whatsapp_number: "",
  website_url: "",
  country: "Pakistan",
  province: "",
  city: "",
  address: "",
  logo_url: "",
  cover_image_url: "",
};

const PROFILE_FIELDS: {
  key: keyof ProfileDraft;
  label: string;
  required?: boolean;
  multiline?: boolean;
  type?: string;
}[] = [
  { key: "institution_name", label: "Institution Name", required: true },
  { key: "institution_type", label: "Institution Type", required: true },
  { key: "phone", label: "Phone Number", required: true },
  { key: "whatsapp_number", label: "WhatsApp Number" },
  { key: "website_url", label: "Website URL", type: "url" },
  { key: "country", label: "Country", required: true },
  { key: "province", label: "Province / State" },
  { key: "city", label: "City", required: true },
  { key: "address", label: "Address" },
  { key: "logo_url", label: "Logo Image URL", type: "url" },
  { key: "cover_image_url", label: "Cover Image URL", type: "url" },
  { key: "description", label: "Institution Description", multiline: true },
];

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

function createProfileDraft(institution: Institution): ProfileDraft {
  return {
    institution_name: institution.institution_name || "",
    institution_type: institution.institution_type || "academy",
    description: institution.description || "",
    phone: institution.phone || "",
    whatsapp_number: institution.whatsapp_number || "",
    website_url: institution.website_url || "",
    country: institution.country || "Pakistan",
    province: institution.province || "",
    city: institution.city || "",
    address: institution.address || "",
    logo_url: institution.logo_url || "",
    cover_image_url: institution.cover_image_url || "",
  };
}

export default function EducationOwnerDashboard(): ReactElement {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institution, setInstitution] = useState<Institution | null>(null);

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [drafts, setDrafts] = useState<Record<string, InquiryDraft>>({});

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusDraft, setCampusDraft] = useState<CampusDraft>(EMPTY_CAMPUS);
  const [editingCampusId, setEditingCampusId] = useState<string | null>(null);
  const [savingCampus, setSavingCampus] = useState(false);
  const [campusMessage, setCampusMessage] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programDraft, setProgramDraft] = useState<ProgramDraft>(EMPTY_PROGRAM);
  const [programMessage, setProgramMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  const [savingInquiry, setSavingInquiry] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const [profileDraft, setProfileDraft] =
    useState<ProfileDraft>(EMPTY_PROFILE);

  const [message, setMessage] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

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
        owner_notes: item.owner_notes || "",
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

  async function loadProgramsAndCampuses(
    token: string,
    institutionId: string
  ) {
    setLoadingPrograms(true);
    setProgramMessage("");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [campusResponse, programResponse] = await Promise.all([
        fetch(
          `/api/education/campuses?institution_id=${encodeURIComponent(institutionId)}`,
          { headers, cache: "no-store" }
        ),
        fetch(
          `/api/education/programs?institution_id=${encodeURIComponent(institutionId)}`,
          { headers, cache: "no-store" }
        ),
      ]);

      const [campusData, programData] = await Promise.all([
        campusResponse.json(),
        programResponse.json(),
      ]);

      if (!campusResponse.ok) {
        throw new Error(
          getErrorMessage(campusData, "Unable to load institution campuses.")
        );
      }

      if (!programResponse.ok) {
        throw new Error(
          getErrorMessage(programData, "Unable to load programs.")
        );
      }

      setCampuses(Array.isArray(campusData.campuses) ? campusData.campuses : []);
      setPrograms(Array.isArray(programData.programs) ? programData.programs : []);
      setProgramMessage("");
    } catch (error) {
      setCampuses([]);
      setPrograms([]);
      setProgramMessage(
        error instanceof Error ? error.message : "Unable to load programs."
      );
    } finally {
      setLoadingPrograms(false);
    }
  }

  function resetCampusForm() {
    setEditingCampusId(null);
    setCampusDraft(EMPTY_CAMPUS);
    setCampusMessage("");
  }

  function updateCampusDraft(field: keyof CampusDraft, value: string) {
    setCampusDraft((previous) => ({ ...previous, [field]: value }));
  }

  function handleEditCampus(campus: Campus) {
    setEditingCampusId(campus.id);
    setCampusDraft({
      campus_name: campus.campus_name || "",
      province: campus.province || "",
      city: campus.city || "",
      address: campus.address || "",
      phone: campus.phone || "",
      email: campus.email || "",
    });
    setCampusMessage("");
  }

  async function handleSaveCampus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!institution) return;

    const token = localStorage.getItem("aliqo_education_token");
    if (!token) {
      handleLogout();
      return;
    }

    const campusName = campusDraft.campus_name.trim();
    const city = campusDraft.city.trim();
    const emailValue = campusDraft.email.trim();

    if (!campusName || !city) {
      setCampusMessage("Campus name and city are required.");
      return;
    }

    if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setCampusMessage("Please enter a valid campus email.");
      return;
    }

    setSavingCampus(true);
    setCampusMessage("");

    try {
      const payload = {
        institution_id: institution.id,
        ...(editingCampusId ? { campus_id: editingCampusId } : {}),
        campus_name: campusName,
        province: campusDraft.province.trim() || null,
        city,
        address: campusDraft.address.trim() || null,
        phone: campusDraft.phone.trim() || null,
        email: emailValue || null,
      };

      const response = await fetch("/api/education/campuses", {
        method: editingCampusId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to save campus."));
      }

      const wasEditing = Boolean(editingCampusId);
      await loadProgramsAndCampuses(token, institution.id);
      setEditingCampusId(null);
      setCampusDraft(EMPTY_CAMPUS);
      setCampusMessage(
        wasEditing
          ? "Campus updated successfully."
          : "Campus added successfully."
      );
    } catch (error) {
      setCampusMessage(
        error instanceof Error ? error.message : "Unable to save campus."
      );
    } finally {
      setSavingCampus(false);
    }
  }

  async function handleToggleCampus(campus: Campus) {
    if (!institution) return;

    const token = localStorage.getItem("aliqo_education_token");
    if (!token) {
      handleLogout();
      return;
    }

    const nextActive = campus.is_active === false;
    const confirmed = window.confirm(
      nextActive
        ? `Activate "${campus.campus_name}"?`
        : `Deactivate "${campus.campus_name}"? Existing records will be preserved.`
    );
    if (!confirmed) return;

    setSavingCampus(true);
    setCampusMessage("");

    try {
      const response = await fetch("/api/education/campuses", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campus_id: campus.id,
          institution_id: institution.id,
          is_active: nextActive,
        }),
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to update campus status.")
        );
      }

      await loadProgramsAndCampuses(token, institution.id);
      setCampusMessage(
        nextActive
          ? "Campus activated successfully."
          : "Campus deactivated successfully."
      );
    } catch (error) {
      setCampusMessage(
        error instanceof Error
          ? error.message
          : "Unable to update campus status."
      );
    } finally {
      setSavingCampus(false);
    }
  }

  async function handleDeleteCampus(campus: Campus) {
    if (!institution) return;

    const hasPrograms = programs.some(
      (program) => program.campus_id === campus.id
    );
    const hasInquiries = inquiries.some(
      (inquiry) => inquiry.campus_id === campus.id
    );

    if (hasPrograms || hasInquiries) {
      setCampusMessage(
        "This campus has linked programs or admission inquiries. Deactivate it instead to protect existing records."
      );
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete "${campus.campus_name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    const token = localStorage.getItem("aliqo_education_token");
    if (!token) {
      handleLogout();
      return;
    }

    setSavingCampus(true);
    setCampusMessage("");

    try {
      const response = await fetch("/api/education/campuses", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campus_id: campus.id,
          institution_id: institution.id,
        }),
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to delete campus."));
      }

      if (editingCampusId === campus.id) resetCampusForm();
      await loadProgramsAndCampuses(token, institution.id);
      setCampusMessage("Campus deleted successfully.");
    } catch (error) {
      setCampusMessage(
        error instanceof Error ? error.message : "Unable to delete campus."
      );
    } finally {
      setSavingCampus(false);
    }
  }

  function resetProgramForm() {
    setEditingProgramId(null);
    setProgramDraft(EMPTY_PROGRAM);
    setProgramMessage("");
  }

  function updateProgramDraft<K extends keyof ProgramDraft>(
    field: K,
    value: ProgramDraft[K]
  ) {
    setProgramDraft((previous) => ({ ...previous, [field]: value }));
  }

  function handleEditProgram(program: Program) {
    setEditingProgramId(program.id);
    setProgramDraft({
      campus_id: program.campus_id || "",
      program_type: program.program_type,
      program_name: program.program_name || "",
      description: program.description || "",
      eligibility: program.eligibility || "",
      fee_min: program.fee_min === null ? "" : String(program.fee_min),
      fee_max: program.fee_max === null ? "" : String(program.fee_max),
      duration: program.duration || "",
      admission_open: Boolean(program.admission_open),
    });
    setProgramMessage("");
  }

  async function handleSaveProgram(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!institution) return;

    const token = localStorage.getItem("aliqo_education_token");
    if (!token) {
      handleLogout();
      return;
    }

    const cleanName = programDraft.program_name.trim();
    if (!cleanName) {
      setProgramMessage("Program name is required.");
      return;
    }

    const minFee =
      programDraft.fee_min.trim() === "" ? null : Number(programDraft.fee_min);
    const maxFee =
      programDraft.fee_max.trim() === "" ? null : Number(programDraft.fee_max);

    if (
      (minFee !== null && (!Number.isFinite(minFee) || minFee < 0)) ||
      (maxFee !== null && (!Number.isFinite(maxFee) || maxFee < 0))
    ) {
      setProgramMessage("Please enter valid, non-negative fee amounts.");
      return;
    }

    if (minFee !== null && maxFee !== null && maxFee < minFee) {
      setProgramMessage("Maximum fee cannot be less than minimum fee.");
      return;
    }

    setSavingProgram(true);
    setProgramMessage("");

    try {
      const payload = {
        institution_id: institution.id,
        ...(editingProgramId ? { program_id: editingProgramId } : {}),
        campus_id: programDraft.campus_id || null,
        program_type: programDraft.program_type,
        program_name: cleanName,
        description: programDraft.description.trim() || null,
        eligibility: programDraft.eligibility.trim() || null,
        fee_min: minFee,
        fee_max: maxFee,
        duration: programDraft.duration.trim() || null,
        admission_open: programDraft.admission_open,
      };

      const response = await fetch("/api/education/programs", {
        method: editingProgramId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to save program."));
      }

      await loadProgramsAndCampuses(token, institution.id);
      setEditingProgramId(null);
      setProgramDraft(EMPTY_PROGRAM);
      setProgramMessage(
        editingProgramId
          ? "Program updated successfully."
          : "Program added successfully."
      );
    } catch (error) {
      setProgramMessage(
        error instanceof Error ? error.message : "Unable to save program."
      );
    } finally {
      setSavingProgram(false);
    }
  }

  async function handleToggleProgram(program: Program) {
    if (!institution) return;

    const token = localStorage.getItem("aliqo_education_token");
    if (!token) {
      handleLogout();
      return;
    }

    setSavingProgram(true);
    setProgramMessage("");

    try {
      const response = await fetch("/api/education/programs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          program_id: program.id,
          institution_id: institution.id,
          is_active: !program.is_active,
        }),
        cache: "no-store",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to update program status."));
      }

      await loadProgramsAndCampuses(token, institution.id);
      setProgramMessage(
        program.is_active
          ? "Program deactivated successfully."
          : "Program activated successfully."
      );
    } catch (error) {
      setProgramMessage(
        error instanceof Error ? error.message : "Unable to update program status."
      );
    } finally {
      setSavingProgram(false);
    }
  }

  async function handleDeleteProgram(program: Program) {
    if (!institution) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${program.program_name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("aliqo_education_token");
    if (!token) {
      handleLogout();
      return;
    }

    setSavingProgram(true);
    setProgramMessage("");

    try {
      const response = await fetch("/api/education/programs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          program_id: program.id,
          institution_id: institution.id,
        }),
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to delete program."));
      }

      if (editingProgramId === program.id) {
        setEditingProgramId(null);
        setProgramDraft(EMPTY_PROGRAM);
      }

      await loadProgramsAndCampuses(token, institution.id);
      setProgramMessage("Program deleted successfully.");
    } catch (error) {
      setProgramMessage(
        error instanceof Error ? error.message : "Unable to delete program."
      );
    } finally {
      setSavingProgram(false);
    }
  }

  // Owner institutions are loaded through the protected server API.
  async function fetchOwnerInstitutions(token: string) {
    const response = await fetch("/api/education/institutions/my", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Unable to load your institution information."
        )
      );
    }

    if (!Array.isArray(data.institutions)) {
      throw new Error("Invalid institution information received.");
    }

    return data.institutions as Institution[];
  }

  async function loadOwner(token: string) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Database configuration is missing.");
    }

    // Verify session before requesting the protected owner API.
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

    const institutionData = await fetchOwnerInstitutions(token);

    if (!institutionData.length) {
      throw new Error(
        "No institution is linked to this account. Please register your institution first."
      );
    }

    setInstitutions(institutionData);
    setInstitution(institutionData[0]);
    setProfileDraft(createProfileDraft(institutionData[0]));
    setEditingProfile(false);

    localStorage.setItem("aliqo_education_token", token);

    await Promise.all([
      loadInquiries(token, institutionData[0].id),
      loadProgramsAndCampuses(token, institutionData[0].id),
    ]);
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
    setProfileDraft(createProfileDraft(selected));
    setEditingProfile(false);
    setProfileMessage("");
    resetCampusForm();
    setFilterStatus("all");

    await Promise.all([
      loadInquiries(token, selected.id),
      loadProgramsAndCampuses(token, selected.id),
    ]);
  }

  function handleLogout() {
    localStorage.removeItem("aliqo_education_token");

    setInstitution(null);
    setInstitutions([]);
    setInquiries([]);
    setDrafts({});
    setCampuses([]);
    setPrograms([]);
    resetCampusForm();
    setCampusMessage("");
    resetProgramForm();
    setPassword("");
    setEditingProfile(false);
    setProfileMessage("");

    setMessage("You have been logged out.");
    setInquiryMessage("");
  }

  function updateProfileDraft(
    field: keyof ProfileDraft,
    value: string
  ) {
    setProfileDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleCancelProfileEdit() {
    if (institution) {
      setProfileDraft(createProfileDraft(institution));
    }

    setEditingProfile(false);
    setProfileMessage("");
  }

  async function handleSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!institution) return;

    const token = localStorage.getItem("aliqo_education_token");

    if (!token) {
      handleLogout();
      return;
    }

    setSavingProfile(true);
    setProfileMessage("");

    try {
      const response = await fetch(
        `/api/education/institutions/${encodeURIComponent(institution.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileDraft),
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          getErrorMessage(data, "Unable to update institution profile.")
        );
      }

      // Reload through Owner GET API to obtain the complete saved profile.
      const refreshedInstitutions = await fetchOwnerInstitutions(token);

      const refreshedInstitution = refreshedInstitutions.find(
        (item) => item.id === institution.id
      );

      if (!refreshedInstitution) {
        throw new Error(
          "Profile was updated, but the refreshed institution could not be loaded."
        );
      }

      setInstitutions(refreshedInstitutions);
      setInstitution(refreshedInstitution);
      setProfileDraft(createProfileDraft(refreshedInstitution));
      setEditingProfile(false);
      setProfileMessage("Institution profile updated successfully.");
    } catch (error) {
      setProfileMessage(
        error instanceof Error
          ? error.message
          : "Unable to update institution profile."
      );
    } finally {
      setSavingProfile(false);
    }
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
      owner_notes: previous[inquiryId]?.owner_notes || "",
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
          owner_notes: draft.owner_notes,
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
  owner_notes: data.inquiry.owner_notes || "",
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

                <div className="flex flex-wrap items-center gap-3">
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

                  {!editingProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDraft(createProfileDraft(institution));
                        setProfileMessage("");
                        setEditingProfile(true);
                      }}
                      className="rounded-xl bg-[#064B38] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B6048] hover:text-[#E8C95B]"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {profileMessage && (
                <div className="mt-5 rounded-xl border border-[#E8C95B] bg-[#FFF4D6] p-4 text-sm leading-6 text-[#765707]">
                  {profileMessage}
                </div>
              )}

              {editingProfile ? (
                <form onSubmit={handleSaveProfile} className="mt-6">
                  <div className="mb-5 rounded-xl border border-[#E8C95B] bg-[#FFF4D6] p-4 text-sm leading-6 text-[#765707]">
                    Update your institution profile information below.
                    Your registered email and account approval status cannot
                    be changed here.
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {PROFILE_FIELDS.map((field) => (
                      <div
                        key={field.key}
                        className={
                          field.multiline ? "sm:col-span-2" : ""
                        }
                      >
                        <label className="mb-2 block text-sm font-bold text-[#064B38]">
                          {field.label}
                          {field.required && (
                            <span className="ml-1 text-red-600">*</span>
                          )}
                        </label>

                        {field.key === "institution_type" ? (
                          <select
                            required
                            value={profileDraft.institution_type}
                            onChange={(e) =>
                              updateProfileDraft(
                                "institution_type",
                                e.target.value
                              )
                            }
                            className={inputClass}
                          >
                            <option value="school">School</option>
                            <option value="college">College</option>
                            <option value="university">University</option>
                            <option value="academy">Academy</option>
                            <option value="institute">Institute</option>
                            <option value="other">Other</option>
                          </select>
                        ) : field.multiline ? (
                          <textarea
                            rows={5}
                            maxLength={3000}
                            value={profileDraft[field.key]}
                            onChange={(e) =>
                              updateProfileDraft(field.key, e.target.value)
                            }
                            placeholder="Describe your institution..."
                            className={inputClass}
                          />
                        ) : (
                          <input
                            type={field.type || "text"}
                            required={field.required}
                            maxLength={
                              field.key === "institution_name"
                                ? 200
                                : field.key === "phone" ||
                                    field.key === "whatsapp_number"
                                  ? 30
                                  : field.type === "url"
                                    ? 2048
                                    : 500
                            }
                            value={profileDraft[field.key]}
                            onChange={(e) =>
                              updateProfileDraft(field.key, e.target.value)
                            }
                            className={inputClass}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCancelProfileEdit}
                      disabled={savingProfile}
                      className="rounded-xl border border-[#DED5C2] px-6 py-3 text-sm font-bold text-[#064B38] transition hover:bg-[#F7F3E8] disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="rounded-xl bg-[#064B38] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#0B6048] hover:text-[#E8C95B] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingProfile ? "Saving..." : "Save Profile Changes →"}
                    </button>
                  </div>
                </form>
              ) : (
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
              )}
            </section>

            <section className="mt-7 rounded-3xl border border-[#DED5C2] bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#B18B20]">
                    Academic Management
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#064B38]">
                    Campus Management
                  </h2>
                  <p className="mt-2 text-sm text-[#68766D]">
                    Add, update and manage the campuses of your institution.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const token = localStorage.getItem("aliqo_education_token");
                    if (token && institution) {
                      loadProgramsAndCampuses(token, institution.id);
                    }
                  }}
                  disabled={loadingPrograms || savingCampus}
                  className="rounded-xl border border-[#D6B45B] px-5 py-3 text-sm font-bold text-[#064B38] transition hover:bg-[#FFF4D6] disabled:opacity-50"
                >
                  {loadingPrograms ? "Refreshing..." : "↻ Refresh Campuses"}
                </button>
              </div>

              {campusMessage && (
                <div className="mt-5 rounded-xl border border-[#E8C95B] bg-[#FFF4D6] p-4 text-sm leading-6 text-[#765707">
                  {campusMessage}
                </div>
              )}

              <form
                onSubmit={handleSaveCampus}
                className="mt-6 rounded-2xl border border-[#DED5C2] bg-[#F7F3E8] p-5"
              >
                <h3 className="text-lg font-black text-[#064B38]">
                  {editingCampusId ? "Edit Campus" : "Add New Campus"}
                </h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">
                      Campus Name *
                    </label>
                    <input
                      required
                      maxLength={200}
                      value={campusDraft.campus_name}
                      onChange={(e) => updateCampusDraft("campus_name", e.target.value)}
                      placeholder="e.g. Main Campus"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">
                      City *
                    </label>
                    <input
                      required
                      maxLength={100}
                      value={campusDraft.city}
                      onChange={(e) => updateCampusDraft("city", e.target.value)}
                      placeholder="e.g. Karachi"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">
                      Province / State
                    </label>
                    <input
                      maxLength={100}
                      value={campusDraft.province}
                      onChange={(e) => updateCampusDraft("province", e.target.value)}
                      placeholder="e.g. Sindh"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">
                      Phone Number
                    </label>
                    <input
                      maxLength={30}
                      value={campusDraft.phone}
                      onChange={(e) => updateCampusDraft("phone", e.target.value)}
                      placeholder="Campus contact number"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      maxLength={254}
                      value={campusDraft.email}
                      onChange={(e) => updateCampusDraft("email", e.target.value)}
                      placeholder="campus@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">
                      Full Address
                    </label>
                    <input
                      maxLength={500}
                      value={campusDraft.address}
                      onChange={(e) => updateCampusDraft("address", e.target.value)}
                      placeholder="Campus street address"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  {editingCampusId && (
                    <button
                      type="button"
                      onClick={resetCampusForm}
                      disabled={savingCampus}
                      className="rounded-xl border border-[#DED5C2] px-6 py-3 text-sm font-bold text-[#064B38] hover:bg-white disabled:opacity-50"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingCampus}
                    className="rounded-xl bg-[#064B38] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#0B6048] hover:text-[#E8C95B] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingCampus
                      ? "Saving..."
                      : editingCampusId
                        ? "Save Campus Changes →"
                        : "Add Campus →"}
                  </button>
                </div>
              </form>

              <div className="mt-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-black text-[#064B38]">
                    Existing Campuses
                  </h3>
                  <span className="rounded-full bg-[#F7F3E8] px-4 py-2 text-xs font-bold text-[#064B38]">
                    {campuses.length} {campuses.length === 1 ? "Campus" : "Campuses"}
                  </span>
                </div>

                {loadingPrograms ? (
                  <div className="mt-5 rounded-2xl bg-[#F7F3E8] p-7 text-center text-sm text-[#68766D]">
                    Loading campuses...
                  </div>
                ) : campuses.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-[#DED5C2] bg-[#F7F3E8] p-7 text-center">
                    <p className="font-bold text-[#064B38]">No campuses added yet</p>
                    <p className="mt-2 text-sm text-[#68766D]">
                      Add your first campus using the form above.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {campuses.map((campus) => (
                      <article
                        key={campus.id}
                        className="rounded-2xl border border-[#DED5C2] bg-white p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                              campus.is_active === false
                                ? "border-gray-200 bg-gray-100 text-gray-700"
                                : "border-[#9CC6A8] bg-[#E4F1E8] text-[#123D2B]"
                            }`}>
                              {campus.is_active === false ? "Inactive" : "Active"}
                            </span>
                            <h4 className="mt-3 text-lg font-black text-[#064B38]">
                              {campus.campus_name}
                            </h4>
                            <p className="mt-1 text-sm text-[#68766D]">
                              {[campus.city, campus.province].filter(Boolean).join(", ")}
                            </p>
                            {campus.address && (
                              <p className="mt-2 text-sm text-[#68766D]">{campus.address}</p>
                            )}
                            {campus.phone && (
                              <p className="mt-2 text-sm text-[#064B38]">Phone: {campus.phone}</p>
                            )}
                            {campus.email && (
                              <p className="mt-1 break-all text-sm text-[#064B38]">Email: {campus.email}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditCampus(campus)}
                              disabled={savingCampus}
                              className="rounded-lg border border-[#D6B45B] px-4 py-2 text-sm font-bold text-[#064B38] hover:bg-[#FFF4D6] disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleCampus(campus)}
                              disabled={savingCampus}
                              className="rounded-lg border border-[#064B38]/20 px-4 py-2 text-sm font-bold text-[#064B38] hover:bg-[#F7F3E8] disabled:opacity-50"
                            >
                              {campus.is_active === false ? "Activate" : "Deactivate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCampus(campus)}
                              disabled={savingCampus}
                              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <p className="mt-5 rounded-xl border border-[#E8C95B] bg-[#FFF4D6] p-4 text-xs leading-6 text-[#765707]">
                Safety note: If a campus is linked to programs or admission inquiries, deactivate it instead of deleting it so existing records remain protected.
              </p>
            </section>

            <section className="mt-7 rounded-3xl border border-[#DED5C2] bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#B18B20]">
                    Academic Management
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#064B38]">
                    Program Management
                  </h2>
                  <p className="mt-2 text-sm text-[#68766D]">
                    Add and manage school classes, courses and degree programs offered by this institution.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const token = localStorage.getItem("aliqo_education_token");
                    if (token && institution) {
                      loadProgramsAndCampuses(token, institution.id);
                    }
                  }}
                  disabled={loadingPrograms || savingProgram}
                  className="rounded-xl border border-[#D6B45B] px-5 py-3 text-sm font-bold text-[#064B38] transition hover:bg-[#FFF4D6] disabled:opacity-50"
                >
                  {loadingPrograms ? "Refreshing..." : "↻ Refresh Programs"}
                </button>
              </div>

              {programMessage && (
                <div className="mt-5 rounded-xl border border-[#E8C95B] bg-[#FFF4D6] p-4 text-sm leading-6 text-[#765707]">
                  {programMessage}
                </div>
              )}

              <form onSubmit={handleSaveProgram} className="mt-6 rounded-2xl border border-[#DED5C2] bg-[#F7F3E8] p-5">
                <h3 className="text-lg font-black text-[#064B38]">
                  {editingProgramId ? "Edit Program" : "Add New Program"}
                </h3>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">Program Type *</label>
                    <select
                      required
                      value={programDraft.program_type}
                      onChange={(e) => updateProgramDraft("program_type", e.target.value as ProgramDraft["program_type"])}
                      className={inputClass}
                    >
                      <option value="school_class">School Class</option>
                      <option value="course">Course</option>
                      <option value="degree">Degree</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">Program Name *</label>
                    <input
                      required
                      maxLength={200}
                      value={programDraft.program_name}
                      onChange={(e) => updateProgramDraft("program_name", e.target.value)}
                      placeholder="e.g. Grade 10, Web Development, BS Computer Science"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">Campus</label>
                    <select
                      value={programDraft.campus_id}
                      onChange={(e) => updateProgramDraft("campus_id", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Institution-wide / No specific campus</option>
                      {campuses
                        .filter(
                          (campus) =>
                            campus.is_active !== false ||
                            campus.id === programDraft.campus_id
                        )
                        .map((campus) => (
                          <option key={campus.id} value={campus.id}>
                            {campus.campus_name} — {campus.city}
                            {campus.is_active === false ? " (Inactive)" : ""}
                          </option>
                        ))}
                    </select>
                    {campuses.length === 0 && (
                      <p className="mt-2 text-xs text-[#68766D]">
                        No campuses found. You can still add an institution-wide program.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">Duration</label>
                    <input
                      maxLength={100}
                      value={programDraft.duration}
                      onChange={(e) => updateProgramDraft("duration", e.target.value)}
                      placeholder="e.g. 2 years"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">Minimum Fee (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={programDraft.fee_min}
                      onChange={(e) => updateProgramDraft("fee_min", e.target.value)}
                      placeholder="Optional"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">Maximum Fee (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={programDraft.fee_max}
                      onChange={(e) => updateProgramDraft("fee_max", e.target.value)}
                      placeholder="Optional"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">Eligibility</label>
                    <textarea
                      rows={2}
                      maxLength={2000}
                      value={programDraft.eligibility}
                      onChange={(e) => updateProgramDraft("eligibility", e.target.value)}
                      placeholder="Entry requirements or prerequisites"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-[#064B38]">Description</label>
                    <textarea
                      rows={3}
                      maxLength={5000}
                      value={programDraft.description}
                      onChange={(e) => updateProgramDraft("description", e.target.value)}
                      placeholder="Describe this class, course or degree"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                    <input
                      id="program-admission-open"
                      type="checkbox"
                      checked={programDraft.admission_open}
                      onChange={(e) => updateProgramDraft("admission_open", e.target.checked)}
                      className="h-4 w-4 accent-[#064B38]"
                    />
                    <label htmlFor="program-admission-open" className="text-sm font-semibold text-[#064B38]">
                      Admissions are currently open
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  {editingProgramId && (
                    <button
                      type="button"
                      onClick={resetProgramForm}
                      disabled={savingProgram}
                      className="rounded-xl border border-[#DED5C2] px-6 py-3 text-sm font-bold text-[#064B38] transition hover:bg-white disabled:opacity-50"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingProgram}
                    className="rounded-xl bg-[#064B38] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#0B6048] hover:text-[#E8C95B] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingProgram ? "Saving..." : editingProgramId ? "Save Program Changes →" : "Add Program →"}
                  </button>
                </div>
              </form>

              <div className="mt-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-black text-[#064B38]">Existing Programs</h3>
                  <span className="rounded-full bg-[#F7F3E8] px-4 py-2 text-xs font-bold text-[#064B38]">
                    {programs.length} {programs.length === 1 ? "Program" : "Programs"}
                  </span>
                </div>

                {loadingPrograms ? (
                  <div className="mt-5 rounded-2xl bg-[#F7F3E8] p-7 text-center text-sm text-[#68766D]">
                    Loading programs and campuses...
                  </div>
                ) : programs.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-[#DED5C2] bg-[#F7F3E8] p-7 text-center">
                    <p className="font-bold text-[#064B38]">No programs added yet</p>
                    <p className="mt-2 text-sm text-[#68766D]">
                      Add your first school class, course or degree using the form above.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {programs.map((program) => {
                      const campus = campuses.find((item) => item.id === program.campus_id);
                      const typeLabel =
                        program.program_type === "school_class"
                          ? "School Class"
                          : program.program_type === "degree"
                            ? "Degree"
                            : "Course";
                      return (
                        <article key={program.id} className="rounded-2xl border border-[#DED5C2] bg-white p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[#D6B45B] bg-[#FFF4D6] px-3 py-1 text-xs font-bold text-[#765707]">
                                  {typeLabel}
                                </span>
                                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${program.is_active ? "border-[#9CC6A8] bg-[#E4F1E8] text-[#123D2B]" : "border-gray-200 bg-gray-100 text-gray-700"}`}>
                                  {program.is_active ? "Active" : "Inactive"}
                                </span>
                                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${program.admission_open ? "border-[#9CC6A8] bg-[#E4F1E8] text-[#123D2B]" : "border-gray-200 bg-gray-100 text-gray-700"}`}>
                                  {program.admission_open ? "Admissions Open" : "Admissions Closed"}
                                </span>
                              </div>
                              <h4 className="mt-3 text-lg font-black text-[#064B38]">{program.program_name}</h4>
                              <p className="mt-1 text-sm text-[#68766D]">
                                {campus ? `${campus.campus_name} — ${campus.city}` : "Institution-wide"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditProgram(program)}
                                disabled={savingProgram}
                                className="rounded-lg border border-[#D6B45B] px-4 py-2 text-sm font-bold text-[#064B38] hover:bg-[#FFF4D6] disabled:opacity-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleProgram(program)}
                                disabled={savingProgram}
                                className="rounded-lg border border-[#064B38]/20 px-4 py-2 text-sm font-bold text-[#064B38] hover:bg-[#F7F3E8] disabled:opacity-50"
                              >
                                {program.is_active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProgram(program)}
                                disabled={savingProgram}
                                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {program.description && (
                            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#123D2B]">
                              {program.description}
                            </p>
                          )}
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                              ["Duration", program.duration || "Not specified"],
                              ["Minimum Fee", program.fee_min === null ? "Not specified" : `PKR ${Number(program.fee_min).toLocaleString("en-PK")}`],
                              ["Maximum Fee", program.fee_max === null ? "Not specified" : `PKR ${Number(program.fee_max).toLocaleString("en-PK")}`],
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-xl bg-[#F7F3E8] p-3">
                                <p className="text-xs font-bold uppercase text-[#68766D]">{label}</p>
                                <p className="mt-1 break-words text-sm font-semibold text-[#064B38]">{value}</p>
                              </div>
                            ))}
                          </div>
                          {program.eligibility && (
                            <p className="mt-3 text-sm text-[#68766D]">
                              <span className="font-bold text-[#064B38]">Eligibility: </span>
                              {program.eligibility}
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
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
  owner_notes: item.owner_notes || "",
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
                              Private Institution Notes
                            </label>

                            <textarea
                              rows={3}
                              maxLength={2000}
                              value={draft.owner_notes}
                              onChange={(e) =>
                                updateDraft(
                                  item.id,
                                  "owner_notes",
                                  e.target.value
                                )
                              }
                              placeholder="Write internal notes about this inquiry..."
                              className={inputClass}
                            />

                            <p className="mt-1 text-right text-xs text-[#68766D]">
                              {draft.owner_notes.length}/2000
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

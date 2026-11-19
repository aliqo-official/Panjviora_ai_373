
"use client";

import { useCallback, useEffect, useState } from "react";

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
  verification_status: "pending" | "approved" | "rejected";
  is_active: boolean;
  created_at?: string;
};

type Campus = {
  id: string;
  institution_id: string;
  campus_name: string;
  province?: string | null;
  city: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type Program = {
  id: string;
  institution_id: string;
  campus_id?: string | null;
  program_type: "school_class" | "course" | "degree";
  program_name: string;
  description?: string | null;
  eligibility?: string | null;
  fee_min?: number | null;
  fee_max?: number | null;
  duration?: string | null;
  admission_open: boolean;
  is_active: boolean;
  created_at?: string;
};

type ProfileForm = {
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

type CampusForm = {
  campus_name: string;
  province: string;
  city: string;
  address: string;
  phone: string;
  email: string;
};

type ProgramForm = {
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TOKEN_KEY = "aliqo_education_token";

const EMPTY_PROFILE: ProfileForm = {
  institution_name: "",
  institution_type: "",
  description: "",
  phone: "",
  whatsapp_number: "",
  website_url: "",
  country: "",
  province: "",
  city: "",
  address: "",
  logo_url: "",
  cover_image_url: "",
};

const EMPTY_CAMPUS: CampusForm = {
  campus_name: "",
  province: "",
  city: "",
  address: "",
  phone: "",
  email: "",
};

const EMPTY_PROGRAM: ProgramForm = {
  campus_id: "",
  program_type: "school_class",
  program_name: "",
  description: "",
  eligibility: "",
  fee_min: "",
  fee_max: "",
  duration: "",
  admission_open: false,
};

export default function EducationDashboardPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState("");
  const [profileForm, setProfileForm] =
    useState<ProfileForm>(EMPTY_PROFILE);
  const [savingProfile, setSavingProfile] = useState(false);

  const [campusInstitutionId, setCampusInstitutionId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusLoading, setCampusLoading] = useState(false);
  const [campusSaving, setCampusSaving] = useState(false);
  const [campusForm, setCampusForm] =
    useState<CampusForm>(EMPTY_CAMPUS);
  const [editingCampusId, setEditingCampusId] = useState("");

  const [programInstitutionId, setProgramInstitutionId] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programCampuses, setProgramCampuses] = useState<Campus[]>([]);
  const [programLoading, setProgramLoading] = useState(false);
  const [programSaving, setProgramSaving] = useState(false);
  const [programForm, setProgramForm] =
    useState<ProgramForm>(EMPTY_PROGRAM);
  const [editingProgramId, setEditingProgramId] = useState("");

  const loadInstitutions = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/education/institutions/my", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setInstitutions([]);
        setError("Your session has expired. Please login again.");
        return;
      }

      if (!response.ok || !Array.isArray(data?.institutions)) {
        throw new Error(data?.error || "Unable to load institutions.");
      }

      setInstitutions(data.institutions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load institutions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCampuses = useCallback(
    async (institutionId: string, accessToken: string) => {
      if (!institutionId || !accessToken) return;

      setCampusLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/education/campuses?institution_id=${encodeURIComponent(institutionId)}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setToken("");
          setInstitutions([]);
          throw new Error("Your session has expired. Please login again.");
        }

        if (!response.ok || !Array.isArray(data?.campuses)) {
          throw new Error(data?.error || "Unable to load campuses.");
        }

        setCampuses(data.campuses);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load campuses."
        );
      } finally {
        setCampusLoading(false);
      }
    },
    []
  );

  const loadPrograms = useCallback(
    async (institutionId: string, accessToken: string) => {
      if (!institutionId || !accessToken) return;

      setProgramLoading(true);
      setError("");

      try {
        const [programResponse, campusResponse] = await Promise.all([
          fetch(
            `/api/education/programs?institution_id=${encodeURIComponent(institutionId)}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              cache: "no-store",
            }
          ),
          fetch(
            `/api/education/campuses?institution_id=${encodeURIComponent(institutionId)}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              cache: "no-store",
            }
          ),
        ]);

        const programData = await programResponse.json();
        const campusData = await campusResponse.json();

        if (
          programResponse.status === 401 ||
          campusResponse.status === 401
        ) {
          localStorage.removeItem(TOKEN_KEY);
          setToken("");
          setInstitutions([]);
          throw new Error("Your session has expired. Please login again.");
        }

        if (!programResponse.ok || !Array.isArray(programData?.programs)) {
          throw new Error(
            programData?.error || "Unable to load programs."
          );
        }

        if (!campusResponse.ok || !Array.isArray(campusData?.campuses)) {
          throw new Error(
            campusData?.error || "Unable to load campuses."
          );
        }

        setPrograms(programData.programs);
        setProgramCampuses(campusData.campuses);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load programs."
        );
      } finally {
        setProgramLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);

    if (savedToken) {
      setToken(savedToken);
      loadInstitutions(savedToken).finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, [loadInstitutions]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error("Authentication configuration is missing.");
      }

      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
          },
          body: JSON.stringify({ email: email.trim(), password }),
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.access_token) {
        throw new Error(
          data?.msg || data?.message || "Invalid login details."
        );
      }

      localStorage.setItem(TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      setPassword("");
      setSuccess("Login successful.");

      await loadInstitutions(data.access_token);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setInstitutions([]);
    setEmail("");
    setPassword("");
    setError("");
    setSuccess("");

    setEditingId("");
    setProfileForm(EMPTY_PROFILE);

    setCampusInstitutionId("");
    setCampuses([]);
    setEditingCampusId("");
    setCampusForm(EMPTY_CAMPUS);

    setProgramInstitutionId("");
    setPrograms([]);
    setProgramCampuses([]);
    setEditingProgramId("");
    setProgramForm(EMPTY_PROGRAM);
  };

  const openProfileEditor = (institution: Institution) => {
    setError("");
    setSuccess("");
    setEditingId(institution.id);

    setProfileForm({
      institution_name: institution.institution_name || "",
      institution_type: institution.institution_type || "",
      description: institution.description || "",
      phone: institution.phone || "",
      whatsapp_number: institution.whatsapp_number || "",
      website_url: institution.website_url || "",
      country: institution.country || "",
      province: institution.province || "",
      city: institution.city || "",
      address: institution.address || "",
      logo_url: institution.logo_url || "",
      cover_image_url: institution.cover_image_url || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateProfileField = (
    field: keyof ProfileForm,
    value: string
  ) => {
    setProfileForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSaveProfile = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!editingId || !token) {
      setError("Please select an institution first.");
      return;
    }

    setSavingProfile(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/education/institutions/${encodeURIComponent(editingId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileForm),
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setInstitutions([]);
        setEditingId("");
        throw new Error("Your session has expired. Please login again.");
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Unable to update institution profile."
        );
      }

      setEditingId("");
      setProfileForm(EMPTY_PROFILE);
      await loadInstitutions(token);
      setSuccess("Institution profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Profile update failed."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const cancelProfileEdit = () => {
    setEditingId("");
    setProfileForm(EMPTY_PROFILE);
    setError("");
    setSuccess("");
  };

  const openCampusManager = async (institution: Institution) => {
    setCampusInstitutionId(institution.id);
    setCampuses([]);
    setCampusForm(EMPTY_CAMPUS);
    setEditingCampusId("");
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    await loadCampuses(institution.id, token);
  };

  const updateCampusField = (field: keyof CampusForm, value: string) => {
    setCampusForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetCampusForm = () => {
    setCampusForm(EMPTY_CAMPUS);
    setEditingCampusId("");
  };

  const startCampusEdit = (campus: Campus) => {
    setEditingCampusId(campus.id);
    setCampusForm({
      campus_name: campus.campus_name || "",
      province: campus.province || "",
      city: campus.city || "",
      address: campus.address || "",
      phone: campus.phone || "",
      email: campus.email || "",
    });

    setError("");
    setSuccess("");
  };

  const handleCampusSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!campusInstitutionId || !token) {
      setError("Please select an institution first.");
      return;
    }

    const isEditing = Boolean(editingCampusId);
    const expectedCampusName = campusForm.campus_name.trim();

    if (!expectedCampusName || !campusForm.city.trim()) {
      setError("Campus name and city are required.");
      return;
    }

    setCampusSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...campusForm,
        campus_name: expectedCampusName,
        city: campusForm.city.trim(),
        institution_id: campusInstitutionId,
        ...(isEditing ? { campus_id: editingCampusId } : {}),
      };

      const response = await fetch("/api/education/campuses", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        throw new Error("Your session has expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save campus.");
      }

      const savedCampus = data?.campus as Campus | undefined;

      if (!savedCampus?.id) {
        throw new Error(
          "The server did not return the saved campus. Please refresh and verify."
        );
      }

      if (
        savedCampus.institution_id !== campusInstitutionId ||
        savedCampus.campus_name !== expectedCampusName
      ) {
        throw new Error("Campus update could not be verified.");
      }

      setCampuses((previous) => {
        if (isEditing) {
          return previous.map((campus) =>
            campus.id === savedCampus.id ? savedCampus : campus
          );
        }

        return [savedCampus, ...previous];
      });

      resetCampusForm();

      setSuccess(
        isEditing
          ? "Campus updated and database record verified successfully."
          : "Campus added and database record verified successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save campus."
      );
    } finally {
      setCampusSaving(false);
    }
  };

  const toggleCampusStatus = async (campus: Campus) => {
    if (!campusInstitutionId || !token) return;

    const confirmed = window.confirm(
      campus.is_active
        ? "Are you sure you want to deactivate this campus?"
        : "Are you sure you want to activate this campus?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/education/campuses", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campus_id: campus.id,
          institution_id: campusInstitutionId,
          is_active: !campus.is_active,
        }),
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        throw new Error("Your session has expired. Please login again.");
      }

      if (!response.ok || !data?.campus?.id) {
        throw new Error(data?.error || "Unable to change campus status.");
      }

      if (data.campus.is_active !== !campus.is_active) {
        throw new Error("Campus status update could not be verified.");
      }

      await loadCampuses(campusInstitutionId, token);

      setSuccess(
        campus.is_active
          ? "Campus deactivated successfully."
          : "Campus activated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to change campus status."
      );
    }
  };

  const deleteCampus = async (campus: Campus) => {
    if (!campusInstitutionId || !token) return;

    const confirmed = window.confirm(
      `Permanently delete "${campus.campus_name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/education/campuses", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campus_id: campus.id,
          institution_id: campusInstitutionId,
        }),
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        throw new Error("Your session has expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Unable to delete campus.");
      }

      if (editingCampusId === campus.id) resetCampusForm();

      await loadCampuses(campusInstitutionId, token);
      setSuccess("Campus deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete campus."
      );
    }
  };

  const openProgramManager = async (institution: Institution) => {
    setProgramInstitutionId(institution.id);
    setPrograms([]);
    setProgramCampuses([]);
    setProgramForm(EMPTY_PROGRAM);
    setEditingProgramId("");
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
    await loadPrograms(institution.id, token);
  };

  const updateProgramField = <K extends keyof ProgramForm,>(
    field: K,
    value: ProgramForm[K]
  ) => {
    setProgramForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetProgramForm = () => {
    setProgramForm(EMPTY_PROGRAM);
    setEditingProgramId("");
  };

  const startProgramEdit = (program: Program) => {
    setEditingProgramId(program.id);

    setProgramForm({
      campus_id: program.campus_id || "",
      program_type: program.program_type,
      program_name: program.program_name || "",
      description: program.description || "",
      eligibility: program.eligibility || "",
      fee_min: program.fee_min != null ? String(program.fee_min) : "",
      fee_max: program.fee_max != null ? String(program.fee_max) : "",
      duration: program.duration || "",
      admission_open: program.admission_open === true,
    });

    setError("");
    setSuccess("");
  };

  const handleProgramSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!programInstitutionId || !token) {
      setError("Please select an institution first.");
      return;
    }

    const programName = programForm.program_name.trim();

    if (!programName) {
      setError("Program name is required.");
      return;
    }

    if (
      programForm.fee_min !== "" &&
      (!Number.isFinite(Number(programForm.fee_min)) ||
        Number(programForm.fee_min) < 0)
    ) {
      setError("Please enter a valid minimum fee.");
      return;
    }

    if (
      programForm.fee_max !== "" &&
      (!Number.isFinite(Number(programForm.fee_max)) ||
        Number(programForm.fee_max) < 0)
    ) {
      setError("Please enter a valid maximum fee.");
      return;
    }

    if (
      programForm.fee_min !== "" &&
      programForm.fee_max !== "" &&
      Number(programForm.fee_max) < Number(programForm.fee_min)
    ) {
      setError("Maximum fee cannot be less than minimum fee.");
      return;
    }

    setProgramSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = Boolean(editingProgramId);

      const payload = {
        institution_id: programInstitutionId,
        ...(isEditing ? { program_id: editingProgramId } : {}),
        campus_id: programForm.campus_id || null,
        program_type: programForm.program_type,
        program_name: programName,
        description: programForm.description,
        eligibility: programForm.eligibility,
        fee_min:
          programForm.fee_min === "" ? null : Number(programForm.fee_min),
        fee_max:
          programForm.fee_max === "" ? null : Number(programForm.fee_max),
        duration: programForm.duration,
        admission_open: programForm.admission_open,
      };

      const response = await fetch("/api/education/programs", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setInstitutions([]);
        throw new Error("Your session has expired. Please login again.");
      }

      if (!response.ok || !data?.program?.id) {
        throw new Error(data?.error || "Unable to save program.");
      }

      if (
        data.program.institution_id !== programInstitutionId ||
        data.program.program_name !== programName
      ) {
        throw new Error("Program save could not be verified.");
      }

      await loadPrograms(programInstitutionId, token);
      resetProgramForm();

      setSuccess(
        isEditing
          ? "Program updated and database record verified successfully."
          : "Program added and database record verified successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save program."
      );
    } finally {
      setProgramSaving(false);
    }
  };

  const toggleProgramStatus = async (program: Program) => {
    if (!programInstitutionId || !token) return;

    const nextStatus = !program.is_active;

    const confirmed = window.confirm(
      nextStatus
        ? `Activate "${program.program_name}"?`
        : `Deactivate "${program.program_name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/education/programs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          program_id: program.id,
          institution_id: programInstitutionId,
          is_active: nextStatus,
        }),
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setInstitutions([]);
        throw new Error("Your session has expired. Please login again.");
      }

      if (!response.ok || data?.program?.is_active !== nextStatus) {
        throw new Error(
          data?.error || "Program status update could not be verified."
        );
      }

      await loadPrograms(programInstitutionId, token);

      setSuccess(
        nextStatus
          ? "Program activated successfully."
          : "Program deactivated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update program status."
      );
    }
  };

  const deleteProgram = async (program: Program) => {
    if (!programInstitutionId || !token) return;

    const confirmed = window.confirm(
      `Permanently delete "${program.program_name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/education/programs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          program_id: program.id,
          institution_id: programInstitutionId,
        }),
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setInstitutions([]);
        throw new Error("Your session has expired. Please login again.");
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Unable to delete program.");
      }

      if (editingProgramId === program.id) {
        resetProgramForm();
      }

      await loadPrograms(programInstitutionId, token);
      setSuccess("Program deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete program."
      );
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "approved") return "bg-green-100 text-green-800";
    if (status === "rejected") return "bg-red-100 text-red-800";
    return "bg-amber-100 text-amber-800";
  };

  const inputClass =
    "w-full rounded-xl border border-[#e5dfcf] bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-[#D6B45B] focus:ring-2 focus:ring-[#D6B45B]/20";

  const labelClass = "mb-2 block text-sm font-bold text-[#064B38]";

  if (initializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8]">
        <p className="font-semibold text-[#064B38]">
          Loading Education Dashboard...
        </p>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8] px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-[#D6B45B]/40 bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#064B38] text-3xl text-[#D6B45B]">
              🎓
            </div>
            <h1 className="mt-5 text-3xl font-extrabold text-[#064B38]">
              Education Portal
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Login to manage your institution on ALIQO.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#064B38] px-5 py-3.5 font-bold text-white transition hover:bg-[#086148] disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Login to Dashboard"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            New institution?{" "}
            <a href="/education/register" className="font-bold text-[#064B38] underline">
              Register your institution
            </a>
          </p>

          <a href="/education" className="mt-5 block text-center text-sm font-semibold text-[#064B38]">
            ← Back to Education Directory
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3E8] text-gray-800">
      <header className="bg-[#064B38] px-5 py-5 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-[#D6B45B]">
              ALIQO EDUCATION
            </p>
            <h1 className="mt-1 text-2xl font-extrabold">Owner Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-[#D6B45B] px-5 py-2.5 font-bold text-[#D6B45B] transition hover:bg-[#D6B45B] hover:text-[#064B38]"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-[#064B38]">
              Welcome to Your Education Portal
            </h2>
            <p className="mt-2 text-gray-600">
              Manage your institution and educational information.
            </p>
          </div>
          <button
            onClick={() => loadInstitutions(token)}
            disabled={loading}
            className="rounded-xl bg-[#D6B45B] px-5 py-3 font-bold text-[#173C2E] hover:bg-[#e5c875] disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            {success}
          </div>
        )}

        {editingId && (
          <section className="mb-9 rounded-2xl border border-[#D6B45B]/50 bg-white p-6 shadow-md sm:p-8">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold tracking-widest text-[#9b792e]">
                  INSTITUTION MANAGEMENT
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#064B38]">
                  Edit Institution Profile
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Update your institution information and public profile details.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelProfileEdit}
                disabled={savingProfile}
                className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-7">
              <div>
                <h3 className="mb-4 border-b border-[#e8e1cf] pb-2 text-lg font-extrabold text-[#064B38]">
                  Basic Information
                </h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Institution Name *</label>
                    <input required maxLength={200} value={profileForm.institution_name} onChange={(e) => updateProfileField("institution_name", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Institution Type *</label>
                    <input required maxLength={60} value={profileForm.institution_type} onChange={(e) => updateProfileField("institution_type", e.target.value)} className={inputClass} placeholder="School, College, University, Academy..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Description</label>
                    <textarea rows={5} maxLength={3000} value={profileForm.description} onChange={(e) => updateProfileField("description", e.target.value)} className={inputClass} />
                    <p className="mt-1 text-right text-xs text-gray-400">{profileForm.description.length}/3000</p>
                  </div>
                  <div>
                    <label className={labelClass}>Registered Email (Read Only)</label>
                    <input value={institutions.find((item) => item.id === editingId)?.email || ""} readOnly className={`${inputClass} cursor-not-allowed bg-gray-100 text-gray-500`} />
                    <p className="mt-1 text-xs text-gray-400">Contact ALIQO support if this email needs correction.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 border-b border-[#e8e1cf] pb-2 text-lg font-extrabold text-[#064B38]">Contact Information</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Phone Number *</label>
                    <input required maxLength={30} value={profileForm.phone} onChange={(e) => updateProfileField("phone", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>WhatsApp Number</label>
                    <input maxLength={30} value={profileForm.whatsapp_number} onChange={(e) => updateProfileField("whatsapp_number", e.target.value)} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Website URL</label>
                    <input type="url" maxLength={2048} value={profileForm.website_url} onChange={(e) => updateProfileField("website_url", e.target.value)} className={inputClass} placeholder="https://example.com" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 border-b border-[#e8e1cf] pb-2 text-lg font-extrabold text-[#064B38]">Institution Location</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Country *</label>
                    <input required maxLength={100} value={profileForm.country} onChange={(e) => updateProfileField("country", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Province / State</label>
                    <input maxLength={100} value={profileForm.province} onChange={(e) => updateProfileField("province", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>City *</label>
                    <input required maxLength={100} value={profileForm.city} onChange={(e) => updateProfileField("city", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Full Address</label>
                    <textarea rows={2} maxLength={500} value={profileForm.address} onChange={(e) => updateProfileField("address", e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 border-b border-[#e8e1cf] pb-2 text-lg font-extrabold text-[#064B38]">Branding & Images</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Logo Image URL</label>
                    <input type="url" maxLength={2048} value={profileForm.logo_url} onChange={(e) => updateProfileField("logo_url", e.target.value)} className={inputClass} />
                    {profileForm.logo_url && <img src={profileForm.logo_url} alt="Institution logo preview" className="mt-3 h-20 w-20 rounded-xl border object-contain" />}
                  </div>
                  <div>
                    <label className={labelClass}>Cover Image URL</label>
                    <input type="url" maxLength={2048} value={profileForm.cover_image_url} onChange={(e) => updateProfileField("cover_image_url", e.target.value)} className={inputClass} />
                    {profileForm.cover_image_url && <img src={profileForm.cover_image_url} alt="Institution cover preview" className="mt-3 h-24 w-full rounded-xl border object-cover" />}
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500">Enter publicly accessible HTTP or HTTPS image URLs. Image upload and storage management can be added separately.</p>
              </div>

              <div className="rounded-xl border border-[#D6B45B]/40 bg-[#F7F3E8] p-4 text-sm text-[#064B38]">
                <strong>Important:</strong> Your registered email, owner account, approval status and admin controls are protected and cannot be changed through this form.
              </div>

              <div className="flex flex-wrap gap-3 border-t border-[#e8e1cf] pt-5">
                <button type="submit" disabled={savingProfile} className="rounded-xl bg-[#064B38] px-7 py-3 font-bold text-white hover:bg-[#086148] disabled:opacity-60">
                  {savingProfile ? "Saving Profile..." : "Save Changes"}
                </button>
                <button type="button" onClick={cancelProfileEdit} disabled={savingProfile} className="rounded-xl border border-gray-300 px-6 py-3 font-bold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {campusInstitutionId && (
          <section className="mb-9 rounded-2xl border border-[#D6B45B]/50 bg-white p-6 shadow-md sm:p-8">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold tracking-widest text-[#9b792e]">INSTITUTION MANAGEMENT</p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#064B38]">Campus Management</h2>
                <p className="mt-2 text-sm text-gray-500">Add and manage your institution campuses.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCampusInstitutionId("");
                  setCampuses([]);
                  resetCampusForm();
                  setError("");
                  setSuccess("");
                }}
                className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50"
              >
                Close Campus Manager
              </button>
            </div>

            <div className="mb-8 rounded-xl border border-[#D6B45B]/40 bg-[#F7F3E8] p-5">
              <h3 className="mb-4 text-lg font-extrabold text-[#064B38]">
                {editingCampusId ? "Edit Campus" : "Add New Campus"}
              </h3>

              <form onSubmit={handleCampusSubmit} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Campus Name *</label>
                  <input required maxLength={200} value={campusForm.campus_name} onChange={(e) => updateCampusField("campus_name", e.target.value)} className={inputClass} placeholder="Main Campus" />
                </div>
                <div>
                  <label className={labelClass}>City *</label>
                  <input required maxLength={100} value={campusForm.city} onChange={(e) => updateCampusField("city", e.target.value)} className={inputClass} placeholder="Karachi" />
                </div>
                <div>
                  <label className={labelClass}>Province / State</label>
                  <input maxLength={100} value={campusForm.province} onChange={(e) => updateCampusField("province", e.target.value)} className={inputClass} placeholder="Sindh" />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input maxLength={30} value={campusForm.phone} onChange={(e) => updateCampusField("phone", e.target.value)} className={inputClass} placeholder="+92..." />
                </div>
                <div>
                  <label className={labelClass}>Campus Email</label>
                  <input type="email" maxLength={254} value={campusForm.email} onChange={(e) => updateCampusField("email", e.target.value)} className={inputClass} placeholder="campus@example.com" />
                </div>
                <div>
                  <label className={labelClass}>Full Address</label>
                  <textarea rows={2} maxLength={500} value={campusForm.address} onChange={(e) => updateCampusField("address", e.target.value)} className={inputClass} />
                </div>
                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button type="submit" disabled={campusSaving} className="rounded-xl bg-[#064B38] px-6 py-3 font-bold text-white hover:bg-[#086148] disabled:opacity-60">
                    {campusSaving ? "Saving..." : editingCampusId ? "Update Campus" : "Add Campus"}
                  </button>
                  {editingCampusId && (
                    <button type="button" onClick={resetCampusForm} disabled={campusSaving} className="rounded-xl border border-gray-300 px-6 py-3 font-bold text-gray-600">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-extrabold text-[#064B38]">Your Campuses</h3>
                <button type="button" onClick={() => loadCampuses(campusInstitutionId, token)} disabled={campusLoading} className="rounded-lg bg-[#D6B45B] px-4 py-2 font-bold text-[#173C2E]">
                  {campusLoading ? "Loading..." : "Refresh Campuses"}
                </button>
              </div>

              {campusLoading ? (
                <p className="py-8 text-center text-gray-500">Loading campuses...</p>
              ) : campuses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D6B45B] p-8 text-center">
                  <p className="text-3xl">🏫</p>
                  <p className="mt-3 font-bold text-[#064B38]">No campuses added yet</p>
                  <p className="mt-1 text-sm text-gray-500">Use the form above to add your first campus.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {campuses.map((campus) => (
                    <article key={campus.id} className="rounded-xl border border-[#e8e1cf] bg-[#F7F3E8]/50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h4 className="text-lg font-extrabold text-[#064B38]">{campus.campus_name}</h4>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${campus.is_active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                          {campus.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <p>📍 {[campus.city, campus.province].filter(Boolean).join(", ")}</p>
                        {campus.address && <p>🏢 {campus.address}</p>}
                        {campus.phone && <p>📞 {campus.phone}</p>}
                        {campus.email && <p>✉️ {campus.email}</p>}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e8e1cf] pt-4">
                        <button type="button" onClick={() => startCampusEdit(campus)} className="rounded-lg border border-[#D6B45B] bg-white px-3 py-2 text-sm font-bold text-[#064B38]">Edit</button>
                        <button type="button" onClick={() => toggleCampusStatus(campus)} className="rounded-lg bg-[#D6B45B] px-3 py-2 text-sm font-bold text-[#173C2E]">{campus.is_active ? "Deactivate" : "Activate"}</button>
                        <button type="button" onClick={() => deleteCampus(campus)} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700">Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {programInstitutionId && (
          <section className="mb-9 rounded-2xl border border-[#D6B45B]/50 bg-white p-6 shadow-md sm:p-8">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold tracking-widest text-[#9b792e]">
                  INSTITUTION MANAGEMENT
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#064B38]">
                  Programs & Courses Management
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Manage school classes, professional courses and degree programs.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProgramInstitutionId("");
                  setPrograms([]);
                  setProgramCampuses([]);
                  resetProgramForm();
                  setError("");
                  setSuccess("");
                }}
                className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50"
              >
                Close Programs Manager
              </button>
            </div>

            <div className="mb-8 rounded-xl border border-[#D6B45B]/40 bg-[#F7F3E8] p-5">
              <h3 className="mb-4 text-lg font-extrabold text-[#064B38]">
                {editingProgramId ? "Edit Program" : "Add New Program"}
              </h3>

              <form onSubmit={handleProgramSubmit} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Program Type *</label>
                  <select
                    required
                    value={programForm.program_type}
                    onChange={(e) =>
                      updateProgramField(
                        "program_type",
                        e.target.value as ProgramForm["program_type"]
                      )
                    }
                    className={inputClass}
                  >
                    <option value="school_class">School Class</option>
                    <option value="course">Professional Course</option>
                    <option value="degree">Degree Program</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Program Name *</label>
                  <input
                    required
                    maxLength={200}
                    value={programForm.program_name}
                    onChange={(e) =>
                      updateProgramField("program_name", e.target.value)
                    }
                    className={inputClass}
                    placeholder="e.g. Class 9, Web Development, BS Computer Science"
                  />
                </div>

                <div>
                  <label className={labelClass}>Campus</label>
                  <select
                    value={programForm.campus_id}
                    onChange={(e) =>
                      updateProgramField("campus_id", e.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">All Campuses / Not Specified</option>
                    {programCampuses.map((campus) => (
                      <option
                        key={campus.id}
                        value={campus.id}
                        disabled={!campus.is_active}
                      >
                        {campus.campus_name}
                        {!campus.is_active ? " (Inactive)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Duration</label>
                  <input
                    maxLength={100}
                    value={programForm.duration}
                    onChange={(e) =>
                      updateProgramField("duration", e.target.value)
                    }
                    className={inputClass}
                    placeholder="e.g. 2 Years, 6 Months"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea
                    rows={3}
                    maxLength={5000}
                    value={programForm.description}
                    onChange={(e) =>
                      updateProgramField("description", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Describe this class, course or degree..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Eligibility Criteria</label>
                  <textarea
                    rows={2}
                    maxLength={2000}
                    value={programForm.eligibility}
                    onChange={(e) =>
                      updateProgramField("eligibility", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Required qualification or admission criteria..."
                  />
                </div>

                <div>
                  <label className={labelClass}>Minimum Fee</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={programForm.fee_min}
                    onChange={(e) =>
                      updateProgramField("fee_min", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Minimum fee"
                  />
                </div>

                <div>
                  <label className={labelClass}>Maximum Fee</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={programForm.fee_max}
                    onChange={(e) =>
                      updateProgramField("fee_max", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Maximum fee"
                  />
                </div>

                <div className="flex items-center gap-3 md:col-span-2">
                  <input
                    id="program-admission-open"
                    type="checkbox"
                    checked={programForm.admission_open}
                    onChange={(e) =>
                      updateProgramField("admission_open", e.target.checked)
                    }
                    className="h-5 w-5 accent-[#064B38]"
                  />
                  <label
                    htmlFor="program-admission-open"
                    className="font-semibold text-[#064B38]"
                  >
                    Admissions currently open
                  </label>
                </div>

                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button
                    type="submit"
                    disabled={programSaving}
                    className="rounded-xl bg-[#064B38] px-6 py-3 font-bold text-white hover:bg-[#086148] disabled:opacity-60"
                  >
                    {programSaving
                      ? "Saving..."
                      : editingProgramId
                        ? "Update Program"
                        : "Add Program"}
                  </button>

                  {editingProgramId && (
                    <button
                      type="button"
                      onClick={resetProgramForm}
                      disabled={programSaving}
                      className="rounded-xl border border-gray-300 px-6 py-3 font-bold text-gray-600"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-extrabold text-[#064B38]">
                  Your Programs & Courses
                </h3>

                <button
                  type="button"
                  onClick={() => loadPrograms(programInstitutionId, token)}
                  disabled={programLoading}
                  className="rounded-lg bg-[#D6B45B] px-4 py-2 font-bold text-[#173C2E]"
                >
                  {programLoading ? "Loading..." : "Refresh Programs"}
                </button>
              </div>

              {programLoading ? (
                <p className="py-8 text-center text-gray-500">
                  Loading programs...
                </p>
              ) : programs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D6B45B] p-8 text-center">
                  <p className="text-3xl">📚</p>
                  <p className="mt-3 font-bold text-[#064B38]">
                    No programs added yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Use the form above to add your first program or course.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {programs.map((program) => (
                    <article
                      key={program.id}
                      className="rounded-xl border border-[#e8e1cf] bg-[#F7F3E8]/50 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-extrabold text-[#064B38]">
                            {program.program_name}
                          </h4>
                          <p className="mt-1 text-sm font-semibold capitalize text-[#9b792e]">
                            {program.program_type.replace("_", " ")}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            program.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {program.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-sm text-gray-600">
                        {program.campus_id && (
                          <p>
                            🏫{" "}
                            {programCampuses.find(
                              (campus) => campus.id === program.campus_id
                            )?.campus_name || "Assigned Campus"}
                          </p>
                        )}
                        {program.duration && <p>⏳ {program.duration}</p>}
                        {program.description && <p>{program.description}</p>}
                        {program.eligibility && (
                          <p>📋 Eligibility: {program.eligibility}</p>
                        )}
                        {(program.fee_min != null ||
                          program.fee_max != null) && (
                          <p>
                            💰 Fee:{" "}
                            {program.fee_min != null
                              ? program.fee_min
                              : "Not specified"}
                            {" - "}
                            {program.fee_max != null
                              ? program.fee_max
                              : "Not specified"}
                          </p>
                        )}
                        <p>
                          {program.admission_open
                            ? "🟢 Admissions Open"
                            : "Admissions Closed"}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e8e1cf] pt-4">
                        <button
                          type="button"
                          onClick={() => startProgramEdit(program)}
                          className="rounded-lg border border-[#D6B45B] bg-white px-3 py-2 text-sm font-bold text-[#064B38]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleProgramStatus(program)}
                          className="rounded-lg bg-[#D6B45B] px-3 py-2 text-sm font-bold text-[#173C2E]"
                        >
                          {program.is_active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteProgram(program)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#D6B45B]/40 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">Total Institutions</p>
            <p className="mt-3 text-4xl font-extrabold text-[#064B38]">{institutions.length}</p>
          </div>
          <div className="rounded-2xl border border-[#D6B45B]/40 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">Approved Institutions</p>
            <p className="mt-3 text-4xl font-extrabold text-green-700">{institutions.filter((item) => item.verification_status === "approved").length}</p>
          </div>
          <div className="rounded-2xl border border-[#D6B45B]/40 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">Pending Review</p>
            <p className="mt-3 text-4xl font-extrabold text-amber-600">{institutions.filter((item) => item.verification_status === "pending").length}</p>
          </div>
        </div>

        <section className="mt-9 rounded-2xl border border-[#D6B45B]/40 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-[#064B38]">My Institutions</h2>
              <p className="mt-1 text-sm text-gray-500">Your institution registrations and approval status.</p>
            </div>
            <a href="/education/register" className="rounded-xl bg-[#064B38] px-5 py-3 font-bold text-white hover:bg-[#086148]">
              + Register Institution
            </a>
          </div>

          {loading && institutions.length === 0 ? (
            <p className="py-12 text-center text-gray-500">Loading institutions...</p>
          ) : institutions.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-5xl">🏫</div>
              <h3 className="mt-4 text-xl font-bold text-[#064B38]">No Institution Registered Yet</h3>
              <p className="mt-2 text-gray-500">Register your school, college, university or academy to get started.</p>
              <a href="/education/register" className="mt-6 inline-block rounded-xl bg-[#D6B45B] px-6 py-3 font-bold text-[#173C2E]">Register Now</a>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {institutions.map((institution) => (
                <article key={institution.id} className="rounded-2xl border border-[#e8e1cf] bg-[#F7F3E8]/40 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-extrabold text-[#064B38]">{institution.institution_name}</h3>
                      <p className="mt-1 text-sm font-semibold capitalize text-[#9b792e]">{institution.institution_type}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${getStatusStyle(institution.verification_status)}`}>
                      {institution.verification_status}
                    </span>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-gray-600">
                    <p>📍 {[institution.city, institution.province].filter(Boolean).join(", ") || "Location not added"}</p>
                    {institution.phone && <p>📞 {institution.phone}</p>}
                    {institution.email && <p>✉️ {institution.email}</p>}
                  </div>

                  <div className="mt-5 border-t border-[#e8e1cf] pt-4">
                    {institution.verification_status === "pending" && <p className="text-sm text-amber-700">Your registration is awaiting admin review.</p>}
                    {institution.verification_status === "rejected" && <p className="text-sm text-red-700">Your registration was not approved. Please contact ALIQO support.</p>}
                    {institution.verification_status === "approved" && institution.is_active && <p className="text-sm text-green-700">Your institution is approved and active in the directory.</p>}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={() => openProfileEditor(institution)} className="rounded-lg border border-[#D6B45B] bg-white px-4 py-2.5 text-sm font-bold text-[#064B38] hover:bg-[#D6B45B]/20">
                      Edit Profile
                    </button>
                    <button type="button" onClick={() => openCampusManager(institution)} className="rounded-lg border border-[#064B38] bg-white px-4 py-2.5 text-sm font-bold text-[#064B38] hover:bg-[#064B38]/10">
                      Manage Campuses
                    </button>
                    <button type="button" onClick={() => openProgramManager(institution)} className="rounded-lg border border-[#D6B45B] bg-white px-4 py-2.5 text-sm font-bold text-[#064B38] hover:bg-[#D6B45B]/20">
                      Manage Programs
                    </button>
                    {institution.verification_status === "approved" && institution.is_active && (
                      <a href={`/education/${encodeURIComponent(institution.id)}`} className="inline-flex rounded-lg bg-[#064B38] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#086148]">
                        View Public Profile →
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-10 text-center text-sm text-gray-500">
          ALIQO Education Portal · Dark Green · Golden · Light Cream
        </footer>
      </div>
    </main>
  );
}


"use client";

import { useCallback, useEffect, useState } from "react";

type Institution = {
  id: string;
  institution_name: string;
  institution_type: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  province?: string | null;
  verification_status: "pending" | "approved" | "rejected";
  is_active: boolean;
  created_at?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TOKEN_KEY = "aliqo_education_token";

export default function EducationDashboardPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInstitutions = useCallback(async (accessToken: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/education/institutions/my", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load your institutions.");
      }

      if (!Array.isArray(data?.institutions)) {
        throw new Error("Invalid server response.");
      }

      setInstitutions(data.institutions);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

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
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.access_token) {
        throw new Error(
          data?.msg || data?.message || "Invalid email or password."
        );
      }

      localStorage.setItem(TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      setPassword("");
      setSuccess("Login successful.");

      await loadInstitutions(data.access_token);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again."
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
  };

  const getStatusStyle = (status: string) => {
    if (status === "approved") {
      return "bg-green-100 text-green-800";
    }

    if (status === "rejected") {
      return "bg-red-100 text-red-800";
    }

    return "bg-amber-100 text-amber-800";
  };

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
              <label className="mb-2 block text-sm font-bold text-[#064B38]">
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#F7F3E8]/60 px-4 py-3 outline-none focus:border-[#D6B45B] focus:ring-2 focus:ring-[#D6B45B]/20"
                placeholder="Enter your email"
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
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#F7F3E8]/60 px-4 py-3 outline-none focus:border-[#D6B45B] focus:ring-2 focus:ring-[#D6B45B]/20"
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
              className="w-full rounded-xl bg-[#064B38] px-5 py-3.5 font-bold text-white transition hover:bg-[#086148] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Login to Dashboard"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            New institution?{" "}
            <a
              href="/education/register"
              className="font-bold text-[#064B38] underline"
            >
              Register your institution
            </a>
          </p>

          <a
            href="/education"
            className="mt-5 block text-center text-sm font-semibold text-[#064B38]"
          >
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
            <h1 className="mt-1 text-2xl font-extrabold">
              Owner Dashboard
            </h1>
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

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#D6B45B]/40 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">
              Total Institutions
            </p>
            <p className="mt-3 text-4xl font-extrabold text-[#064B38]">
              {institutions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D6B45B]/40 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">
              Approved Institutions
            </p>
            <p className="mt-3 text-4xl font-extrabold text-green-700">
              {institutions.filter((item) => item.verification_status === "approved").length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#D6B45B]/40 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">
              Pending Review
            </p>
            <p className="mt-3 text-4xl font-extrabold text-amber-600">
              {institutions.filter((item) => item.verification_status === "pending").length}
            </p>
          </div>
        </div>

        <section className="mt-9 rounded-2xl border border-[#D6B45B]/40 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-[#064B38]">
                My Institutions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your institution registrations and approval status.
              </p>
            </div>

            <a
              href="/education/register"
              className="rounded-xl bg-[#064B38] px-5 py-3 font-bold text-white transition hover:bg-[#086148]"
            >
              + Register Institution
            </a>
          </div>

          {loading && institutions.length === 0 ? (
            <p className="py-12 text-center text-gray-500">
              Loading institutions...
            </p>
          ) : institutions.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-5xl">🏫</div>
              <h3 className="mt-4 text-xl font-bold text-[#064B38]">
                No Institution Registered Yet
              </h3>
              <p className="mt-2 text-gray-500">
                Register your school, college, university or academy to get started.
              </p>
              <a
                href="/education/register"
                className="mt-6 inline-block rounded-xl bg-[#D6B45B] px-6 py-3 font-bold text-[#173C2E]"
              >
                Register Now
              </a>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {institutions.map((institution) => (
                <article
                  key={institution.id}
                  className="rounded-2xl border border-[#e8e1cf] bg-[#F7F3E8]/40 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-extrabold text-[#064B38]">
                        {institution.institution_name}
                      </h3>
                      <p className="mt-1 text-sm font-semibold capitalize text-[#9b792e]">
                        {institution.institution_type}
                      </p>
                    </div>

                    <span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${getStatusStyle(institution.verification_status)}`}>
                      {institution.verification_status}
                    </span>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-gray-600">
                    <p>
                      📍 {[institution.city, institution.province].filter(Boolean).join(", ") || "Location not added"}
                    </p>
                    {institution.phone && <p>📞 {institution.phone}</p>}
                    {institution.email && <p>✉️ {institution.email}</p>}
                  </div>

                  <div className="mt-5 border-t border-[#e8e1cf] pt-4">
                    {institution.verification_status === "pending" && (
                      <p className="text-sm text-amber-700">
                        Your registration is awaiting admin review.
                      </p>
                    )}

                    {institution.verification_status === "rejected" && (
                      <p className="text-sm text-red-700">
                        Your registration was not approved. Please contact ALIQO support.
                      </p>
                    )}

                    {institution.verification_status === "approved" && institution.is_active && (
                      <p className="text-sm text-green-700">
                        Your institution is approved and active in the directory.
                      </p>
                    )}
                  </div>

                  {institution.verification_status === "approved" && institution.is_active && (
                    <a
                      href={`/education/${encodeURIComponent(institution.id)}`}
                      className="mt-4 inline-flex rounded-lg bg-[#064B38] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#086148]"
                    >
                      View Public Profile →
                    </a>
                  )}
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

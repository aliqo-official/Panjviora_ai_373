
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function getRedirectPath() {
    const next = new URLSearchParams(window.location.search).get("next");

    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return next;
    }

    return "/hotels/register";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signupError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
          });

        if (signupError) {
          throw signupError;
        }

        if (data.session) {
          setSuccess("Account created successfully. Redirecting...");
          router.replace(getRedirectPath());
          router.refresh();
        } else {
          setSuccess(
            "Account created. Please check your email for the confirmation link, then log in."
          );
          setMode("login");
        }
      } else {
        const { data, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) {
          throw loginError;
        }

        if (!data.session) {
          throw new Error("Login session could not be created.");
        }

        setSuccess("Login successful. Redirecting...");
        router.replace(getRedirectPath());
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#DED5C2] bg-[#F5F0E6] px-4 py-3.5 text-[#123D2B] placeholder:text-[#68766D] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F0E6] px-4 py-12 text-[#123D2B]">
      {/* Background Decoration */}
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#123D2B]/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <a
            href="/"
            className="mb-6 inline-block text-3xl font-black tracking-wide text-[#123D2B]"
          >
            ALI<span className="text-[#B08B22]">QO</span>
          </a>

          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#D4AF37]/50 bg-[#123D2B] text-4xl shadow-lg">
            <span className="text-[#D4AF37]">👤</span>
          </div>

          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-[#B08B22]">
            ALIQO Account
          </p>

          <h1 className="text-3xl font-black text-[#123D2B]">
            {mode === "login" ? "Welcome Back" : "Create Your Account"}
          </h1>

          <p className="mt-3 text-sm text-[#68766D]">
            One account for your ALIQO services.
          </p>
        </div>

        {/* Authentication Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl border border-[#D4AF37]/40 bg-white p-6 shadow-xl sm:p-8"
        >
          {/* Login / Signup Toggle */}
          <div className="flex rounded-xl border border-[#DED5C2] bg-[#F5F0E6] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 rounded-lg py-3 text-sm font-bold transition ${
                mode === "login"
                  ? "bg-[#123D2B] text-white shadow-sm"
                  : "text-[#68766D] hover:text-[#123D2B]"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 rounded-lg py-3 text-sm font-bold transition ${
                mode === "signup"
                  ? "bg-[#123D2B] text-white shadow-sm"
                  : "text-[#68766D] hover:text-[#123D2B]"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#123D2B]">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={inputClass}
              autoComplete="email"
              maxLength={254}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#123D2B]">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={inputClass}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={6}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div
              role="status"
              className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm font-medium text-green-800"
            >
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-[#D4AF37] bg-[#123D2B] px-6 py-4 font-extrabold text-white shadow-md transition hover:bg-[#1B563C] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login to ALIQO"
                : "Create ALIQO Account"}
          </button>

          <p className="text-center text-xs leading-6 text-[#68766D]">
            Your ALIQO account can be used for customer and business services.
          </p>

          <div className="border-t border-[#DED5C2] pt-5 text-center">
            <a
              href="/"
              className="text-sm font-semibold text-[#1B563C] transition hover:text-[#B08B22]"
            >
              ← Back to ALIQO Home
            </a>
          </div>
        </form>

        <p className="mt-6 text-center text-xs font-medium text-[#68766D]">
          © 2026 ALIQO. All rights reserved.
        </p>
      </div>
    </main>
  );
}


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
    "w-full rounded-xl border border-[#b99743]/50 bg-[#071b13] px-4 py-3 text-white placeholder:text-gray-400 outline-none transition focus:border-[#e4c36a] focus:ring-2 focus:ring-[#d0aa45]/30";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#061810] px-4 py-12 text-white">
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#b58b35]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#1d7047]/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-[#d0aa45]/60 bg-[#103b29] text-4xl shadow-lg">
            👤
          </div>

          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-[#d0aa45]">
            ALIQO Account
          </p>

          <h1 className="text-3xl font-extrabold text-[#f4d77b]">
            {mode === "login" ? "Welcome Back" : "Create Your Account"}
          </h1>

          <p className="mt-3 text-sm text-gray-300">
            One account for your ALIQO services.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl border border-[#c9a646]/60 bg-[#0d2b1e] p-6 shadow-2xl md:p-8"
        >
          <div className="flex rounded-xl border border-[#c9a646]/40 bg-[#071b13] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className={`flex-1 rounded-lg py-3 text-sm font-bold ${
                mode === "login"
                  ? "bg-[#d0aa45] text-[#102116]"
                  : "text-gray-300"
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
              className={`flex-1 rounded-lg py-3 text-sm font-bold ${
                mode === "signup"
                  ? "bg-[#d0aa45] text-[#102116]"
                  : "text-gray-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#f4d77b]">
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

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#f4d77b]">
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

          {error && (
            <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-500/50 bg-green-950/40 p-4 text-sm text-green-300">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-[#f4d77b] bg-gradient-to-r from-[#b58b35] to-[#e0bd60] px-6 py-4 font-extrabold text-[#102116] shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login to ALIQO"
                : "Create ALIQO Account"}
          </button>

          <p className="text-center text-xs leading-5 text-gray-400">
            Your ALIQO account can be used for customer and business services.
          </p>
        </form>
      </div>
    </main>
  );
}

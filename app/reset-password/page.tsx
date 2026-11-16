
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Verifying your recovery link...");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyLink() {
      const params = new URLSearchParams(
        window.location.hash.substring(1)
      );

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const error = params.get("error_description");

      if (error) {
        if (active) {
          setMessage(error);
        }
        return;
      }

      if (!accessToken || !refreshToken) {
        if (active) {
          setMessage(
            "Invalid or expired recovery link. Please request a new email."
          );
        }
        return;
      }

      try {
        const { data, error: sessionError } =
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

        if (sessionError || !data.session) {
          throw new Error(
            sessionError?.message ||
              "Your recovery link is invalid or expired."
          );
        }

        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );

        if (active) {
          setReady(true);
          setMessage("Recovery link verified. Choose your new password.");
        }
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to verify recovery link."
          );
        }
      }
    }

    verifyLink();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(
          "Recovery session expired. Please request a new email."
        );
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.signOut();

      setReady(false);
      setPassword("");
      setConfirmPassword("");

      setMessage(
        "Password updated successfully! Please login using your new password."
      );

      window.setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Password update failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f2] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <Link href="/" className="text-3xl font-black text-emerald-900">
          ALIQO<span className="text-amber-500">.</span>
        </Link>

        <h1 className="mt-8 text-3xl font-black text-emerald-950">
          Reset Your Password
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Enter and confirm your new account password.
        </p>

        {message && (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            {message}
          </div>
        )}

        {ready && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border p-4 outline-none focus:border-emerald-700"
            />

            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border p-4 outline-none focus:border-emerald-700"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-900 py-4 font-bold text-white disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-7 block text-center text-sm font-semibold text-emerald-900"
        >
          Back to ALIQO Login
        </Link>
      </div>
    </main>
  );
}

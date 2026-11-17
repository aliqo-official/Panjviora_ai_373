
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [accessToken, setAccessToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Verifying your reset link...");
  const [loading, setLoading] = useState(false);
  const [validLink, setValidLink] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function verifyLink() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const token = params.get("access_token");
      const error = params.get("error_description");

      if (error) {
        setMessage(decodeURIComponent(error.replace(/\+/g, " ")));
        return;
      }

      if (!token) {
        setMessage(
          "Reset link is missing or expired. Please request a new password reset email."
        );
        return;
      }

      if (!supabaseUrl || !supabaseKey) {
        setMessage("Supabase configuration is missing.");
        return;
      }

      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setMessage("This reset link is invalid or expired. Request a new one.");
          return;
        }

        setAccessToken(token);
        setValidLink(true);
        setMessage("Please enter your new password below.");
      } catch {
        setMessage("Unable to verify the reset link. Please try again.");
      }
    }

    verifyLink();
  }, [supabaseUrl, supabaseKey]);

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey!,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.msg || "Password update failed.");
      }

      setMessage("Password updated successfully! Redirecting to seller login...");

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/seller/register");
      }, 2500);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F0E6] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#DED5C2] bg-white p-8 shadow-xl">
        <a href="/" className="mb-7 block text-center text-3xl font-black tracking-wide text-[#123D2B]">
          ALI<span className="text-[#D4AF37]">QO</span>
        </a>

        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F0E6] text-2xl text-[#A17C26]">
            🔐
          </div>

          <h1 className="text-2xl font-black text-[#123D2B]">
            Reset Your Password
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#68766D]">
            Create a new password to securely access your ALIQO seller account.
          </p>
        </div>

        <div
          role="status"
          className="mb-6 rounded-xl border border-[#D4AF37]/40 bg-[#F5F0E6] p-4 text-center text-sm font-medium leading-6 text-[#123D2B]"
        >
          {message}
        </div>

        {validLink && (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                New Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-[#DED5C2] bg-white p-4 text-[#123D2B] outline-none transition placeholder:text-[#68766D] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#123D2B]">
                Confirm New Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-[#DED5C2] bg-white p-4 text-[#123D2B] outline-none transition placeholder:text-[#68766D] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#123D2B] p-4 font-bold text-[#D4AF37] shadow-sm transition hover:bg-[#1B563C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-[#DED5C2] pt-5 text-center">
          <a
            href="/"
            className="text-sm font-bold text-[#8A6B1F] transition hover:text-[#123D2B]"
          >
            Back to ALIQO Home
          </a>

          <p className="mt-4 text-xs text-[#68766D]">
            ALIQO - Your Smart Discovery Platform
          </p>
        </div>
      </div>
    </main>
  );
}

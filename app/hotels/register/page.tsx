
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function HotelRegistrationPage() {
  const [form, setForm] = useState({
    hotel_name: "",
    owner_name: "",
    phone: "",
    whatsapp_number: "",
    city: "",
    address: "",
    description: "",
    website_url: "",
    image_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error("Unable to verify your login. Please login again.");
      }

      if (!session?.access_token) {
        throw new Error(
          "Please login to your ALIQO account before registering your hotel."
        );
      }

      const response = await fetch("/api/hotels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Hotel registration could not be submitted."
        );
      }

      setSuccess(
        data.message ||
          "Your hotel application has been submitted for admin approval."
      );

      setForm({
        hotel_name: "",
        owner_name: "",
        phone: "",
        whatsapp_number: "",
        city: "",
        address: "",
        description: "",
        website_url: "",
        image_url: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#b99743]/50 bg-[#071b13] px-4 py-3 text-white placeholder:text-gray-400 outline-none transition focus:border-[#e4c36a] focus:ring-2 focus:ring-[#d0aa45]/30";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061810] px-4 py-12 text-white">
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#b58b35]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#1d7047]/20 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-[#d0aa45]/60 bg-[#103b29] text-4xl shadow-lg shadow-black/30">
            🏨
          </div>

          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-[#d0aa45]">
            ALIQO Hospitality
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#f4d77b] md:text-4xl">
            Register Your Hotel
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-300 md:text-base">
            Join ALIQO and make your hotel discoverable to customers.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-[#c9a646]/60 bg-[#0d2b1e] p-5 shadow-2xl shadow-black/40 md:p-9"
        >
          <div>
            <div className="mb-5 border-b border-[#c9a646]/30 pb-4">
              <h2 className="text-xl font-bold text-[#f4d77b]">
                Hotel Information
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Enter your hotel details carefully.
              </p>
            </div>

            <div className="space-y-4">
              <input
                name="hotel_name"
                value={form.hotel_name}
                onChange={handleChange}
                placeholder="Hotel name *"
                className={inputClass}
                maxLength={150}
                required
              />

              <input
                name="owner_name"
                value={form.owner_name}
                onChange={handleChange}
                placeholder="Hotel owner name *"
                className={inputClass}
                maxLength={120}
                required
              />

              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Contact phone number *"
                className={inputClass}
                maxLength={30}
                required
              />

              <input
                name="whatsapp_number"
                type="tel"
                value={form.whatsapp_number}
                onChange={handleChange}
                placeholder="WhatsApp number (optional)"
                className={inputClass}
                maxLength={30}
              />

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City *"
                className={inputClass}
                maxLength={100}
                required
              />

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Complete hotel address *"
                className={inputClass}
                rows={3}
                maxLength={500}
                required
              />

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Hotel description and facilities (optional)"
                className={inputClass}
                rows={4}
                maxLength={3000}
              />

              <input
                name="website_url"
                type="url"
                value={form.website_url}
                onChange={handleChange}
                placeholder="Hotel website URL (optional)"
                className={inputClass}
              />

              <input
                name="image_url"
                type="url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="Hotel image URL (optional)"
                className={inputClass}
              />
            </div>
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

          <div className="rounded-xl border border-[#d0aa45]/50 bg-[#d0aa45]/10 p-4 text-sm leading-6 text-[#f4d77b]">
            <strong className="mb-1 block">Admin Approval Required</strong>
            Your hotel will remain pending until the ALIQO admin team reviews
            and approves your application.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-[#f4d77b] bg-gradient-to-r from-[#b58b35] to-[#e0bd60] px-6 py-4 font-extrabold text-[#102116] shadow-lg shadow-black/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Hotel Registration"}
          </button>

          <p className="text-center text-sm text-gray-300">
            Already have an ALIQO account?{" "}
            <Link
              href="/login?next=%2Fhotels%2Fregister"
              className="font-bold text-[#f4d77b] underline underline-offset-4 hover:text-white"
            >
              Login here
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400">
            ALIQO • Hotel Registration Portal
          </p>
        </form>
      </div>
    </main>
  );
}

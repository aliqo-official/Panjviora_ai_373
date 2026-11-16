
"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

      if (sessionError || !session?.access_token) {
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
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100";

  return (
    <main className="min-h-screen bg-[#F3F6F1] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">🏨</div>

          <h1 className="text-3xl font-bold text-[#173B2B]">
            Register Your Hotel
          </h1>

          <p className="mt-3 text-gray-600">
            Join ALIQO and make your hotel discoverable to customers.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8"
        >
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Hotel Information
            </h2>

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
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              {success}
            </div>
          )}

          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            Your hotel will remain pending until the ALIQO admin team reviews
            and approves your application.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#173B2B] px-6 py-4 font-bold text-white transition hover:bg-[#24543B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Hotel Registration"}
          </button>
        </form>
      </div>
    </main>
  );
}

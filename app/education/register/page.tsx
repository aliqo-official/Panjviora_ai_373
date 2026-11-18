
"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type RegistrationForm = {
  institution_name: string;
  institution_type: string;
  phone: string;
  whatsapp_number: string;
  website_url: string;
  country: string;
  province: string;
  city: string;
  address: string;
  description: string;
};

const initialForm: RegistrationForm = {
  institution_name: "",
  institution_type: "",
  phone: "",
  whatsapp_number: "",
  website_url: "",
  country: "Pakistan",
  province: "",
  city: "",
  address: "",
  description: "",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #d8d5c9",
  borderRadius: 9,
  background: "#ffffff",
  color: "#26352d",
  fontSize: 15,
  outlineColor: "#D6B45B",
  boxSizing: "border-box",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 7,
  color: "#064B38",
  fontWeight: 600,
  fontSize: 14,
};

export default function EducationRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [token, setToken] = useState("");
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("aliqo_education_token");

    if (savedToken) {
      setToken(savedToken);
    }

    setChecking(false);
  }, []);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Please login to your Education Dashboard first.");
      return;
    }

    if (
      !form.institution_name.trim() ||
      !form.institution_type.trim() ||
      !form.phone.trim() ||
      !form.country.trim() ||
      !form.city.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/education/institutions/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            institution_name: form.institution_name.trim(),
            institution_type: form.institution_type.trim(),
            phone: form.phone.trim(),
            whatsapp_number: form.whatsapp_number.trim(),
            website_url: form.website_url.trim(),
            country: form.country.trim(),
            province: form.province.trim(),
            city: form.city.trim(),
            address: form.address.trim(),
            description: form.description.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("aliqo_education_token");
          setToken("");
          throw new Error("Your session has expired. Please login again.");
        }

        throw new Error(
          data.error || data.message || "Institution registration failed."
        );
      }

      setSuccess(
        "Institution registered successfully. Your application is pending verification."
      );

      setForm(initialForm);

      window.setTimeout(() => {
        router.push("/education/dashboard");
      }, 1800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F7F3E8",
          display: "grid",
          placeItems: "center",
        }}
      >
        <p style={{ color: "#064B38" }}>Loading registration page...</p>
      </main>
    );
  }

  if (!token) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F7F3E8",
          display: "grid",
          placeItems: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            padding: 32,
            background: "#ffffff",
            borderRadius: 16,
            textAlign: "center",
            borderTop: "5px solid #D6B45B",
          }}
        >
          <h1 style={{ color: "#064B38" }}>Login Required</h1>
          <p style={{ color: "#58645d", lineHeight: 1.7 }}>
            Please login to your Education Dashboard before registering
            your institution.
          </p>
          <Link
            href="/education/dashboard"
            style={{
              display: "inline-block",
              background: "#064B38",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: 9,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Go to Dashboard Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F3E8",
        padding: "35px 16px 60px",
      }}
    >
      <div style={{ maxWidth: 850, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/education/dashboard"
            style={{
              color: "#064B38",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        <section
          style={{
            background: "#064B38",
            color: "#ffffff",
            padding: "30px 28px",
            borderRadius: "16px 16px 0 0",
            borderBottom: "5px solid #D6B45B",
          }}
        >
          <p
            style={{
              color: "#D6B45B",
              fontWeight: 700,
              letterSpacing: 1,
              margin: "0 0 8px",
            }}
          >
            ALIQO EDUCATION
          </p>
          <h1 style={{ margin: "0 0 10px", fontSize: 28 }}>
            Register Your Institution
          </h1>
          <p style={{ margin: 0, color: "#e6eee9", lineHeight: 1.6 }}>
            Add your school, college, university or academy to the ALIQO
            Education Directory.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#ffffff",
            padding: 28,
            borderRadius: "0 0 16px 16px",
            boxShadow: "0 8px 30px rgba(6,75,56,0.07)",
          }}
        >
          <h2 style={{ color: "#064B38", fontSize: 19, marginTop: 0 }}>
            Institution Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 18,
            }}
          >
            <div>
              <label style={labelStyle}>Institution Name *</label>
              <input
                style={inputStyle}
                name="institution_name"
                value={form.institution_name}
                onChange={handleChange}
                placeholder="Enter institution name"
                maxLength={180}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Institution Type *</label>
              <select
                style={inputStyle}
                name="institution_type"
                value={form.institution_type}
                onChange={handleChange}
                required
              >
               <option value="">Select institution type</option>
<option value="school">School</option>
<option value="college">College</option>
<option value="university">University</option>
<option value="academy">Academy</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input
                style={inputStyle}
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+92 300 1234567"
                maxLength={30}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>WhatsApp Number</label>
              <input
                style={inputStyle}
                name="whatsapp_number"
                value={form.whatsapp_number}
                onChange={handleChange}
                placeholder="+92 300 1234567"
                maxLength={30}
              />
            </div>

            <div>
              <label style={labelStyle}>Website URL</label>
              <input
                style={inputStyle}
                type="url"
                name="website_url"
                value={form.website_url}
                onChange={handleChange}
                placeholder="https://example.com"
                maxLength={500}
              />
            </div>

            <div>
              <label style={labelStyle}>Country *</label>
              <input
                style={inputStyle}
                name="country"
                value={form.country}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Province / State</label>
              <input
                style={inputStyle}
                name="province"
                value={form.province}
                onChange={handleChange}
                placeholder="e.g. Sindh"
                maxLength={100}
              />
            </div>

            <div>
              <label style={labelStyle}>City *</label>
              <input
                style={inputStyle}
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Enter city"
                maxLength={100}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Complete Address</label>
            <textarea
              style={{ ...inputStyle, minHeight: 85, resize: "vertical" }}
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter institution address"
              maxLength={500}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Institution Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell students about your institution, facilities and educational services..."
              maxLength={3000}
            />
          </div>

          <div
            style={{
              marginTop: 22,
              padding: 15,
              background: "#F7F3E8",
              borderLeft: "4px solid #D6B45B",
              borderRadius: 8,
              color: "#47574e",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "#064B38" }}>Verification Notice:</strong>
            <br />
            Your institution will initially be submitted as pending.
            It will appear in the public Education Directory after
            ALIQO admin verification and approval.
          </div>

          {error && (
            <p
              role="alert"
              style={{
                color: "#a12626",
                background: "#fff0f0",
                padding: 12,
                borderRadius: 8,
                marginTop: 20,
              }}
            >
              {error}
            </p>
          )}

          {success && (
            <p
              role="status"
              style={{
                color: "#064B38",
                background: "#edf6ef",
                padding: 12,
                borderRadius: 8,
                marginTop: 20,
              }}
            >
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              marginTop: 24,
              padding: "15px 20px",
              background: submitting ? "#668477" : "#064B38",
              color: "#ffffff",
              border: "2px solid #D6B45B",
              borderRadius: 9,
              fontSize: 16,
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting
              ? "Submitting..."
              : "Submit Institution for Verification"}
          </button>
        </form>
      </div>
    </main>
  );
}

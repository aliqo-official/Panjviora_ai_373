
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Request = {
  id?: number | string;
  business_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  advertising_details?: string;
  created_at?: string;
  status?: string;
};

type StatusFilter = "All" | "Pending" | "Approved" | "Rejected";

function normalizeStatus(status?: string): StatusFilter {
  const value = (status || "pending").toLowerCase();

  if (value === "approved") return "Approved";
  if (value === "rejected") return "Rejected";
  return "Pending";
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [selected, setSelected] = useState<Request | null>(null);

  async function loadRequests() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/requests", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        setAuthenticated(false);
        setRequests([]);

        if (response.status !== 401) {
          throw new Error("Could not load advertising requests.");
        }
        return;
      }

      const data = await response.json();

      setRequests(data);
      setAuthenticated(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load requests."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      setPassword("");
      await loadRequests();
    } catch (err) {

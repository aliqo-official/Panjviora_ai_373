
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
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    item: Request,
    newStatus: "Approved" | "Rejected"
  ) {
    if (item.id == null) {
      setError("This request has no ID.");
      return;
    }

    setUpdatingId(item.id);
    setError("");

    try {
      const response = await fetch("/api/admin/requests", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          status: newStatus.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Status update failed.");
      }

      if (!data || data.length === 0) {
        throw new Error("No request was updated.");
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === item.id
            ? { ...request, status: newStatus }
            : request
        )
      );

      if (selected?.id === item.id) {
        setSelected({ ...selected, status: newStatus });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteRequest(item: Request) {
    if (item.id == null) {
      setError("This request has no ID.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this request?")) {
      return;
    }

    setDeletingId(item.id);
    setError("");

    try {
      const response = await fetch("/api/admin/requests", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed.");
      }

      if (!data || data.length === 0) {
        throw new Error("No request was deleted.");
      }

      setRequests((current) =>
        current.filter((request) => request.id !== item.id)
      );

      if (selected?.id === item.id) setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      setAuthenticated(false);
      setRequests([]);
      setEmail("");
      setPassword("");
      setSearch("");
      setFilter("All");
      setSelected(null);
      setError("");
    }
  }

  function statusStyle(status?: string) {
    const value = normalizeStatus(status);

    if (value === "Approved") {
      return "border border-green-200 bg-green-50 text-green-800";
    }

    if (value === "Rejected") {
      return "border border-red-200 bg-red-50 text-red-700";
    }

    return "border border-[#D4AF37]/40 bg-[#F5F0E6] text-[#8A681B]";
  }

  const pendingCount = requests.filter(
    (item) => normalizeStatus(item.status) === "Pending"
  ).length;

  const approvedCount = requests.filter(
    (item) => normalizeStatus(item.status) === "Approved"
  ).length;

  const rejectedCount = requests.filter(
    (item) => normalizeStatus(item.status) === "Rejected"
  ).length;

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((item) => {
      const matchesSearch = [
        item.business_name,
        item.contact_name,
        item.email,
        item.phone,
        item.advertising_details,
      ].some((value) => (value || "").toLowerCase().includes(query));

      const matchesStatus =
        filter === "All" || normalizeStatus(item.status) === filter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, filter]);

  return (
    <main className="min-h-screen bg-[#F5F0E6] px-4 py-10 text-[#123D2B] sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-10 rounded-3xl border border-[#D4AF37]/30 bg-[#123D2B] px-6 py-9 text-center shadow-xl sm:py-11">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E8C95B] bg-gradient-to-br from-[#E8C95B] to-[#B68A25] text-3xl font-black text-[#123D2B] shadow-lg">
            A
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white">
            ALI<span className="text-[#E8C95B]">QO</span>{" "}
            <span className="text-[#E8C95B]">Admin</span>
          </h1>

          <p className="mt-3 text-sm text-[#E1E8DF] sm:text-base">
            Professional Advertising Management Dashboard
          </p>

          <div className="mx-auto mt-5 h-1 w-24 rounded-full bg-[#D4AF37]" />
        </header>

        {!authenticated ? (
          <form
            onSubmit={handleLogin}
            className="mx-auto max-w-md space-y-5 rounded-3xl border border-[#DED5C2] bg-white p-8 shadow-xl"
          >
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F0E6] text-2xl text-[#123D2B]">
                <span>♙</span>
              </div>

              <h2 className="text-2xl font-black text-[#123D2B]">
                Admin Login
              </h2>

              <p className="mt-2 text-sm text-[#68766D]">
                Sign in to manage ALIQO advertising requests.
              </p>
            </div>

            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin Email"
              autoComplete="username"
              className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none placeholder:text-[#89958C] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />

            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none placeholder:text-[#89958C] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />

            {error && (
              <p className="break-words rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C95B] p-3 font-bold text-[#123D2B] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Secure Admin Login"}
            </button>
          </form>
        ) : (
          <section>

            {/* Statistics */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Total Requests",
                  count: requests.length,
                  icon: "▤",
                },
                {
                  label: "Pending",
                  count: pendingCount,
                  icon: "◷",
                },
                {
                  label: "Approved",
                  count: approvedCount,
                  icon: "✓",
                },
                {
                  label: "Rejected",
                  count: rejectedCount,
                  icon: "×",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#68766D]">
                      {stat.label}
                    </p>

                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F0E6] text-xl font-bold text-[#A17C26]">
                      {stat.icon}
                    </span>
                  </div>

                  <p className="mt-3 text-3xl font-black text-[#123D2B]">
                    {stat.count}
                  </p>

                  <div className="mt-4 h-1 w-full rounded-full bg-[#F5F0E6]">
                    <div className="h-1 w-1/3 rounded-full bg-[#D4AF37]" />
                  </div>
                </div>
              ))}
            </div>

            {/* Dashboard Actions */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DED5C2] bg-white p-5 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-[#123D2B]">
                  Advertising Requests
                </h2>

                <p className="mt-1 text-sm text-[#68766D]">
                  Review and manage business advertising applications.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin/deals"
                  className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E8C95B] px-4 py-2.5 font-bold text-[#123D2B] shadow-sm transition hover:brightness-105"
                >
                  Manage Deals →
                </Link>

                <Link
                  href="/admin/sellers"
                  className="rounded-xl bg-[#123D2B] px-4 py-2.5 font-bold text-white transition hover:bg-[#1B563C]"
                >
                  Manage Sellers →
                </Link>

                <button
                  type="button"
                  onClick={loadRequests}
                  disabled={loading}
                  className="rounded-xl border border-[#D4AF37]/60 bg-white px-4 py-2.5 font-semibold text-[#123D2B] transition hover:bg-[#F5F0E6] disabled:opacity-50"
                >
                  {loading ? "Loading..." : "↻ Refresh"}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Logout
                </button>
              </div>
            </div>

            {error && (
              <p className="mb-5 break-words rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                ⚠ {error}
              </p>
            )}

            {/* Search and Filter */}
            <div className="mb-6 grid gap-3 rounded-2xl border border-[#DED5C2] bg-white p-4 shadow-sm sm:grid-cols-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search business, name, email or phone..."
                className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none placeholder:text-[#89958C] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as StatusFilter)}
                className="w-full rounded-xl border border-[#DED5C2] bg-[#FDFBF7] p-3 text-[#123D2B] outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              >
                <option value="All">All Requests</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <p className="mb-4 text-sm font-medium text-[#68766D]">
              Showing {filteredRequests.length} of {requests.length} requests
            </p>

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
              <div className="rounded-2xl border border-[#DED5C2] bg-white p-10 text-center shadow-sm">
                <div className="mb-4 text-4xl text-[#B58B2B]">▤</div>

                <h3 className="font-bold text-[#123D2B]">
                  No matching requests
                </h3>

                <p className="mt-2 text-sm text-[#68766D]">
                  No matching advertising requests found.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredRequests.map((item, index) => {
                  const status = normalizeStatus(item.status);

                  return (
                    <article
                      key={item.id ?? index}
                      className="rounded-2xl border border-[#DED5C2] bg-white p-6 shadow-sm transition hover:border-[#D4AF37] hover:shadow-lg sm:p-7"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-xl font-black text-[#123D2B]">
                          {item.business_name || "Business"}
                        </h3>

                        <span
                          className={`rounded-full px-4 py-2 text-sm font-bold ${statusStyle(status)}`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm text-[#123D2B] sm:grid-cols-2">
                        <p>
                          <span className="font-semibold text-[#68766D]">
                            Contact:
                          </span>{" "}
                          {item.contact_name || "—"}
                        </p>

                        <p>
                          <span className="font-semibold text-[#68766D]">
                            Email:
                          </span>{" "}
                          {item.email || "—"}
                        </p>

                        <p>
                          <span className="font-semibold text-[#68766D]">
                            Phone:
                          </span>{" "}
                          {item.phone || "—"}
                        </p>
                      </div>

                      <div className="mt-5 rounded-xl border border-[#DED5C2] bg-[#F5F0E6] p-4">
                        <p className="mb-2 font-bold text-[#8A681B]">
                          Advertising Details
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-7 text-[#536457]">
                          {item.advertising_details || "—"}
                        </p>
                      </div>

                      {item.created_at && (
                        <p className="mt-4 text-xs text-[#68766D]">
                          Submitted:{" "}
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="rounded-xl border border-[#D4AF37]/50 bg-[#F5F0E6] px-4 py-2 font-semibold text-[#123D2B] transition hover:bg-[#EAE0CA]"
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(item, "Approved")}
                          disabled={
                            updatingId === item.id || status === "Approved"
                          }
                          className="rounded-xl bg-[#123D2B] px-4 py-2 font-semibold text-white transition hover:bg-[#1B563C] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {updatingId === item.id ? "Updating..." : "✓ Approve"}
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(item, "Rejected")}
                          disabled={
                            updatingId === item.id || status === "Rejected"
                          }
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteRequest(item)}
                          disabled={deletingId === item.id}
                          className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deletingId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Request Details Modal */}
            {selected && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123D2B]/70 p-4 backdrop-blur-sm">
                <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#D4AF37]/50 bg-white p-6 text-[#123D2B] shadow-2xl">
                  <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#DED5C2] pb-4">
                    <h2 className="text-xl font-black text-[#123D2B]">
                      Request Details
                    </h2>

                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="rounded-xl bg-[#123D2B] px-4 py-2 font-semibold text-white transition hover:bg-[#1B563C]"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-4 text-sm">
                    <p>
                      <strong className="text-[#8A681B]">Business:</strong>{" "}
                      {selected.business_name || "—"}
                    </p>

                    <p>
                      <strong className="text-[#8A681B]">Contact:</strong>{" "}
                      {selected.contact_name || "—"}
                    </p>

                    <p>
                      <strong className="text-[#8A681B]">Email:</strong>{" "}
                      {selected.email || "—"}
                    </p>

                    <p>
                      <strong className="text-[#8A681B]">Phone:</strong>{" "}
                      {selected.phone || "—"}
                    </p>

                    <p>
                      <strong className="text-[#8A681B]">Status:</strong>{" "}
                      {normalizeStatus(selected.status)}
                    </p>

                    <div className="rounded-xl bg-[#F5F0E6] p-4">
                      <strong className="text-[#8A681B]">
                        Advertising Details:
                      </strong>

                      <p className="mt-2 whitespace-pre-wrap leading-7 text-[#536457]">
                        {selected.advertising_details || "—"}
                      </p>
                    </div>

                    {selected.created_at && (
                      <p>
                        <strong className="text-[#8A681B]">Submitted:</strong>{" "}
                        {new Date(selected.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </section>
        )}
      </div>
    </main>
  );
}

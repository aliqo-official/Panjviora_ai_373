
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const REQUEST_TIMEOUT_MS = 15000;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_TOKEN_LENGTH = 8192;
const ADMIN_EMAIL = "aliqo37311011@gmail.com";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_STATUSES = [
  "new",
  "contacted",
  "in_review",
  "accepted",
  "rejected",
  "closed",
] as const;

type InquiryStatus = (typeof ALLOWED_STATUSES)[number];

const INQUIRY_FIELDS =
  "id,institution_id,campus_id,program_id,campus_name,program_name,student_user_id,student_name,student_email,student_phone,message,status,admin_private_notes,created_at,updated_at";

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isConfigured() {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      SUPABASE_SERVICE_ROLE_KEY
  );
}

function clean(value: unknown, max = 1000): string {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function verifyAdmin(request: NextRequest) {
  if (!isConfigured()) return false;

  const token = request.cookies.get("aliqo_admin_session")?.value;

  if (
    !token ||
    token.length > MAX_TOKEN_LENGTH ||
    /\s/.test(token)
  ) {
    return false;
  }

  try {
    const result = await fetch(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    if (!result.ok) return false;

    const user: unknown = await result.json();

    return (
      isObject(user) &&
      typeof user.email === "string" &&
      user.email.toLowerCase() === ADMIN_EMAIL
    );
  } catch (error) {
    console.error("Admin verification error:", error);
    return false;
  }
}

async function readBody(
  request: NextRequest
): Promise<Record<string, unknown> | null> {
  const contentType =
    request.headers.get("content-type") || "";

  if (
    !/^application\/json(?:\s*;|$)/i.test(
      contentType.trim()
    )
  ) {
    return null;
  }

  const contentLength =
    request.headers.get("content-length");

  if (
    contentLength &&
    (!/^\d+$/.test(contentLength) ||
      Number(contentLength) > MAX_BODY_BYTES)
  ) {
    return null;
  }

  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalBytes += value.byteLength;

      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }

      chunks.push(value);
    }

    const bodyBytes = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      bodyBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const raw = new TextDecoder("utf-8", {
      fatal: true,
    }).decode(bodyBytes);

    const parsed: unknown = JSON.parse(raw);

    return isObject(parsed) ? parsed : null;
  } catch {
    try {
      await reader.cancel();
    } catch {
      // Ignore cancellation errors.
    }

    return null;
  } finally {
    reader.releaseLock();
  }
}

async function adminDbRequest(
  path: string,
  options: RequestInit = {}
) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function getDatabaseError(result: Response) {
  const raw = await result.text();

  try {
    const parsed: unknown = JSON.parse(raw);

    if (isObject(parsed)) {
      return {
        status: result.status,
        code:
          typeof parsed.code === "string"
            ? parsed.code.slice(0, 50)
            : "UNKNOWN",
        message:
          typeof parsed.message === "string"
            ? parsed.message.slice(0, 300)
            : "Database request failed.",
      };
    }
  } catch {
    // Ignore invalid JSON error responses.
  }

  return {
    status: result.status,
    code: "UNKNOWN",
    message: "Supabase returned an unreadable error response.",
  };
}

// GET: Admin can view admission inquiries across institutions.
export async function GET(request: NextRequest) {
  try {
    if (!isConfigured()) {
      console.error(
        "Admin Education API configuration is incomplete."
      );

      return response(
        { error: "Server configuration error." },
        500
      );
    }

    if (!(await verifyAdmin(request))) {
      return response({ error: "Unauthorized." }, 401);
    }

    const params = request.nextUrl.searchParams;

    const institutionId = clean(
      params.get("institution_id"),
      36
    );

    const campusId = clean(
      params.get("campus_id"),
      36
    );

    const programId = clean(
      params.get("program_id"),
      36
    );

    if (
      (institutionId && !UUID_REGEX.test(institutionId)) ||
      (campusId && !UUID_REGEX.test(campusId)) ||
      (programId && !UUID_REGEX.test(programId))
    ) {
      return response(
        { error: "Invalid filter ID." },
        400
      );
    }

    const query = new URLSearchParams({
      select: INQUIRY_FIELDS,
      order: "created_at.desc",
      limit: "1000",
    });

    if (institutionId) {
      query.set("institution_id", `eq.${institutionId}`);
    }

    if (campusId) {
      query.set("campus_id", `eq.${campusId}`);
    }

    if (programId) {
      query.set("program_id", `eq.${programId}`);
    }

    const [inquiryResult, institutionResult] =
      await Promise.all([
        adminDbRequest(
          `institution_inquiries?${query.toString()}`
        ),
        adminDbRequest(
          "institutions?select=id,institution_name,institution_type,verification_status&order=institution_name.asc"
        ),
      ]);

    if (!inquiryResult.ok || !institutionResult.ok) {
      const diagnostics: Record<string, unknown> = {};

      if (!inquiryResult.ok) {
        diagnostics.institution_inquiries =
          await getDatabaseError(inquiryResult);
      }

      if (!institutionResult.ok) {
        diagnostics.institutions =
          await getDatabaseError(institutionResult);
      }

      console.error(
        "Admin Education inquiry GET database failure:",
        diagnostics
      );

      return response(
        { error: "Unable to load Education data." },
        502
      );
    }

    const [inquiries, institutions] = await Promise.all([
      inquiryResult.json(),
      institutionResult.json(),
    ]);

    if (
      !Array.isArray(inquiries) ||
      !Array.isArray(institutions)
    ) {
      console.error(
        "Admin Education API received invalid database response."
      );

      return response(
        { error: "Invalid database response." },
        502
      );
    }

    const inquiriesWithNames = inquiries.map(
      (inquiry: {
        program_id: string | null;
        program_name: string | null;
        [key: string]: unknown;
      }) => ({
        ...inquiry,
        program_name:
          inquiry.program_name ||
          (inquiry.program_id
            ? null
            : "General Inquiry"),
      })
    );

    return response({
      inquiries: inquiriesWithNames,
      institutions,
      filters: {
        institution_id: institutionId || null,
        campus_id: campusId || null,
        program_id: programId || null,
      },
    });
  } catch (error) {
    console.error(
      "Admin education inquiry GET error:",
      error
    );

    return response(
      { error: "Unable to load inquiries." },
      500
    );
  }
}

// PATCH: Admin updates inquiry status and separate private Admin notes.
export async function PATCH(request: NextRequest) {
  try {
    if (!isConfigured()) {
      return response(
        { error: "Server configuration error." },
        500
      );
    }

    if (!(await verifyAdmin(request))) {
      return response({ error: "Unauthorized." }, 401);
    }

    const body = await readBody(request);

    if (!body) {
      return response(
        { error: "Invalid JSON request." },
        400
      );
    }

    const allowedKeys = [
      "inquiry_id",
      "status",
      "admin_private_notes",
    ];

    if (
      Object.keys(body).some(
        (key) => !allowedKeys.includes(key)
      )
    ) {
      return response(
        { error: "Unsupported request fields." },
        400
      );
    }

    const inquiryId = clean(body.inquiry_id, 36);

    if (!UUID_REGEX.test(inquiryId)) {
      return response(
        { error: "Valid inquiry_id is required." },
        400
      );
    }

    const hasStatus =
      Object.prototype.hasOwnProperty.call(
        body,
        "status"
      );

    const hasNotes =
      Object.prototype.hasOwnProperty.call(
        body,
        "admin_private_notes"
      );

    if (!hasStatus && !hasNotes) {
      return response(
        { error: "No update fields provided." },
        400
      );
    }

    const updates: Record<string, unknown> = {};

    if (hasStatus) {
      if (
        typeof body.status !== "string" ||
        !ALLOWED_STATUSES.includes(
          body.status as InquiryStatus
        )
      ) {
        return response(
          { error: "Invalid inquiry status." },
          400
        );
      }

      updates.status = body.status;
    }

    if (hasNotes) {
      if (
        body.admin_private_notes !== null &&
        typeof body.admin_private_notes !== "string"
      ) {
        return response(
          { error: "Admin notes must be text or null." },
          400
        );
      }

      if (
        typeof body.admin_private_notes === "string" &&
        body.admin_private_notes.length > 2000
      ) {
        return response(
          {
            error:
              "Admin notes cannot exceed 2000 characters.",
          },
          400
        );
      }

      updates.admin_private_notes =
        typeof body.admin_private_notes === "string"
          ? body.admin_private_notes.trim() || null
          : null;
    }

    updates.updated_at = new Date().toISOString();

    const query = new URLSearchParams({
      id: `eq.${inquiryId}`,
      select: INQUIRY_FIELDS,
    });

    const result = await adminDbRequest(
      `institution_inquiries?${query.toString()}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      }
    );

    if (!result.ok) {
      const diagnostic = await getDatabaseError(result);

      console.error(
        "Admin inquiry PATCH database failure:",
        diagnostic
      );

      return response(
        { error: "Unable to update inquiry." },
        502
      );
    }

    const updated = await result.json();

    if (!Array.isArray(updated) || updated.length === 0) {
      return response(
        { error: "Inquiry not found." },
        404
      );
    }

    return response({
      message: "Admission inquiry updated successfully.",
      inquiry: updated[0],
    });
  } catch (error) {
    console.error(
      "Admin education inquiry PATCH error:",
      error
    );

    return response(
      { error: "Unable to update inquiry." },
      500
    );
  }
}

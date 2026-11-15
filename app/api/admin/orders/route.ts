
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "aliqo37311011@gmail.com";

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof ALLOWED_STATUSES)[number];

type SupabaseError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(data: unknown, fallback: string) {
  if (!isRecord(data)) return fallback;

  return (
    (typeof data.message === "string" && data.message) ||
    (typeof data.details === "string" && data.details) ||
    (typeof data.hint === "string" && data.hint) ||
    fallback
  );
}

function getErrorCode(data: unknown) {
  if (!isRecord(data)) return null;

  return typeof data.code === "string" ? data.code : null;
}

async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get("aliqo_admin_session")?.value;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!token || !url || !anonKey) {
    return null;
  }

  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const user: unknown = await response.json();

    if (
      !isRecord(user) ||
      typeof user.email !== "string" ||
      user.email.toLowerCase() !== ADMIN_EMAIL
    ) {
      return null;
    }

    return {
      url,
      secretKey: secretKey || "",
    };
  } catch {
    return null;
  }
}

function isSameOrigin(request: NextRequest) {
  return request.headers.get("origin") === request.nextUrl.origin;
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    ALLOWED_STATUSES.includes(value as OrderStatus)
  );
}

async function supabaseRequest(
  url: string,
  secretKey: string,
  options: RequestInit = {}
) {
  return fetch(url, {
    ...options,
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      ...options.headers,
    },
    cache: "no-store",
  });
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!admin.secretKey) {
    return NextResponse.json(
      { error: "SUPABASE_SECRET_KEY is missing." },
      { status: 500 }
    );
  }

  try {
    const response = await supabaseRequest(
      `${admin.url}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc`,
      admin.secretKey
    );

    const data: unknown = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: getErrorMessage(
            data,
            "Supabase database request failed."
          ),
          code: getErrorCode(data),
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Orders server request failed." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const admin = await verifyAdmin(request);

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!admin.secretKey) {
    return NextResponse.json(
      { error: "SUPABASE_SECRET_KEY is missing." },
      { status: 500 }
    );
  }

  try {
    const body: unknown = await request.json();

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { id, status, reason } = body;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
      typeof id !== "string" ||
      !uuidRegex.test(id) ||
      !isOrderStatus(status)
    ) {
      return NextResponse.json(
        { error: "Invalid order ID or status." },
        { status: 400 }
      );
    }

    // Cancellation uses the secure database RPC.
    if (status === "cancelled") {
      if (
        reason !== undefined &&
        reason !== null &&
        (typeof reason !== "string" || reason.length > 500)
      ) {
        return NextResponse.json(
          { error: "Invalid cancellation reason." },
          { status: 400 }
        );
      }

      const response = await supabaseRequest(
        `${admin.url}/rest/v1/rpc/admin_cancel_order`,
        admin.secretKey,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            p_order_id: id,
            p_reason:
              typeof reason === "string" && reason.trim()
                ? reason.trim()
                : null,
          }),
        }
      );

      const responseText = await response.text();

      let data: unknown = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        return NextResponse.json(
          {
            error: getErrorMessage(
              data,
              "Order cancellation failed."
            ),
            code: getErrorCode(data),
          },
          { status: response.status }
        );
      }

      if (!isRecord(data) || data.success !== true) {
        return NextResponse.json(
          { error: "Cancellation was not confirmed." },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    }

    // Read the current order status before allowing a transition.
    const currentResponse = await supabaseRequest(
      `${admin.url}/rest/v1/orders?id=eq.${encodeURIComponent(
        id
      )}&select=id,status`,
      admin.secretKey
    );

    const currentData: unknown = await currentResponse.json();

    if (!currentResponse.ok) {
      return NextResponse.json(
        {
          error: getErrorMessage(
            currentData,
            "Could not verify current order status."
          ),
          code: getErrorCode(currentData),
        },
        { status: currentResponse.status }
      );
    }

    if (
      !Array.isArray(currentData) ||
      currentData.length === 0 ||
      !isRecord(currentData[0]) ||
      typeof currentData[0].status !== "string"
    ) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const currentStatus = currentData[0].status;

    // Only forward status transitions are allowed.
    const allowedTransitions: Record<string, OrderStatus[]> = {
      pending: ["confirmed"],
      confirmed: ["shipped"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    const nextStatuses = allowedTransitions[currentStatus];

    if (!nextStatuses || !nextStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status transition: ${currentStatus} to ${status}.`,
        },
        { status: 409 }
      );
    }

    // Include the old status in the filter to protect against
    // concurrent updates between the read and the update.
    const updateResponse = await supabaseRequest(
      `${admin.url}/rest/v1/orders?id=eq.${encodeURIComponent(
        id
      )}&status=eq.${encodeURIComponent(currentStatus)}`,
      admin.secretKey,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ status }),
      }
    );

    const updateData: unknown = await updateResponse.json();

    if (!updateResponse.ok) {
      return NextResponse.json(
        {
          error: getErrorMessage(updateData, "Order update failed."),
          code: getErrorCode(updateData),
        },
        { status: updateResponse.status }
      );
    }

    if (!Array.isArray(updateData) || updateData.length === 0) {
      return NextResponse.json(
        {
          error: "Order status changed or order was not found. Refresh orders.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(updateData);
  } catch {
    return NextResponse.json(
      { error: "Order update failed." },
      { status: 400 }
    );
  }
}


import {
  connection,
  NextRequest,
  NextResponse,
} from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

const ALLOWED_TYPES = [
  "school",
  "college",
  "university",
  "academy",
];

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function sanitizeFilter(value: string) {
  return value
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  maximum: number
) {
  if (value === null) return fallback;

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 1
  ) {
    return null;
  }

  return Math.min(parsed, maximum);
}

async function publicQuery(
  path: string,
  extraHeaders: Record<string, string> = {}
) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return fetch(
    `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${path}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        ...extraHeaders,
      },
      cache: "no-store",
    }
  );
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error(
      "Invalid response received from Supabase."
    );
  }
}

function getTotalCount(
  response: Response,
  fallback: number
) {
  const contentRange =
    response.headers.get("content-range");

  const match = contentRange?.match(/\/(\d+|\*)$/);

  if (!match || match[1] === "*") {
    return fallback;
  }

  const total = Number(match[1]);

  return Number.isSafeInteger(total) && total >= 0
    ? total
    : fallback;
}

export async function GET(request: NextRequest) {
  await connection();

  try {
    const params = request.nextUrl.searchParams;

    const institutionId =
      params.get("id")?.trim() || "";

    const type = params.get("type")?.trim() || "";

    const cityInput =
      params.get("city")?.trim() || "";

    const provinceInput =
      params.get("province")?.trim() || "";

    const searchInput =
      params.get("search")?.trim() || "";

    const city = sanitizeFilter(cityInput);
    const province = sanitizeFilter(provinceInput);
    const search = sanitizeFilter(searchInput);

    // Validate institution ID.
    if (institutionId && !validUuid(institutionId)) {
      return json(
        { error: "Invalid institution ID." },
        400
      );
    }

    // Validate institution type.
    if (type && !ALLOWED_TYPES.includes(type)) {
      return json(
        { error: "Invalid institution type." },
        400
      );
    }

    // Validate filter lengths.
    if (
      cityInput.length > 100 ||
      provinceInput.length > 100 ||
      searchInput.length > 100
    ) {
      return json(
        { error: "Search filter is too long." },
        400
      );
    }

    // ==========================================
    // INDIVIDUAL INSTITUTION DETAILS
    // ==========================================

    if (institutionId) {
      const institutionResult = await publicQuery(
        `institutions?id=eq.${encodeURIComponent(
          institutionId
        )}&verification_status=eq.approved&is_active=eq.true&select=id,institution_name,institution_type,description,email,phone,whatsapp_number,website_url,country,province,city,address,logo_url,cover_image_url,created_at`
      );

      if (!institutionResult.ok) {
        return json(
          { error: "Unable to load institution." },
          institutionResult.status
        );
      }

      const institutions =
        await readJson(institutionResult);

      if (
        !Array.isArray(institutions) ||
        institutions.length === 0
      ) {
        return json(
          { error: "Institution not found." },
          404
        );
      }

      const institution = institutions[0];

      const [
        campusResult,
        programResult,
      ] = await Promise.all([
        publicQuery(
          `institution_campuses?institution_id=eq.${encodeURIComponent(
            institutionId
          )}&is_active=eq.true&select=id,institution_id,campus_name,province,city,address,phone,email&order=campus_name.asc`
        ),

        publicQuery(
          `institution_programs?institution_id=eq.${encodeURIComponent(
            institutionId
          )}&is_active=eq.true&select=id,institution_id,campus_id,program_type,program_name,description,eligibility,fee_min,fee_max,duration,admission_open&order=program_name.asc`
        ),
      ]);

      if (
        !campusResult.ok ||
        !programResult.ok
      ) {
        console.error(
          "Education details query failed:",
          {
            campusStatus: campusResult.status,
            programStatus: programResult.status,
          }
        );

        return json(
          {
            error:
              "Unable to load institution details.",
          },
          500
        );
      }

      const [
        campuses,
        programs,
      ] = await Promise.all([
        readJson(campusResult),
        readJson(programResult),
      ]);

      if (
        !Array.isArray(campuses) ||
        !Array.isArray(programs)
      ) {
        return json(
          {
            error:
              "Invalid institution details response.",
          },
          500
        );
      }

      // Format program fee ranges.
      const formattedPrograms = programs.map(
        (program) => {
          const feeMin = program.fee_min;
          const feeMax = program.fee_max;

          let fee: string | number | null = null;

          if (
            feeMin !== null &&
            feeMin !== undefined &&
            feeMax !== null &&
            feeMax !== undefined
          ) {
            fee =
              String(feeMin) === String(feeMax)
                ? feeMin
                : `${feeMin} - ${feeMax}`;
          } else if (
            feeMin !== null &&
            feeMin !== undefined
          ) {
            fee = feeMin;
          } else if (
            feeMax !== null &&
            feeMax !== undefined
          ) {
            fee = feeMax;
          }

          return {
            ...program,
            degree_level:
              program.program_type ?? null,
            fee,
          };
        }
      );

      return json({
        institution,
        campuses,
        programs: formattedPrograms,
      });
    }

    // ==========================================
    // PUBLIC DIRECTORY WITH PAGINATION
    // ==========================================

    const page = parsePositiveInteger(
      params.get("page"),
      1,
      100000
    );

    const perPage = parsePositiveInteger(
      params.get("per_page"),
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

    if (page === null || perPage === null) {
      return json(
        { error: "Invalid pagination parameters." },
        400
      );
    }

    const offset = (page - 1) * perPage;

    if (!Number.isSafeInteger(offset)) {
      return json(
        { error: "Invalid pagination parameters." },
        400
      );
    }

    const end = offset + perPage - 1;

    const filters = [
      "select=id,institution_name,institution_type,description,phone,whatsapp_number,website_url,country,province,city,address,logo_url,cover_image_url,created_at",
      "verification_status=eq.approved",
      "is_active=eq.true",
    ];

    if (type) {
      filters.push(
        `institution_type=eq.${encodeURIComponent(type)}`
      );
    }

    if (city) {
      filters.push(
        `city=ilike.${encodeURIComponent(
          `*${city}*`
        )}`
      );
    }

    if (province) {
      filters.push(
        `province=ilike.${encodeURIComponent(
          `*${province}*`
        )}`
      );
    }

    if (search) {
      const searchPattern =
        encodeURIComponent(`*${search}*`);

      filters.push(
        `or=(institution_name.ilike.${searchPattern},city.ilike.${searchPattern},province.ilike.${searchPattern})`
      );
    }

    filters.push("order=created_at.desc");

    const result = await publicQuery(
      `institutions?${filters.join("&")}`,
      {
        Prefer: "count=exact",
        Range: `${offset}-${end}`,
        "Range-Unit": "items",
      }
    );

    if (!result.ok) {
      console.error(
        "Education directory query failed:",
        result.status
      );

      return json(
        {
          error:
            "Unable to load education directory.",
        },
        result.status
      );
    }

    const data = await readJson(result);

    if (!Array.isArray(data)) {
      return json(
        {
          error:
            "Invalid education directory response.",
        },
        500
      );
    }

    const total = getTotalCount(
      result,
      data.length
    );

    const totalPages = Math.ceil(
      total / perPage
    );

    return json({
      institutions: data,
      count: total,
      total,
      page,
      perPage,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (error) {
    console.error(
      "Education directory error:",
      error
    );

    return json(
      {
        error:
          "Unable to connect to education directory.",
      },
      500
    );
  }
}

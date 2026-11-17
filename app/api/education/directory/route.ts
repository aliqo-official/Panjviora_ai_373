
import { connection, NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

// Remove PostgREST filter syntax characters from user input.
function sanitizeFilter(value: string) {
  return value
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function publicQuery(path: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase environment variables are missing.");
  }

  return fetch(
    `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${path}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error("Invalid response received from Supabase.");
  }
}

// GET:
// /api/education/directory
// /api/education/directory?type=school
// /api/education/directory?city=Karachi
// /api/education/directory?search=school
// /api/education/directory?id=INSTITUTION_UUID

export async function GET(request: NextRequest) {
  // This API depends on URL query parameters.
  // connection() makes it execute at request time instead of
  // attempting to prerender it during the production build.
  await connection();

  try {
    const params = request.nextUrl.searchParams;

    const institutionId = params.get("id")?.trim() || "";
    const type = params.get("type")?.trim() || "";
    const cityInput = params.get("city")?.trim() || "";
    const searchInput = params.get("search")?.trim() || "";

    const city = sanitizeFilter(cityInput);
    const search = sanitizeFilter(searchInput);

    const allowedTypes = [
      "school",
      "college",
      "university",
      "academy",
    ];

    if (institutionId && !validUuid(institutionId)) {
      return json({ error: "Invalid institution ID." }, 400);
    }

    if (type && !allowedTypes.includes(type)) {
      return json({ error: "Invalid institution type." }, 400);
    }

    if (cityInput.length > 100 || searchInput.length > 100) {
      return json({ error: "Search filter is too long." }, 400);
    }

    // Individual institution details.
    if (institutionId) {
      const institutionResult = await publicQuery(
        `institutions?id=eq.${encodeURIComponent(institutionId)}&verification_status=eq.approved&is_active=eq.true&select=id,institution_name,institution_type,description,email,phone,whatsapp_number,website_url,country,province,city,address,logo_url,cover_image_url,created_at`
      );

      if (!institutionResult.ok) {
        return json(
          { error: "Unable to load institution." },
          institutionResult.status
        );
      }

      const institutions = await readJson(institutionResult);

      if (!Array.isArray(institutions) || institutions.length === 0) {
        return json({ error: "Institution not found." }, 404);
      }

      const institution = institutions[0];

      const [campusResult, programResult] = await Promise.all([
        publicQuery(
          `institution_campuses?institution_id=eq.${encodeURIComponent(institutionId)}&is_active=eq.true&select=id,institution_id,campus_name,province,city,address,phone,email&order=created_at.asc`
        ),
        publicQuery(
          `institution_programs?institution_id=eq.${encodeURIComponent(institutionId)}&is_active=eq.true&select=id,institution_id,campus_id,program_type,program_name,description,eligibility,fee_min,fee_max,duration,admission_open&order=created_at.asc`
        ),
      ]);

      if (!campusResult.ok || !programResult.ok) {
        return json(
          { error: "Unable to load institution details." },
          500
        );
      }

      const [campuses, programs] = await Promise.all([
        readJson(campusResult),
        readJson(programResult),
      ]);

      if (!Array.isArray(campuses) || !Array.isArray(programs)) {
        return json(
          { error: "Invalid institution details response." },
          500
        );
      }

      // Adapt database fee fields to the public details page.
      const formattedPrograms = programs.map((program) => {
        const feeMin = program.fee_min;
        const feeMax = program.fee_max;

        let fee: string | number | null = null;

        if (feeMin !== null && feeMin !== undefined &&
            feeMax !== null && feeMax !== undefined) {
          fee = String(feeMin) === String(feeMax)
            ? feeMin
            : `${feeMin} - ${feeMax}`;
        } else if (feeMin !== null && feeMin !== undefined) {
          fee = feeMin;
        } else if (feeMax !== null && feeMax !== undefined) {
          fee = feeMax;
        }

        return {
          ...program,
          degree_level: program.program_type ?? null,
          fee,
        };
      });

      return json({
        institution,
        campuses,
        programs: formattedPrograms,
      });
    }

    // Public institution directory.
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
        `city=ilike.${encodeURIComponent(`*${city}*`)}`
      );
    }

    if (search) {
      const searchPattern = encodeURIComponent(`*${search}*`);

      filters.push(
        `or=(institution_name.ilike.${searchPattern},city.ilike.${searchPattern})`
      );
    }

    filters.push("order=created_at.desc");

    const result = await publicQuery(
      `institutions?${filters.join("&")}`
    );

    if (!result.ok) {
      return json(
        { error: "Unable to load education directory." },
        result.status
      );
    }

    const data = await readJson(result);

    if (!Array.isArray(data)) {
      return json(
        { error: "Invalid education directory response." },
        500
      );
    }

    return json({
      institutions: data,
      count: data.length,
    });
  } catch (error) {
    console.error("Education directory error:", error);

    return json(
      { error: "Unable to connect to education directory." },
      500
    );
  }
}

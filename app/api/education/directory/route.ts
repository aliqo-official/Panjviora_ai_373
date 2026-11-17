
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function publicQuery(path: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase environment variables are missing.");
  }

  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    cache: "no-store",
  });
}

// GET:
// /api/education/directory
// /api/education/directory?type=school
// /api/education/directory?city=Karachi
// /api/education/directory?id=INSTITUTION_UUID
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const institutionId = params.get("id")?.trim() || "";
    const type = params.get("type")?.trim() || "";
    const city = params.get("city")?.trim() || "";
    const search = params.get("search")?.trim() || "";

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

    if (city.length > 100 || search.length > 100) {
      return json({ error: "Search filter is too long." }, 400);
    }

    // Individual institution detail.
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

      const institutions = await institutionResult.json();

      if (!institutions.length) {
        return json({ error: "Institution not found." }, 404);
      }

      const institution = institutions[0];

      const [campusResult, programResult] = await Promise.all([
        publicQuery(
          `institution_campuses?institution_id=eq.${institutionId}&is_active=eq.true&select=id,institution_id,campus_name,province,city,address,phone,email&order=created_at.asc`
        ),
        publicQuery(
          `institution_programs?institution_id=eq.${institutionId}&is_active=eq.true&select=id,institution_id,campus_id,program_type,program_name,description,eligibility,fee_min,fee_max,duration,admission_open&order=created_at.asc`
        ),
      ]);

      if (!campusResult.ok || !programResult.ok) {
        return json(
          { error: "Unable to load institution details." },
          500
        );
      }

      const [campuses, programs] = await Promise.all([
        campusResult.json(),
        programResult.json(),
      ]);

      return json({
        institution,
        campuses,
        programs,
      });
    }

    // Public institution directory.
    const filters = [
      "select=id,institution_name,institution_type,description,phone,whatsapp_number,website_url,country,province,city,address,logo_url,cover_image_url,created_at",
      "verification_status=eq.approved",
      "is_active=eq.true",
    ];

    if (type) {
      filters.push(`institution_type=eq.${encodeURIComponent(type)}`);
    }

    if (city) {
      filters.push(`city=ilike.${encodeURIComponent(`*${city}*`)}`);
    }

    if (search) {
      const safeSearch = search.replace(/[(),]/g, " ").trim();

      if (safeSearch) {
        filters.push(
          `or=(institution_name.ilike.${encodeURIComponent(`*${safeSearch}*`)},city.ilike.${encodeURIComponent(`*${safeSearch}*`)})`
        );
      }
    }

    filters.push("order=created_at.desc");

    const result = await publicQuery(
      `institutions?${filters.join("&")}`
    );

    const data = await result.json();

    if (!result.ok) {
      return json(
        { error: "Unable to load education directory." },
        result.status
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

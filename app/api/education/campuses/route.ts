
// DELETE: Prevent deletion when programs or inquiries are linked to the campus.
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Please login with a valid account" },
        { status: 401 }
      );
    }

    const parsed = await readBody(request);

    if (!parsed.body) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 400 }
      );
    }

    const campusId = parsed.body.campus_id;
    const institutionId = parsed.body.institution_id;

    if (
      typeof campusId !== "string" ||
      !uuidPattern.test(campusId.trim()) ||
      typeof institutionId !== "string" ||
      !uuidPattern.test(institutionId.trim())
    ) {
      return NextResponse.json(
        { error: "Valid campus ID and institution ID are required" },
        { status: 400 }
      );
    }

    const cleanCampusId = campusId.trim();
    const cleanInstitutionId = institutionId.trim();

    const isOwner = await verifyInstitutionOwnership(
      auth,
      cleanInstitutionId
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Institution not found or access denied" },
        { status: 404 }
      );
    }

    // Confirm that this campus belongs to the supplied institution.
    const campusResponse = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_campuses?select=id&id=eq.${encodeURIComponent(cleanCampusId)}&institution_id=eq.${encodeURIComponent(cleanInstitutionId)}&limit=1`,
      {
        headers: {
          apikey: auth.serviceRoleKey,
          Authorization: `Bearer ${auth.serviceRoleKey}`,
        },
        cache: "no-store",
      }
    );

    if (!campusResponse.ok) {
      console.error("Campus verification failed:", campusResponse.status);

      return NextResponse.json(
        { error: "Unable to verify campus. Please try again." },
        { status: 502 }
      );
    }

    const campusData = await campusResponse.json();

    if (!Array.isArray(campusData) || campusData.length === 0) {
      return NextResponse.json(
        { error: "Campus not found or access denied" },
        { status: 404 }
      );
    }

    // Check linked programs and inquiries in parallel.
    const [programsResponse, inquiriesResponse] = await Promise.all([
      fetch(
        `${auth.supabaseUrl}/rest/v1/institution_programs?select=id&campus_id=eq.${encodeURIComponent(cleanCampusId)}&limit=1`,
        {
          headers: {
            apikey: auth.serviceRoleKey,
            Authorization: `Bearer ${auth.serviceRoleKey}`,
          },
          cache: "no-store",
        }
      ),
      fetch(
        `${auth.supabaseUrl}/rest/v1/institution_inquiries?select=id&campus_id=eq.${encodeURIComponent(cleanCampusId)}&limit=1`,
        {
          headers: {
            apikey: auth.serviceRoleKey,
            Authorization: `Bearer ${auth.serviceRoleKey}`,
          },
          cache: "no-store",
        }
      ),
    ]);

    if (!programsResponse.ok || !inquiriesResponse.ok) {
      console.error("Campus linked-record check failed:", {
        programsStatus: programsResponse.status,
        inquiriesStatus: inquiriesResponse.status,
      });

      return NextResponse.json(
        { error: "Unable to verify linked records. Please try again." },
        { status: 502 }
      );
    }

    const [programs, inquiries] = await Promise.all([
      programsResponse.json(),
      inquiriesResponse.json(),
    ]);

    if (
      !Array.isArray(programs) ||
      !Array.isArray(inquiries)
    ) {
      return NextResponse.json(
        { error: "Unable to verify linked records. Please try again." },
        { status: 502 }
      );
    }

    if (programs.length > 0 || inquiries.length > 0) {
      return NextResponse.json(
        {
          error:
            "This campus cannot be deleted because it has linked programs or admission inquiries. Deactivate the campus instead.",
        },
        { status: 409 }
      );
    }

    // Delete only after ownership and linked-record checks succeed.
    const response = await fetch(
      `${auth.supabaseUrl}/rest/v1/institution_campuses?id=eq.${encodeURIComponent(cleanCampusId)}&institution_id=eq.${encodeURIComponent(cleanInstitutionId)}`,
      {
        method: "DELETE",
        headers: {
          apikey: auth.supabaseKey,
          Authorization: `Bearer ${auth.token}`,
          Prefer: "return=representation",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Campus deletion failed:", response.status);

      return NextResponse.json(
        { error: "Unable to delete campus" },
        { status: 502 }
      );
    }

    const deletedData = await response.json();

    if (!Array.isArray(deletedData) || deletedData.length === 0) {
      return NextResponse.json(
        { error: "Campus not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Campus deleted successfully",
    });
  } catch (error) {
    console.error("Campus deletion error:", error);

    return NextResponse.json(
      { error: "Something went wrong while deleting campus" },
      { status: 500 }
    );
  }
}

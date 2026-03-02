import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import { applyRateLimit, STANDARD_LIMIT } from "@/lib/utils/rateLimit";
import { requireAuth } from "@/lib/supabase/auth";
import { searchNearby } from "@/lib/facilities/cmsApi";

const log = createLogger("api/facility-search");

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "facility-search", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { searchParams } = request.nextUrl;
  const state = searchParams.get("state");
  const zip = searchParams.get("zip");

  if (!state || !zip) {
    return NextResponse.json(
      { error: "state and zip parameters are required" },
      { status: 400 }
    );
  }

  try {
    const result = await searchNearby({
      state,
      zip,
      radius: searchParams.get("radius") ? Number(searchParams.get("radius")) : undefined,
      minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });

    log.info("Facility search completed", {
      state,
      zip: searchParams.get("zip") || "none",
      results: result.facilities.length,
      total: result.total,
    });

    return NextResponse.json(result);
  } catch (error) {
    log.errorWithStack("Facility search failed", error);
    return NextResponse.json(
      { error: "Failed to search facilities" },
      { status: 500 }
    );
  }
}

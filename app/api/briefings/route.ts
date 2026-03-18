// GET /api/briefings?parentId=xxx — Fetch briefings
// POST /api/briefings — Upsert a briefing
// DELETE /api/briefings?parentId=xxx — Delete all briefings for parent

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import { applyRateLimit, STANDARD_LIMIT } from "@/lib/utils/rateLimit";
import { requireAuth } from "@/lib/supabase/auth";
import {
  getBriefingsForParentDb,
  saveBriefingForParentDb,
} from "@/lib/db/briefings";
import { getSituationIdForAuthUser } from "@/lib/db/profiles";
import { deleteBriefingsForSituation } from "@/lib/db/briefings";

const log = createLogger("api/briefings");

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "briefings-get", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const parentId = request.nextUrl.searchParams.get("parentId");
    if (!parentId) {
      return NextResponse.json(
        { error: "parentId is required" },
        { status: 400 }
      );
    }

    const briefings = await getBriefingsForParentDb(parentId, auth.user.id);
    return NextResponse.json({ briefings });
  } catch (error) {
    log.errorWithStack("Failed to fetch briefings", error);
    return NextResponse.json(
      { error: "Failed to fetch briefings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "briefings-post", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { parentId, briefing } = body;

    if (!parentId || !briefing) {
      return NextResponse.json(
        { error: "parentId and briefing are required" },
        { status: 400 }
      );
    }

    const saved = await saveBriefingForParentDb(parentId, briefing, auth.user.id);
    if (!saved) {
      return NextResponse.json(
        { error: "No situation found for this profile" },
        { status: 404 }
      );
    }

    return NextResponse.json({ briefing: saved });
  } catch (error) {
    log.errorWithStack("Failed to save briefing", error);
    return NextResponse.json(
      { error: "Failed to save briefing" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "briefings-delete", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const parentId = request.nextUrl.searchParams.get("parentId");
    if (!parentId) {
      return NextResponse.json(
        { error: "parentId is required" },
        { status: 400 }
      );
    }

    const situationId = await getSituationIdForAuthUser(auth.user.id, parentId);
    if (!situationId) {
      return NextResponse.json(
        { error: "No situation found" },
        { status: 404 }
      );
    }

    const count = await deleteBriefingsForSituation(situationId);
    return NextResponse.json({ deleted: count });
  } catch (error) {
    log.errorWithStack("Failed to delete briefings", error);
    return NextResponse.json(
      { error: "Failed to delete briefings" },
      { status: 500 }
    );
  }
}

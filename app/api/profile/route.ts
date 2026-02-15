// GET /api/profile?parentId=xxx — Fetch profile(s)
// POST /api/profile — Create/update profile

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import { applyRateLimit, STANDARD_LIMIT } from "@/lib/utils/rateLimit";
import { upsertProfile, getProfile, getAllProfiles, deleteProfile } from "@/lib/db/profiles";

const log = createLogger("api/profile");

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "profile-get", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const parentId = request.nextUrl.searchParams.get("parentId");

    if (parentId) {
      const profile = await getProfile(parentId);
      if (!profile) {
        return NextResponse.json({ profile: null }, { status: 404 });
      }
      return NextResponse.json({ profile });
    }

    // Return all profiles
    const profiles = await getAllProfiles();
    return NextResponse.json({ profiles });
  } catch (error) {
    log.errorWithStack("Failed to fetch profile", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "profile-post", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { parentId, name, age, state, livingArrangement, healthStatus } = body;

    if (!parentId || !name) {
      return NextResponse.json(
        { error: "parentId and name are required" },
        { status: 400 }
      );
    }

    const profile = await upsertProfile({
      parentId,
      name,
      age,
      state,
      livingArrangement,
      healthStatus,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    log.errorWithStack("Failed to save profile", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "profile-delete", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const parentId = request.nextUrl.searchParams.get("parentId");
    if (!parentId) {
      return NextResponse.json(
        { error: "parentId is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteProfile(parentId);
    return NextResponse.json({ deleted });
  } catch (error) {
    log.errorWithStack("Failed to delete profile", error);
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 }
    );
  }
}

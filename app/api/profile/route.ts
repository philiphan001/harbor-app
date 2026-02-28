// GET /api/profile — Fetch profile(s) for authenticated user
// POST /api/profile — Create/update profile
// DELETE /api/profile?parentId=xxx — Delete a profile

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import { applyRateLimit, STANDARD_LIMIT } from "@/lib/utils/rateLimit";
import { requireAuth } from "@/lib/supabase/auth";
import {
  upsertProfile,
  getProfilesForAuthUser,
  deleteProfile,
} from "@/lib/db/profiles";

const log = createLogger("api/profile");

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "profile-get", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const profiles = await getProfilesForAuthUser(auth.user.id);
    return NextResponse.json({ profiles, userId: auth.user.id });
  } catch (error) {
    log.errorWithStack("Failed to fetch profiles", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "profile-post", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { parentId, name, age, state, city, zip, livingArrangement, healthStatus, photoUrl, spouse, veteranStatus } = body;

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
      city,
      zip,
      livingArrangement,
      healthStatus,
      photoUrl,
      spouse,
      veteranStatus,
      authUserId: auth.user.id,
      authEmail: auth.user.email,
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

    // Verify the parent belongs to this user before deleting
    const profiles = await getProfilesForAuthUser(auth.user.id);
    const ownsProfile = profiles.some((p) => p.parentId === parentId);
    if (!ownsProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
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

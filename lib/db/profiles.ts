// Database operations for User + Situation (parent profiles)

import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/utils/logger";
import { linkExistingAlertsToSituation } from "@/lib/db/alerts";

const log = createLogger("db/profiles");

export interface ProfileInput {
  parentId: string; // Client-side slug for which elder (e.g. "mom", "dad")
  name: string;
  age?: number;
  state?: string;
  city?: string;
  zip?: string;
  livingArrangement?: string;
  healthStatus?: string;
  photoUrl?: string;
  authUserId?: string; // Supabase auth user ID (when authenticated)
  authEmail?: string; // Supabase auth email (when authenticated)
}

export interface ProfileRecord {
  userId: string;
  situationId: string;
  parentId: string;
  name: string;
  age?: number;
  state?: string;
  city?: string;
  zip?: string;
  livingArrangement?: string;
  healthStatus?: string;
  photoUrl?: string;
  lastUpdated: string;
}

/**
 * Upsert a parent profile: creates or updates User + Situation.
 * If authUserId is provided, uses Supabase auth ID for the User record.
 * Otherwise falls back to placeholder email (backward compat).
 */
export async function upsertProfile(input: ProfileInput): Promise<ProfileRecord> {
  log.info("Upserting profile", { parentId: input.parentId, name: input.name, hasAuth: !!input.authUserId });

  let user;

  if (input.authUserId) {
    // Authenticated flow — use Supabase auth user ID
    user = await prisma.user.upsert({
      where: { id: input.authUserId },
      update: {
        name: input.name,
        email: input.authEmail ?? undefined,
      },
      create: {
        id: input.authUserId,
        email: input.authEmail ?? `${input.authUserId}@harbor.local`,
        name: input.name,
      },
    });
  } else {
    // Legacy flow — placeholder email
    const email = `${input.parentId}@harbor.local`;
    user = await prisma.user.upsert({
      where: { email },
      update: { name: input.name },
      create: { email, name: input.name },
    });
  }

  // Find existing situation for this user by elderName match or default placeholder
  const existingSituation = await prisma.situation.findFirst({
    where: {
      createdBy: user.id,
      OR: [
        { elderName: input.name },
        { elderName: "My Parent" }, // default from pre-intake uploads
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const elderLocation = input.state
    ? { state: input.state, city: input.city, zip: input.zip }
    : undefined;

  let situation;
  if (existingSituation) {
    situation = await prisma.situation.update({
      where: { id: existingSituation.id },
      data: {
        elderName: input.name,
        elderAge: input.age ?? null,
        elderLocation: elderLocation ?? existingSituation.elderLocation ?? undefined,
        currentLivingSituation: input.livingArrangement ?? existingSituation.currentLivingSituation,
        cognitiveStatus: input.healthStatus ?? existingSituation.cognitiveStatus,
        elderPhotoUrl: input.photoUrl ?? existingSituation.elderPhotoUrl,
      },
    });
  } else {
    situation = await prisma.situation.create({
      data: {
        elderName: input.name,
        elderAge: input.age,
        elderLocation: elderLocation ?? undefined,
        currentLivingSituation: input.livingArrangement,
        cognitiveStatus: input.healthStatus,
        elderPhotoUrl: input.photoUrl,
        createdBy: user.id,
      },
    });

    // Backfill existing global alerts for the new situation
    linkExistingAlertsToSituation(situation.id, input.state ?? null).catch(() => {});
  }

  log.info("Profile upserted", { userId: user.id, situationId: situation.id });

  const loc = situation.elderLocation as { state?: string; city?: string; zip?: string } | null;

  return {
    userId: user.id,
    situationId: situation.id,
    parentId: input.parentId,
    name: input.name,
    age: situation.elderAge ?? undefined,
    state: loc?.state,
    city: loc?.city,
    zip: loc?.zip,
    livingArrangement: situation.currentLivingSituation ?? undefined,
    healthStatus: situation.cognitiveStatus ?? undefined,
    photoUrl: situation.elderPhotoUrl ?? undefined,
    lastUpdated: situation.updatedAt.toISOString(),
  };
}

/**
 * Get a profile by the client-side parentId (legacy flow).
 */
export async function getProfile(parentId: string): Promise<ProfileRecord | null> {
  const email = `${parentId}@harbor.local`;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      situations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user || user.situations.length === 0) return null;

  const situation = user.situations[0];

  const loc = situation.elderLocation as { state?: string; city?: string; zip?: string } | null;

  return {
    userId: user.id,
    situationId: situation.id,
    parentId,
    name: situation.elderName,
    age: situation.elderAge ?? undefined,
    state: loc?.state,
    city: loc?.city,
    zip: loc?.zip,
    livingArrangement: situation.currentLivingSituation ?? undefined,
    healthStatus: situation.cognitiveStatus ?? undefined,
    photoUrl: situation.elderPhotoUrl ?? undefined,
    lastUpdated: situation.updatedAt.toISOString(),
  };
}

/**
 * Get all profiles for an authenticated user (by Supabase auth user ID).
 */
export async function getProfilesForAuthUser(authUserId: string): Promise<ProfileRecord[]> {
  const user = await prisma.user.findUnique({
    where: { id: authUserId },
    include: {
      situations: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user || user.situations.length === 0) return [];

  return user.situations.map((situation) => {
    const loc = situation.elderLocation as { state?: string; city?: string; zip?: string } | null;
    return {
      userId: user.id,
      situationId: situation.id,
      parentId: situation.elderName.toLowerCase().replace(/\s+/g, "-"),
      name: situation.elderName,
      age: situation.elderAge ?? undefined,
      state: loc?.state,
      city: loc?.city,
      zip: loc?.zip,
      livingArrangement: situation.currentLivingSituation ?? undefined,
      healthStatus: situation.cognitiveStatus ?? undefined,
      photoUrl: situation.elderPhotoUrl ?? undefined,
      lastUpdated: situation.updatedAt.toISOString(),
    };
  });
}

/**
 * Get all profiles (all users with their situations) — legacy flow.
 */
export async function getAllProfiles(): Promise<ProfileRecord[]> {
  const users = await prisma.user.findMany({
    include: {
      situations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    where: {
      email: { endsWith: "@harbor.local" },
    },
  });

  return users
    .filter((u) => u.situations.length > 0)
    .map((u) => {
      const situation = u.situations[0];
      const parentId = u.email.replace("@harbor.local", "");
      const loc = situation.elderLocation as { state?: string; city?: string; zip?: string } | null;
      return {
        userId: u.id,
        situationId: situation.id,
        parentId,
        name: situation.elderName,
        age: situation.elderAge ?? undefined,
        state: loc?.state,
        city: loc?.city,
        zip: loc?.zip,
        livingArrangement: situation.currentLivingSituation ?? undefined,
        healthStatus: situation.cognitiveStatus ?? undefined,
        photoUrl: situation.elderPhotoUrl ?? undefined,
        lastUpdated: situation.updatedAt.toISOString(),
      };
    });
}

/**
 * Delete a profile (user + situation + cascade).
 */
export async function deleteProfile(parentId: string): Promise<boolean> {
  const email = `${parentId}@harbor.local`;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { situations: true },
  });

  if (!user) return false;

  log.info("Deleting profile", { parentId, userId: user.id });

  // Delete situations and their related data (cascading through relations)
  for (const situation of user.situations) {
    await prisma.$transaction([
      prisma.medicalCondition.deleteMany({ where: { situationId: situation.id } }),
      prisma.medication.deleteMany({ where: { situationId: situation.id } }),
      prisma.provider.deleteMany({ where: { situationId: situation.id } }),
      prisma.financialProfile.deleteMany({ where: { situationId: situation.id } }),
      prisma.legalDocument.deleteMany({ where: { situationId: situation.id } }),
      prisma.housingAssessment.deleteMany({ where: { situationId: situation.id } }),
      prisma.careScenario.deleteMany({ where: { situationId: situation.id } }),
      prisma.task.deleteMany({ where: { situationId: situation.id } }),
      prisma.message.deleteMany({
        where: { conversation: { situationId: situation.id } },
      }),
      prisma.conversation.deleteMany({ where: { situationId: situation.id } }),
      prisma.alert.deleteMany({ where: { situationId: situation.id } }),
      prisma.document.deleteMany({ where: { situationId: situation.id } }),
      prisma.readinessHistory.deleteMany({ where: { situationId: situation.id } }),
      prisma.situationMember.deleteMany({ where: { situationId: situation.id } }),
      prisma.situation.delete({ where: { id: situation.id } }),
    ]);
  }

  await prisma.user.delete({ where: { id: user.id } });

  return true;
}

/**
 * Get the situationId for a parentId (needed by other DB functions).
 * Legacy flow — uses placeholder email.
 */
export async function getSituationId(parentId: string): Promise<string | null> {
  const profile = await getProfile(parentId);
  return profile?.situationId ?? null;
}

/**
 * Get the situationId for an auth user + parentId.
 * Finds the situation by the auth user's DB record + elderName match.
 * Falls back to legacy flow if no auth-created situation exists.
 */
export async function getSituationIdForAuthUser(
  authUserId: string,
  parentId: string
): Promise<string | null> {
  // First try: find situation by auth user ID
  const situations = await prisma.situation.findMany({
    where: { createdBy: authUserId },
    orderBy: { createdAt: "desc" },
  });

  if (situations.length > 0) {
    // If there's a parentId, try to match by elderName slug
    const match = situations.find(
      (s) => s.elderName.toLowerCase().replace(/\s+/g, "-") === parentId
    );
    // Return matched or first situation
    return match?.id ?? situations[0].id;
  }

  // Fallback: try legacy flow
  return getSituationId(parentId);
}

/**
 * Ensure a situation exists for the auth user, creating a default one if needed.
 * This allows documents to be uploaded before the user completes intake.
 * Returns the situationId (existing or newly created).
 */
export async function ensureSituationForUser(
  authUserId: string,
  authEmail?: string
): Promise<string> {
  // Check for existing situations
  const existing = await prisma.situation.findFirst({
    where: { createdBy: authUserId },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return existing.id;

  // Ensure user record exists
  await prisma.user.upsert({
    where: { id: authUserId },
    update: {},
    create: {
      id: authUserId,
      email: authEmail ?? `${authUserId}@harbor.local`,
      name: "Caregiver",
    },
  });

  // Create a default situation
  const situation = await prisma.situation.create({
    data: {
      elderName: "My Parent",
      createdBy: authUserId,
    },
  });

  // Backfill existing global alerts (no state known yet, just link global ones)
  linkExistingAlertsToSituation(situation.id, null).catch(() => {});

  log.info("Created default situation for pre-intake user", {
    userId: authUserId,
    situationId: situation.id,
  });

  return situation.id;
}

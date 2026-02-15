// Database operations for User + Situation (parent profiles)

import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("db/profiles");

export interface ProfileInput {
  parentId: string; // Client-side ID (used as situation elderName slug)
  name: string;
  age?: number;
  state?: string;
  livingArrangement?: string;
  healthStatus?: string;
}

export interface ProfileRecord {
  userId: string;
  situationId: string;
  parentId: string;
  name: string;
  age?: number;
  state?: string;
  livingArrangement?: string;
  healthStatus?: string;
  lastUpdated: string;
}

/**
 * Upsert a parent profile: creates or updates User + Situation.
 * Uses a placeholder email since we don't have auth yet.
 */
export async function upsertProfile(input: ProfileInput): Promise<ProfileRecord> {
  const email = `${input.parentId}@harbor.local`; // placeholder until auth

  log.info("Upserting profile", { parentId: input.parentId, name: input.name });

  // Upsert user
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: input.name },
    create: {
      email,
      name: input.name,
    },
  });

  // Find existing situation for this user/elder or create one
  const existingSituation = await prisma.situation.findFirst({
    where: { createdBy: user.id },
    orderBy: { createdAt: "desc" },
  });

  const elderLocation = input.state
    ? { state: input.state }
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
        createdBy: user.id,
      },
    });
  }

  log.info("Profile upserted", { userId: user.id, situationId: situation.id });

  return {
    userId: user.id,
    situationId: situation.id,
    parentId: input.parentId,
    name: input.name,
    age: situation.elderAge ?? undefined,
    state: (situation.elderLocation as { state?: string })?.state,
    livingArrangement: situation.currentLivingSituation ?? undefined,
    healthStatus: situation.cognitiveStatus ?? undefined,
    lastUpdated: situation.updatedAt.toISOString(),
  };
}

/**
 * Get a profile by the client-side parentId.
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

  return {
    userId: user.id,
    situationId: situation.id,
    parentId,
    name: situation.elderName,
    age: situation.elderAge ?? undefined,
    state: (situation.elderLocation as { state?: string })?.state,
    livingArrangement: situation.currentLivingSituation ?? undefined,
    healthStatus: situation.cognitiveStatus ?? undefined,
    lastUpdated: situation.updatedAt.toISOString(),
  };
}

/**
 * Get all profiles (all users with their situations).
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
      return {
        userId: u.id,
        situationId: situation.id,
        parentId,
        name: situation.elderName,
        age: situation.elderAge ?? undefined,
        state: (situation.elderLocation as { state?: string })?.state,
        livingArrangement: situation.currentLivingSituation ?? undefined,
        healthStatus: situation.cognitiveStatus ?? undefined,
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
 */
export async function getSituationId(parentId: string): Promise<string | null> {
  const profile = await getProfile(parentId);
  return profile?.situationId ?? null;
}

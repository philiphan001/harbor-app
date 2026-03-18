// Database operations for Briefings

import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/utils/logger";
import { getSituationIdForAuthUser, getSituationId } from "./profiles";

const log = createLogger("db/briefings");

export interface BriefingInput {
  parentId: string;
  parentName: string;
  weekOf: string; // ISO date string
  generatedAt?: string;
  content: string;
  signalCount: number;
  urgentCount: number;
  importantCount: number;
}

export interface BriefingRecord {
  id: string;
  parentId: string;
  parentName: string;
  weekOf: string;
  generatedAt: string;
  content: string;
  signalCount: number;
  urgentCount: number;
  importantCount: number;
}

/**
 * Upsert a briefing by situationId + weekOf (prevents duplicates for the same week).
 */
export async function saveBriefingToDb(
  situationId: string,
  briefing: BriefingInput
): Promise<BriefingRecord> {
  const weekOfDate = new Date(briefing.weekOf);

  log.info("Saving briefing to DB", { situationId, weekOf: briefing.weekOf });

  const record = await prisma.briefing.upsert({
    where: {
      uq_briefing_week: {
        situationId,
        weekOf: weekOfDate,
      },
    },
    update: {
      parentId: briefing.parentId,
      parentName: briefing.parentName,
      content: briefing.content,
      signalCount: briefing.signalCount,
      urgentCount: briefing.urgentCount,
      importantCount: briefing.importantCount,
      generatedAt: briefing.generatedAt ? new Date(briefing.generatedAt) : new Date(),
    },
    create: {
      situationId,
      parentId: briefing.parentId,
      parentName: briefing.parentName,
      weekOf: weekOfDate,
      content: briefing.content,
      signalCount: briefing.signalCount,
      urgentCount: briefing.urgentCount,
      importantCount: briefing.importantCount,
      generatedAt: briefing.generatedAt ? new Date(briefing.generatedAt) : new Date(),
    },
  });

  return toBriefingRecord(record);
}

/**
 * Get briefings for a situation, newest first.
 */
export async function getBriefingsForSituation(
  situationId: string,
  limit = 12
): Promise<BriefingRecord[]> {
  const records = await prisma.briefing.findMany({
    where: { situationId },
    orderBy: { generatedAt: "desc" },
    take: limit,
  });

  return records.map(toBriefingRecord);
}

/**
 * Delete all briefings for a situation.
 */
export async function deleteBriefingsForSituation(
  situationId: string
): Promise<number> {
  const result = await prisma.briefing.deleteMany({
    where: { situationId },
  });
  return result.count;
}

/**
 * Resolve situationId and get briefings for a parent.
 */
export async function getBriefingsForParentDb(
  parentId: string,
  authUserId?: string,
  limit = 12
): Promise<BriefingRecord[]> {
  const situationId = authUserId
    ? await getSituationIdForAuthUser(authUserId, parentId)
    : await getSituationId(parentId);

  if (!situationId) return [];
  return getBriefingsForSituation(situationId, limit);
}

/**
 * Resolve situationId and save a briefing for a parent.
 */
export async function saveBriefingForParentDb(
  parentId: string,
  briefing: BriefingInput,
  authUserId?: string
): Promise<BriefingRecord | null> {
  const situationId = authUserId
    ? await getSituationIdForAuthUser(authUserId, parentId)
    : await getSituationId(parentId);

  if (!situationId) {
    log.warn("No situation found for parent, skipping briefing save", { parentId });
    return null;
  }

  return saveBriefingToDb(situationId, briefing);
}

// --- Internal helpers ---

function toBriefingRecord(record: {
  id: string;
  parentId: string;
  parentName: string;
  weekOf: Date;
  generatedAt: Date;
  content: string;
  signalCount: number;
  urgentCount: number;
  importantCount: number;
}): BriefingRecord {
  return {
    id: record.id,
    parentId: record.parentId,
    parentName: record.parentName,
    weekOf: record.weekOf.toISOString(),
    generatedAt: record.generatedAt.toISOString(),
    content: record.content,
    signalCount: record.signalCount,
    urgentCount: record.urgentCount,
    importantCount: record.importantCount,
  };
}

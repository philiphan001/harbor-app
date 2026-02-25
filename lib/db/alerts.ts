// DB layer for agent detections (global_alerts + situation_alert_status tables)

import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/utils/logger";
import type { AgentDetection } from "@/lib/types/agents";

const log = createLogger("db/alerts");

export interface AlertRecord {
  id: string;
  situationId: string;
  agentType: string | null;
  severity: string;
  title: string;
  message: string;
  recommendedAction: string | null;
  financialImpact: number | null;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  createdAt: Date;
  sourceUrl?: string;
  dataSource?: string;
  domain?: string;
}

export interface GlobalAlertInput {
  agentType: string;
  severity: "informational" | "actionable" | "urgent";
  title: string;
  message: string;
  sourceUrl?: string;
  dataSource?: string;
  domain?: string;
  stateCode?: string;
  financialImpact?: number;
}

/**
 * Upsert global alerts — creates new rows or skips duplicates (by title+stateCode+agentType).
 * Returns the full set of GlobalAlert rows that match the inputs.
 */
export async function upsertGlobalAlerts(inputs: GlobalAlertInput[]) {
  if (inputs.length === 0) return [];

  try {
    // Use upsert per-row to get back the IDs (createMany doesn't return records in Postgres via Prisma)
    const results = await Promise.all(
      inputs.map((input) =>
        prisma.globalAlert.upsert({
          where: {
            uq_global_alert_dedup: {
              title: input.title,
              stateCode: input.stateCode ?? "ALL",
              agentType: input.agentType,
            },
          },
          update: {}, // Already exists — no update needed
          create: {
            agentType: input.agentType,
            severity: input.severity,
            title: input.title,
            message: input.message,
            sourceUrl: input.sourceUrl,
            dataSource: input.dataSource,
            domain: input.domain,
            stateCode: input.stateCode ?? "ALL",
            financialImpact: input.financialImpact,
          },
        })
      )
    );

    log.info("Upserted global alerts", { count: results.length });
    return results;
  } catch (error) {
    log.errorWithStack("Failed to upsert global alerts", error);
    throw error;
  }
}

/**
 * Link global alerts to matching situations via SituationAlertStatus.
 * Uses createMany with skipDuplicates to avoid errors on re-runs.
 */
export async function linkAlertsToSituations(
  globalAlertIds: string[],
  situationIds: string[]
) {
  if (globalAlertIds.length === 0 || situationIds.length === 0) return 0;

  try {
    const data = globalAlertIds.flatMap((globalAlertId) =>
      situationIds.map((situationId) => ({
        situationId,
        globalAlertId,
      }))
    );

    const result = await prisma.situationAlertStatus.createMany({
      data,
      skipDuplicates: true,
    });

    log.info("Linked alerts to situations", { created: result.count });
    return result.count;
  } catch (error) {
    log.errorWithStack("Failed to link alerts to situations", error);
    throw error;
  }
}

/**
 * Link existing global alerts to a newly created situation.
 * Matches by stateCode: links ALL (global) alerts plus any matching the situation's state.
 */
export async function linkExistingAlertsToSituation(
  situationId: string,
  stateCode: string | null
) {
  try {
    const stateCodes = ["ALL"];
    if (stateCode) stateCodes.push(stateCode);

    const globalAlerts = await prisma.globalAlert.findMany({
      where: { stateCode: { in: stateCodes } },
      select: { id: true },
    });

    if (globalAlerts.length === 0) return 0;

    const result = await prisma.situationAlertStatus.createMany({
      data: globalAlerts.map((ga) => ({
        situationId,
        globalAlertId: ga.id,
      })),
      skipDuplicates: true,
    });

    log.info("Backfilled alerts for new situation", {
      situationId,
      stateCode: stateCode ?? "ALL",
      linked: result.count,
    });

    return result.count;
  } catch (error) {
    log.errorWithStack("Failed to backfill alerts for situation", error);
    return 0; // Non-fatal — don't block situation creation
  }
}

/**
 * Get all alerts for a situation, ordered by newest first.
 */
export async function getAlertsForSituation(
  situationId: string,
  limit = 50
): Promise<AlertRecord[]> {
  try {
    const statuses = await prisma.situationAlertStatus.findMany({
      where: { situationId },
      include: { globalAlert: true },
      orderBy: { globalAlert: { createdAt: "desc" } },
      take: limit,
    });

    return statuses.map((s) => mapToAlertRecord(s, situationId));
  } catch (error) {
    log.errorWithStack("Failed to get alerts", error);
    return [];
  }
}

/**
 * Get unacknowledged alerts for a situation.
 */
export async function getUnacknowledgedAlerts(
  situationId: string
): Promise<AlertRecord[]> {
  try {
    const statuses = await prisma.situationAlertStatus.findMany({
      where: { situationId, acknowledged: false },
      include: { globalAlert: true },
      orderBy: { globalAlert: { createdAt: "desc" } },
    });

    return statuses.map((s) => mapToAlertRecord(s, situationId));
  } catch (error) {
    log.errorWithStack("Failed to get unacknowledged alerts", error);
    return [];
  }
}

/**
 * Mark an alert as acknowledged for a specific situation.
 */
export async function acknowledgeAlert(
  globalAlertId: string,
  situationId: string,
  userId: string
) {
  try {
    return await prisma.situationAlertStatus.update({
      where: {
        uq_situation_alert: {
          situationId,
          globalAlertId,
        },
      },
      data: {
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    });
  } catch (error) {
    log.errorWithStack("Failed to acknowledge alert", error);
    throw error;
  }
}

/**
 * Get recent alerts for briefing generation.
 */
export async function getRecentAlertsForBriefing(
  situationId: string,
  days = 7,
  limit = 30
): Promise<AlertRecord[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const statuses = await prisma.situationAlertStatus.findMany({
      where: {
        situationId,
        globalAlert: { createdAt: { gte: since } },
      },
      include: { globalAlert: true },
      orderBy: { globalAlert: { createdAt: "desc" } },
      take: limit,
    });

    return statuses.map((s) => mapToAlertRecord(s, situationId));
  } catch (error) {
    log.errorWithStack("Failed to get recent alerts for briefing", error);
    return [];
  }
}

/**
 * Convert AlertRecords to AgentDetection format for the briefing pipeline.
 */
export function alertsToDetections(alerts: AlertRecord[]): AgentDetection[] {
  return alerts.map((alert) => {
    const severityToScore: Record<string, "high" | "medium" | "low"> = {
      urgent: "high",
      actionable: "medium",
      informational: "low",
    };

    const validDomains = ["medical", "financial", "legal", "housing", "caregiving"] as const;
    type ValidDomain = typeof validDomains[number];
    const domain: ValidDomain = validDomains.includes(alert.domain as ValidDomain)
      ? (alert.domain as ValidDomain)
      : "medical";

    return {
      id: alert.id,
      agentType: (alert.agentType ?? "news_monitor") as AgentDetection["agentType"],
      runId: `alert-${alert.id}`,
      detectedAt: alert.createdAt.toISOString(),
      title: alert.title,
      description: alert.message,
      relevanceScore: severityToScore[alert.severity] ?? "low",
      domain,
      actionable: alert.severity === "urgent" || alert.severity === "actionable",
      handled: alert.acknowledged,
      sourceUrl: alert.sourceUrl,
      dataSource: alert.dataSource,
    };
  });
}

// Map a SituationAlertStatus (with included globalAlert) to AlertRecord
function mapToAlertRecord(
  status: {
    id: string;
    situationId: string;
    globalAlertId: string;
    acknowledged: boolean;
    acknowledgedBy: string | null;
    globalAlert: {
      id: string;
      agentType: string | null;
      severity: string;
      title: string;
      message: string;
      sourceUrl: string | null;
      dataSource: string | null;
      domain: string | null;
      financialImpact: unknown;
      createdAt: Date;
    };
  },
  situationId: string
): AlertRecord {
  const ga = status.globalAlert;
  return {
    id: ga.id,
    situationId,
    agentType: ga.agentType,
    severity: ga.severity,
    title: ga.title,
    message: ga.message,
    recommendedAction: null,
    financialImpact: ga.financialImpact ? Number(ga.financialImpact) : null,
    acknowledged: status.acknowledged,
    acknowledgedBy: status.acknowledgedBy,
    createdAt: ga.createdAt,
    sourceUrl: ga.sourceUrl ?? undefined,
    dataSource: ga.dataSource ?? undefined,
    domain: ga.domain ?? undefined,
  };
}

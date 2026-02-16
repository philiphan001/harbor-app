// DB layer for agent detections (alerts table)

import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/utils/logger";

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
  // Extended fields stored in recommendedAction as JSON suffix
  sourceUrl?: string;
  dataSource?: string;
  domain?: string;
}

export interface CreateAlertInput {
  situationId: string;
  agentType: string;
  severity: "informational" | "actionable" | "urgent";
  title: string;
  message: string;
  recommendedAction?: string;
  sourceUrl?: string;
  dataSource?: string;
  domain?: string;
}

/**
 * Create a new alert (agent detection) in the database.
 */
export async function createAlert(input: CreateAlertInput) {
  try {
    // Pack extra fields into recommendedAction as JSON
    const extraData = JSON.stringify({
      recommendedAction: input.recommendedAction,
      sourceUrl: input.sourceUrl,
      dataSource: input.dataSource,
      domain: input.domain,
    });

    const alert = await prisma.alert.create({
      data: {
        situationId: input.situationId,
        agentType: input.agentType,
        severity: input.severity,
        title: input.title,
        message: input.message,
        recommendedAction: extraData,
      },
    });

    return alert;
  } catch (error) {
    log.errorWithStack("Failed to create alert", error);
    throw error;
  }
}

/**
 * Create multiple alerts in a batch.
 */
export async function createAlertsBatch(inputs: CreateAlertInput[]) {
  if (inputs.length === 0) return [];

  try {
    const results = await Promise.all(inputs.map((input) => createAlert(input)));
    log.info("Created alerts batch", { count: results.length });
    return results;
  } catch (error) {
    log.errorWithStack("Failed to create alerts batch", error);
    throw error;
  }
}

/**
 * Get all alerts for a situation, ordered by newest first.
 */
export async function getAlertsForSituation(
  situationId: string,
  limit = 50
) {
  try {
    const alerts = await prisma.alert.findMany({
      where: { situationId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return alerts.map(parseAlertRecord);
  } catch (error) {
    log.errorWithStack("Failed to get alerts", error);
    return [];
  }
}

/**
 * Get unacknowledged alerts for a situation.
 */
export async function getUnacknowledgedAlerts(situationId: string) {
  try {
    const alerts = await prisma.alert.findMany({
      where: { situationId, acknowledged: false },
      orderBy: { createdAt: "desc" },
    });

    return alerts.map(parseAlertRecord);
  } catch (error) {
    log.errorWithStack("Failed to get unacknowledged alerts", error);
    return [];
  }
}

/**
 * Mark an alert as acknowledged.
 */
export async function acknowledgeAlert(alertId: string, userId: string) {
  try {
    return await prisma.alert.update({
      where: { id: alertId },
      data: { acknowledged: true, acknowledgedBy: userId },
    });
  } catch (error) {
    log.errorWithStack("Failed to acknowledge alert", error);
    throw error;
  }
}

/**
 * Check if an alert with this title already exists (deduplication).
 * Checks within the last N days to avoid perpetual dedup.
 */
export async function alertExistsRecently(
  situationId: string,
  title: string,
  withinDays = 7
): Promise<boolean> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - withinDays);

    const existing = await prisma.alert.findFirst({
      where: {
        situationId,
        title,
        createdAt: { gte: since },
      },
    });

    return !!existing;
  } catch (error) {
    log.errorWithStack("Failed to check alert existence", error);
    return false;
  }
}

// Parse extra fields from recommendedAction JSON
function parseAlertRecord(alert: {
  id: string;
  situationId: string;
  agentType: string | null;
  severity: string;
  title: string;
  message: string;
  recommendedAction: string | null;
  financialImpact: unknown;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  createdAt: Date;
}): AlertRecord {
  let sourceUrl: string | undefined;
  let dataSource: string | undefined;
  let domain: string | undefined;
  let recommendedAction: string | null = alert.recommendedAction;

  // Try to parse packed JSON from recommendedAction
  if (alert.recommendedAction) {
    try {
      const extra = JSON.parse(alert.recommendedAction);
      recommendedAction = extra.recommendedAction || null;
      sourceUrl = extra.sourceUrl;
      dataSource = extra.dataSource;
      domain = extra.domain;
    } catch {
      // Not JSON, keep as plain text
    }
  }

  return {
    ...alert,
    financialImpact: alert.financialImpact ? Number(alert.financialImpact) : null,
    recommendedAction,
    sourceUrl,
    dataSource,
    domain,
  };
}

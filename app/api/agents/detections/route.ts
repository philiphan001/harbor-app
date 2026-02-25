// API endpoint for fetching agent detections (alerts) from the database
// Used by the monitoring page to display real agent results

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { applyRateLimit, STANDARD_LIMIT } from "@/lib/utils/rateLimit";
import { getAlertsForSituation, acknowledgeAlert } from "@/lib/db/alerts";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("api/agents/detections");

/**
 * GET /api/agents/detections?situationId=xxx
 * Returns all detections for a situation (or the user's first situation).
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "detections", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    let situationId = searchParams.get("situationId");

    // If no situationId provided, find the user's first situation
    if (!situationId) {
      const situation = await prisma.situation.findFirst({
        where: { createdBy: auth.user.id },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });

      if (!situation) {
        return NextResponse.json({ detections: [], message: "No situations found" });
      }

      situationId = situation.id;
    }

    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const alerts = await getAlertsForSituation(situationId, limit);

    // Transform to the AgentDetection shape the monitoring page expects
    const detections = alerts.map((alert) => ({
      id: alert.id,
      agentType: alert.agentType || "policy_monitor",
      runId: "", // Not tracked per-run in DB
      detectedAt: alert.createdAt.toISOString(),
      title: alert.title,
      description: alert.message,
      relevanceScore: mapSeverityToRelevance(alert.severity),
      domain: alert.domain || "medical",
      actionable: alert.severity !== "informational",
      handled: alert.acknowledged,
      convertedToTask: false,
      sourceUrl: alert.sourceUrl,
      dataSource: alert.dataSource,
    }));

    return NextResponse.json({ detections, situationId });
  } catch (error) {
    log.errorWithStack("Failed to fetch detections", error);
    return NextResponse.json(
      { error: "Failed to fetch detections" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/detections
 * Acknowledge (mark as handled) a detection.
 * Body: { alertId: string, situationId: string }
 */
export async function PATCH(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "detections", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { alertId, situationId } = await request.json();

    if (!alertId || !situationId) {
      return NextResponse.json(
        { error: "alertId and situationId are required" },
        { status: 400 }
      );
    }

    await acknowledgeAlert(alertId, situationId, auth.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    log.errorWithStack("Failed to acknowledge detection", error);
    return NextResponse.json(
      { error: "Failed to acknowledge detection" },
      { status: 500 }
    );
  }
}

function mapSeverityToRelevance(severity: string): "high" | "medium" | "low" {
  switch (severity) {
    case "urgent":
      return "high";
    case "actionable":
      return "medium";
    case "informational":
      return "low";
    default:
      return "low";
  }
}

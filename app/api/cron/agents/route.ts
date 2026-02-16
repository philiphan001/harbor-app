// Cron endpoint for running all monitoring agents
// Called by Vercel Cron or any external scheduler
//
// Security: Vercel Cron sends an Authorization header with CRON_SECRET.
// In production, verify this. In dev, allow unauthenticated access.

import { NextRequest, NextResponse } from "next/server";
import { runAllAgents } from "@/lib/agents/runner";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("api/cron/agents");

export const maxDuration = 60; // Allow up to 60s for external API calls

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      log.warn("Unauthorized cron request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    log.info("Starting scheduled agent run");

    const result = await runAllAgents();

    log.info("Scheduled agent run complete", {
      totalNewAlerts: result.totalNewAlerts,
      duration: `${result.duration}ms`,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    log.errorWithStack("Cron agent run failed", error);
    return NextResponse.json(
      {
        error: "Agent run failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

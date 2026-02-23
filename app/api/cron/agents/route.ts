// Cron endpoint for running all monitoring agents
// Called by Vercel Cron or any external scheduler
//
// Security: Vercel Cron sends an Authorization header with CRON_SECRET.
// In production, verify this. In dev, allow unauthenticated access.

import { NextRequest, NextResponse } from "next/server";
import { runAllAgents } from "@/lib/agents/runner";
import { generateBriefingForSituation } from "@/lib/ai/briefingAgent";
import { sendBriefingEmail } from "@/lib/email/send";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("api/cron/agents");

export const maxDuration = 120; // Allow up to 120s for agents + briefing generation

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

    // If briefing=true, generate and email briefings for all situations
    const briefingRequested = request.nextUrl.searchParams.get("briefing") === "true";
    let briefingsGenerated = 0;

    if (briefingRequested) {
      log.info("Briefing generation requested, processing situations");

      const situations = await prisma.situation.findMany({
        select: {
          id: true,
          elderName: true,
          creator: { select: { email: true } },
        },
      });

      for (const situation of situations) {
        try {
          const briefing = await generateBriefingForSituation(situation.id);
          if (briefing && situation.creator?.email) {
            await sendBriefingEmail(situation.creator.email, {
              elderName: briefing.parentName,
              weekOf: briefing.weekOf,
              urgentCount: briefing.urgentCount,
              importantCount: briefing.importantCount,
              signalCount: briefing.signalCount,
              content: briefing.content,
            });
            briefingsGenerated++;
          }
        } catch (err) {
          log.errorWithStack(`Briefing failed for situation ${situation.id}`, err);
        }
      }

      log.info("Briefing generation complete", { briefingsGenerated });
    }

    return NextResponse.json({
      success: true,
      ...result,
      ...(briefingRequested ? { briefingsGenerated } : {}),
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

// API endpoint to generate weekly briefing

import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyBriefing } from "@/lib/ai/briefingAgent";
import { scoreMultipleSignals } from "@/lib/ai/judgmentAgent";
import { createEmptySituationContext } from "@/lib/types/situationContext";
import { AgentDetection } from "@/lib/types/agents";
import { applyRateLimit, BRIEFING_LIMIT } from "@/lib/utils/rateLimit";
import { requireAuth } from "@/lib/supabase/auth";
import { sendBriefingEmail } from "@/lib/email/send";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("api/generate-briefing");

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "generate-briefing", BRIEFING_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { parentId, parentProfile, detections } = body as {
      parentId?: string;
      parentProfile?: { id: string; name: string; age?: number; state?: string };
      detections?: AgentDetection[];
    };

    if (!parentId || !parentProfile) {
      return NextResponse.json(
        { error: "parentId and parentProfile are required" },
        { status: 400 }
      );
    }

    if (!detections || detections.length === 0) {
      return NextResponse.json(
        {
          error: "No detections found",
          message: "Generate some mock agent data first by visiting /monitoring",
        },
        { status: 400 }
      );
    }

    // Build situation context from the provided profile
    const context = createEmptySituationContext(
      parentProfile.id,
      parentProfile.name,
      parentProfile.age || 75,
      parentProfile.state || "Unknown"
    );

    context.lastUpdated = new Date().toISOString();

    log.info("Generating weekly briefing", {
      parentName: context.profile.name,
      detectionCount: detections.length
    });

    // Score all signals
    const scoredSignals = await scoreMultipleSignals(detections, context);

    log.info("Signals scored", { count: scoredSignals.length });

    // Filter to relevant signals (score >= 50)
    const relevantSignals = scoredSignals.filter((s) => s.relevanceScore >= 50);

    log.info("Relevant signals filtered", { count: relevantSignals.length });

    if (relevantSignals.length === 0) {
      return NextResponse.json(
        {
          error: "No relevant signals",
          message: "All signals scored below 50 - nothing to brief on this week",
        },
        { status: 400 }
      );
    }

    // Generate briefing
    const briefing = await generateWeeklyBriefing(context, relevantSignals);

    log.info("Briefing generated successfully");

    // Send briefing email (fire-and-forget)
    if (auth.user.email) {
      sendBriefingEmail(auth.user.email, {
        elderName: briefing.parentName,
        weekOf: briefing.weekOf,
        urgentCount: briefing.urgentCount,
        importantCount: briefing.importantCount,
        signalCount: briefing.signalCount,
        content: briefing.content,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      briefing,
    });
  } catch (error) {
    log.errorWithStack("Failed to generate briefing", error);
    return NextResponse.json(
      {
        error: "Failed to generate briefing",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// API endpoint to score a signal's relevance using Judgment Agent

import { NextRequest, NextResponse } from "next/server";
import { scoreSignal } from "@/lib/ai/judgmentAgent";
import { createEmptySituationContext } from "@/lib/types/situationContext";
import { AgentDetection } from "@/lib/types/agents";
import { applyRateLimit, AI_EXTRACTION_LIMIT } from "@/lib/utils/rateLimit";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("api/score-signal");

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "score-signal", AI_EXTRACTION_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { signal, parentProfile } = body as {
      signal: AgentDetection;
      parentProfile?: { id: string; name: string; age?: number; state?: string };
    };

    if (!signal) {
      return NextResponse.json(
        { error: "Signal is required" },
        { status: 400 }
      );
    }

    if (!parentProfile) {
      return NextResponse.json(
        { error: "Parent profile is required" },
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

    log.info("Scoring signal", {
      title: signal.title,
      parentName: context.profile.name,
      parentAge: context.profile.age,
      parentState: context.profile.state
    });

    // Score the signal
    const scored = await scoreSignal(signal, context);

    log.info("Signal scored", {
      score: scored.relevanceScore,
      priority: scored.priority,
      reasoning: scored.reasoning
    });

    return NextResponse.json({
      success: true,
      scored,
    });
  } catch (error) {
    log.errorWithStack("Failed to score signal", error);
    return NextResponse.json(
      {
        error: "Failed to score signal",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

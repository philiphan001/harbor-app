// API endpoint to generate weekly briefing

import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyBriefing } from "@/lib/ai/briefingAgent";
import { scoreMultipleSignals } from "@/lib/ai/judgmentAgent";
import { createEmptySituationContext } from "@/lib/types/situationContext";
import { AgentDetection } from "@/lib/types/agents";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentId, parentProfile, detections } = body as {
      parentId?: string;
      parentProfile?: any;
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

    console.log(`Generating weekly briefing for ${context.profile.name}...`);
    console.log(`   Found ${detections.length} detections to score`);

    // Score all signals
    const scoredSignals = await scoreMultipleSignals(detections, context);

    console.log(`   Scored ${scoredSignals.length} signals`);

    // Filter to relevant signals (score >= 50)
    const relevantSignals = scoredSignals.filter((s) => s.relevanceScore >= 50);

    console.log(`   ${relevantSignals.length} signals are relevant (score >= 50)`);

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

    console.log(`Briefing generated`);

    return NextResponse.json({
      success: true,
      briefing,
    });
  } catch (error) {
    console.error("Error in /api/generate-briefing:", error);
    return NextResponse.json(
      {
        error: "Failed to generate briefing",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

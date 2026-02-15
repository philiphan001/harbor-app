// API endpoint to score a signal's relevance using Judgment Agent

import { NextRequest, NextResponse } from "next/server";
import { scoreSignal } from "@/lib/ai/judgmentAgent";
import { createEmptySituationContext } from "@/lib/types/situationContext";
import { AgentDetection } from "@/lib/types/agents";

export async function POST(request: NextRequest) {
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

    console.log(`Scoring signal: "${signal.title}"`);
    console.log(`   Parent: ${context.profile.name}, ${context.profile.age}, ${context.profile.state}`);

    // Score the signal
    const scored = await scoreSignal(signal, context);

    console.log(`   Score: ${scored.relevanceScore}/100 (${scored.priority})`);
    console.log(`   Reasoning: ${scored.reasoning}`);

    return NextResponse.json({
      success: true,
      scored,
    });
  } catch (error) {
    console.error("Error in /api/score-signal:", error);
    return NextResponse.json(
      {
        error: "Failed to score signal",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

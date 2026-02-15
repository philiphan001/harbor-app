// Briefing Agent - Generates weekly care summaries from scored signals

import Anthropic from "@anthropic-ai/sdk";
import { SituationContext, getSituationSummary } from "@/lib/types/situationContext";
import { ScoredSignal } from "./judgmentAgent";
import { getMonday } from "@/lib/utils/dateUtils";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG, BRIEFING_PROMPT } from "@/lib/config/prompts";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("BriefingAgent");

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

export interface WeeklyBriefing {
  briefingId: string;
  parentId: string;
  parentName: string;
  weekOf: string; // ISO date string (Monday of the week)
  generatedAt: string;
  content: string; // Markdown content
  signalCount: number;
  urgentCount: number;
  importantCount: number;
}

export async function generateWeeklyBriefing(
  context: SituationContext,
  scoredSignals: ScoredSignal[]
): Promise<WeeklyBriefing> {
  try {
    // Filter and organize signals by score
    const urgentSignals = scoredSignals
      .filter((s) => s.relevanceScore >= 85 && s.actionable)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    const importantSignals = scoredSignals
      .filter((s) => s.relevanceScore >= 70 && s.relevanceScore < 85)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    const recommendedSignals = scoredSignals
      .filter((s) => s.relevanceScore >= 50 && s.relevanceScore < 70)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5); // Max 5 recommended items

    // Build signal summaries for Claude
    const urgentSummary = urgentSignals
      .map(
        (s) => `
- ${s.title}
  Score: ${s.relevanceScore}/100
  Reasoning: ${s.reasoning}
  Impact: ${s.estimatedImpact || "N/A"}
  Action: ${s.recommendedAction || "Review and decide"}
  ${s.dueDate ? `Due: ${new Date(s.dueDate).toLocaleDateString()}` : ""}
`
      )
      .join("\n");

    const importantSummary = importantSignals
      .map(
        (s) => `
- ${s.title}
  Score: ${s.relevanceScore}/100
  Reasoning: ${s.reasoning}
  Impact: ${s.estimatedImpact || "N/A"}
`
      )
      .join("\n");

    const recommendedSummary = recommendedSignals
      .map(
        (s) => `
- ${s.title} (Score: ${s.relevanceScore}/100)
`
      )
      .join("\n");

    const situationSummary = getSituationSummary(context);

    const prompt = `${situationSummary}

SIGNALS THIS WEEK:

URGENT (${urgentSignals.length} signals - require action this week):
${urgentSummary || "None"}

IMPORTANT (${importantSignals.length} signals - action within 2-4 weeks):
${importantSummary || "None"}

RECOMMENDED (${recommendedSignals.length} signals - good to know):
${recommendedSummary || "None"}

Generate the weekly briefing following the structure in your instructions.`;

    log.info("Generating briefing", {
      parentName: context.profile.name,
      urgent: urgentSignals.length,
      important: importantSignals.length,
      recommended: recommendedSignals.length
    });

    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.briefing,
      temperature: AI_CONFIG.temperature.briefing,
      system: BRIEFING_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const weekOf = getMonday(new Date()).toISOString();

    const briefing: WeeklyBriefing = {
      briefingId: `brief-${Date.now()}`,
      parentId: context.parentId,
      parentName: context.profile.name,
      weekOf,
      generatedAt: new Date().toISOString(),
      content: textContent.text,
      signalCount: scoredSignals.length,
      urgentCount: urgentSignals.length,
      importantCount: importantSignals.length,
    };

    log.info("Briefing generated", { signalCount: briefing.signalCount });

    return briefing;
  } catch (error) {
    log.errorWithStack("Failed to generate briefing", error);
    throw error;
  }
}

// Briefing Agent - Generates weekly care summaries from scored signals

import Anthropic from "@anthropic-ai/sdk";
import { SituationContext, getSituationSummary, type SituationSummaryExtras } from "@/lib/types/situationContext";
import { ScoredSignal, scoreMultipleSignals } from "./judgmentAgent";
import { getMonday } from "@/lib/utils/dateUtils";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG, BRIEFING_PROMPT } from "@/lib/config/prompts";
import { createLogger } from "@/lib/utils/logger";
import { buildSituationContextFromDb } from "@/lib/db/domainData";
import { getRecentAlertsForBriefing, alertsToDetections } from "@/lib/db/alerts";

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

/**
 * End-to-end briefing generation from a situationId.
 * Builds rich context from DB, fetches recent alerts, scores them, and generates the briefing.
 */
export async function generateBriefingForSituation(
  situationId: string
): Promise<WeeklyBriefing | null> {
  // 1. Build rich context from DB
  const result = await buildSituationContextFromDb(situationId);
  if (!result) {
    log.warn("No context found for situation, skipping briefing", { situationId });
    return null;
  }

  const { context, extras } = result;

  // 2. Get recent alerts and convert to detections
  const alerts = await getRecentAlertsForBriefing(situationId, 7, 30);
  if (alerts.length === 0) {
    log.info("No recent alerts for situation, skipping briefing", { situationId });
    return null;
  }

  const detections = alertsToDetections(alerts);

  // 3. Score all signals
  const scoredSignals = await scoreMultipleSignals(detections, context);

  // 4. Filter to relevant signals (score >= 50)
  const relevantSignals = scoredSignals.filter((s) => s.relevanceScore >= 50);

  if (relevantSignals.length === 0) {
    log.info("No relevant signals after scoring, skipping briefing", { situationId });
    return null;
  }

  // 5. Generate briefing with enriched summary
  return generateWeeklyBriefing(context, relevantSignals, extras);
}

export async function generateWeeklyBriefing(
  context: SituationContext,
  scoredSignals: ScoredSignal[],
  extras?: SituationSummaryExtras
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

    const situationSummary = getSituationSummary(context, extras);

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

// Judgment Agent - Scores signal relevance based on parent's specific context

import Anthropic from "@anthropic-ai/sdk";
import { SituationContext, getSituationSummary } from "@/lib/types/situationContext";
import { AgentDetection } from "@/lib/types/agents";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { type Priority } from "@/lib/constants/domains";
import { AI_CONFIG, JUDGMENT_PROMPT } from "@/lib/config/prompts";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("JudgmentAgent");

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

export interface ScoredSignal extends Omit<AgentDetection, "relevanceScore"> {
  relevanceScore: number; // 0-100
  reasoning: string;
  priority: Priority;
  estimatedImpact?: string;
  recommendedAction?: string;
  scoredAt: string;
}

export async function scoreSignal(
  signal: AgentDetection,
  context: SituationContext
): Promise<ScoredSignal> {
  try {
    const situationSummary = getSituationSummary(context);

    const prompt = `${situationSummary}

SIGNAL TO EVALUATE:
Title: ${signal.title}
Description: ${signal.description}
Domain: ${signal.domain}
Data Source: ${signal.dataSource || "Unknown"}
${signal.dueDate ? `Due Date: ${signal.dueDate}` : ""}
${signal.sourceUrl ? `Source: ${signal.sourceUrl}` : ""}

Evaluate this signal's relevance to the parent's situation above.`;

    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.judgment,
      temperature: AI_CONFIG.temperature.extraction,
      system: JUDGMENT_PROMPT,
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

    // Parse JSON response
    const scored = JSON.parse(textContent.text);

    return {
      ...signal,
      relevanceScore: scored.relevanceScore,
      reasoning: scored.reasoning,
      actionable: scored.actionable,
      priority: scored.priority,
      estimatedImpact: scored.estimatedImpact,
      recommendedAction: scored.recommendedAction,
      scoredAt: new Date().toISOString(),
    };
  } catch (error) {
    log.errorWithStack("Error scoring signal", error);

    // Fallback scoring if Claude fails
    return {
      ...signal,
      relevanceScore: 50,
      reasoning: "Unable to score signal - defaulting to medium relevance",
      actionable: signal.actionable,
      priority: "medium",
      scoredAt: new Date().toISOString(),
    };
  }
}

export async function scoreMultipleSignals(
  signals: AgentDetection[],
  context: SituationContext
): Promise<ScoredSignal[]> {
  // Score signals in parallel for performance
  const scoringPromises = signals.map((signal) => scoreSignal(signal, context));
  return Promise.all(scoringPromises);
}

export function filterSignalsByRelevance(
  signals: ScoredSignal[],
  minScore: number = 70
): ScoredSignal[] {
  return signals.filter((s) => s.relevanceScore >= minScore);
}

export function sortSignalsByRelevance(signals: ScoredSignal[]): ScoredSignal[] {
  return [...signals].sort((a, b) => b.relevanceScore - a.relevanceScore);
}

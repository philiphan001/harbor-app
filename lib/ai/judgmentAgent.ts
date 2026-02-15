// Judgment Agent - Scores signal relevance based on parent's specific context

import Anthropic from "@anthropic-ai/sdk";
import { SituationContext, getSituationSummary } from "@/lib/types/situationContext";
import { AgentDetection } from "@/lib/types/agents";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { type Priority } from "@/lib/constants/domains";

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

const JUDGMENT_PROMPT = `You are a judgment agent evaluating the relevance of elder care signals.

Your job is to score how relevant this signal is to THIS specific parent's situation.

SCORING CRITERIA:
1. **Direct Impact** (40 points): Does this specifically affect THIS parent?
   - Not "seniors in general" - THIS parent with THESE conditions in THIS state
   - Consider their insurance, medications, location, financial situation
   - Generic advice scores low, specific applicability scores high

2. **Urgency** (25 points): Does this require action soon?
   - Has a deadline or expiration?
   - Time-sensitive opportunity or risk?
   - Can wait vs. needs action this week/month?

3. **Financial Impact** (20 points): Money matters
   - Could save money (switch plans, avoid penalties)?
   - Required expense coming up?
   - Affects eligibility for programs?

4. **Risk Mitigation** (15 points): What happens if ignored?
   - Safety risk (medication recall, facility issue)?
   - Legal/compliance risk (missing enrollment period)?
   - Quality of care impact?

SCORING SCALE:
- 85-100: **Critical** - Directly affects parent, action required soon, high impact
- 70-84: **High** - Relevant to situation, should act within 2-4 weeks
- 50-69: **Medium** - Somewhat relevant, good to know, action optional
- 30-49: **Low** - Tangentially relevant, mostly informational
- 0-29: **Noise** - Not relevant to this specific parent

Return ONLY valid JSON in this exact format:
{
  "relevanceScore": 85,
  "reasoning": "Parent is on SilverScript Choice which is increasing $4/month. Open enrollment in 2 weeks - prime time to compare plans. Could save $200-500/year.",
  "actionable": true,
  "priority": "high",
  "estimatedImpact": "Potential savings of $200-500/year",
  "recommendedAction": "Use Medicare Plan Finder during Oct 15-Dec 7 to compare Part D options"
}`;

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
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      temperature: 0.3,
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
    console.error("L Error scoring signal:", error);

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

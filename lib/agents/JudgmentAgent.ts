// Judgment Agent - uses Claude to score signal relevance and filter noise

import Anthropic from "@anthropic-ai/sdk";
import { Signal, SignalWithJudgment } from "@/lib/types/signal";
import { SituationContext, getSituationSummary } from "@/lib/types/situationContext";
import { getAnthropicApiKey } from "@/lib/utils/env";

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

export class JudgmentAgent {
  agentId = "judgment_agent";
  description = "Scores signal relevance and filters noise using AI";

  /**
   * Score a signal's relevance for a specific parent
   * @param signal The signal to evaluate
   * @param context The parent's situation context
   * @returns Signal with judgment scores and reasoning
   */
  async scoreSignal(
    signal: Signal,
    context: SituationContext
  ): Promise<SignalWithJudgment> {
    console.log(`⚖️ [${this.agentId}] Scoring signal: ${signal.title}`);

    try {
      const prompt = this.buildScoringPrompt(signal, context);

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        temperature: 0.3, // Lower temperature for more consistent scoring
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // Extract text response
      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text response from Claude");
      }

      // Parse JSON response
      const judgment = JSON.parse(textBlock.text);

      // Create SignalWithJudgment
      const scoredSignal: SignalWithJudgment = {
        ...signal,
        relevanceScore: judgment.relevanceScore,
        actionable: judgment.actionable,
        priority: judgment.suggestedPriority,
        judgmentReasoning: judgment.reasoning,
        suggestedPriority: judgment.suggestedPriority,
      };

      console.log(
        `✅ [${this.agentId}] Score: ${judgment.relevanceScore}/100 (${judgment.suggestedPriority})`
      );

      return scoredSignal;
    } catch (error) {
      console.error(`❌ [${this.agentId}] Error scoring signal:`, error);

      // Return signal with default low score on error
      return {
        ...signal,
        relevanceScore: 50,
        judgmentReasoning: "Error occurred during scoring - defaulted to medium relevance",
        suggestedPriority: "medium",
      };
    }
  }

  /**
   * Score multiple signals in batch
   */
  async scoreSignals(
    signals: Signal[],
    context: SituationContext
  ): Promise<SignalWithJudgment[]> {
    const scoredSignals: SignalWithJudgment[] = [];

    for (const signal of signals) {
      const scored = await this.scoreSignal(signal, context);
      scoredSignals.push(scored);
    }

    return scoredSignals;
  }

  /**
   * Build scoring prompt for Claude
   */
  private buildScoringPrompt(signal: Signal, context: SituationContext): string {
    const situationSummary = getSituationSummary(context);

    return `You are a judgment agent evaluating the relevance of an elder care signal.

PARENT SITUATION:
${situationSummary}

SIGNAL TO EVALUATE:
Title: ${signal.title}
Description: ${signal.description}
Domain: ${signal.domain}
Detected By: ${signal.agentId}
${signal.expiresAt ? `Deadline: ${new Date(signal.expiresAt).toLocaleDateString()}` : ""}

TASK:
Score this signal's relevance from 0-100 based on:

1. **Specificity** (30 points): How much does this affect THIS specific parent?
   - Generic advice everyone should know = LOW
   - Specific to this parent's situation = HIGH

2. **Urgency** (25 points): Does this require action soon?
   - Far future or no deadline = LOW
   - Deadline within 30 days = HIGH

3. **Impact** (25 points): What's at stake?
   - Minor inconvenience = LOW
   - Health risk, financial loss, or legal issue = HIGH

4. **Actionability** (20 points): Can the user do something about this?
   - Just FYI with no action = LOW
   - Clear action required = HIGH

SCORING GUIDELINES:
- 90-100: Critical and highly personalized (e.g., "Jack's Medicare deadline in 5 days")
- 70-89: Important and relevant (e.g., "Annual checkup needed, Jack has diabetes")
- 50-69: Somewhat relevant but generic (e.g., "Medicare open enrollment starts soon")
- 30-49: Low relevance or far future (e.g., "Plan for long-term care in general")
- 0-29: Not relevant or duplicate information

Return ONLY valid JSON (no markdown, no explanation):
{
  "relevanceScore": 0-100,
  "reasoning": "2-3 sentence explanation of score",
  "actionable": true/false,
  "suggestedPriority": "high" | "medium" | "low"
}`;
  }
}

// Export singleton instance
export const judgmentAgent = new JudgmentAgent();

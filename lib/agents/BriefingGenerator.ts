// Weekly Briefing Generator - synthesizes signals into readable summaries

import Anthropic from "@anthropic-ai/sdk";
import { SignalWithJudgment } from "@/lib/types/signal";
import { SituationContext, getSituationSummary } from "@/lib/types/situationContext";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG } from "@/lib/config/prompts";

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

export interface WeeklyBriefing {
  briefingId: string;
  parentId: string;
  weekOf: string; // ISO date (Monday)
  generatedAt: string;
  content: string; // Markdown
  signalIds: string[];
  read: boolean;
  actions: {
    completed: number;
    total: number;
  };
}

export class BriefingGenerator {
  agentId = "briefing_generator";
  description = "Generates weekly briefings from high-relevance signals";

  /**
   * Generate a weekly briefing from signals
   * @param signals Filtered high-relevance signals
   * @param context Parent's situation context
   * @returns WeeklyBriefing
   */
  async generateBriefing(
    signals: SignalWithJudgment[],
    context: SituationContext
  ): Promise<WeeklyBriefing> {
    console.log(`📋 [${this.agentId}] Generating briefing for ${context.profile.name}...`);

    try {
      const prompt = this.buildBriefingPrompt(signals, context);

      const response = await anthropic.messages.create({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens.chat,
        temperature: AI_CONFIG.temperature.conversation,
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

      const briefingContent = textBlock.text;

      // Count actionable signals
      const actionableCount = signals.filter((s) => s.actionable).length;

      // Get Monday of current week
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);

      const briefing: WeeklyBriefing = {
        briefingId: `briefing_${Date.now()}`,
        parentId: context.parentId,
        weekOf: monday.toISOString().split("T")[0],
        generatedAt: new Date().toISOString(),
        content: briefingContent,
        signalIds: signals.map((s) => s.id),
        read: false,
        actions: {
          completed: 0,
          total: actionableCount,
        },
      };

      console.log(`✅ [${this.agentId}] Briefing generated with ${signals.length} signals`);

      return briefing;
    } catch (error) {
      console.error(`❌ [${this.agentId}] Error generating briefing:`, error);
      throw error;
    }
  }

  /**
   * Build briefing generation prompt for Claude
   */
  private buildBriefingPrompt(
    signals: SignalWithJudgment[],
    context: SituationContext
  ): string {
    const situationSummary = getSituationSummary(context);

    // Group signals by priority
    const highPriority = signals.filter((s) => s.priority === "high");
    const mediumPriority = signals.filter((s) => s.priority === "medium");
    const lowPriority = signals.filter((s) => s.priority === "low");

    // Format signals for prompt
    const formatSignals = (signals: SignalWithJudgment[]) =>
      signals
        .map(
          (s) =>
            `- ${s.title}\n  ${s.description}\n  ${s.actionable ? `Action items: ${s.actionItems?.join(", ") || "Review and decide"}` : "For your awareness"}`
        )
        .join("\n\n");

    return `You are creating a weekly briefing for an adult child caring for their aging parent.

PARENT: ${context.profile.name}, age ${context.profile.age}, ${context.profile.state}

SITUATION CONTEXT:
${situationSummary}

SIGNALS THIS WEEK:

${highPriority.length > 0 ? `HIGH PRIORITY:\n${formatSignals(highPriority)}\n` : ""}
${mediumPriority.length > 0 ? `MEDIUM PRIORITY:\n${formatSignals(mediumPriority)}\n` : ""}
${lowPriority.length > 0 ? `LOW PRIORITY:\n${formatSignals(lowPriority)}\n` : ""}

Create a briefing in this format:

# This Week for ${context.profile.name}

${highPriority.length > 0 ? "## 🔴 Urgent Actions\n[Signals requiring immediate action with clear deadlines - be specific about what to do and when]\n" : ""}

${mediumPriority.length > 0 ? "## ⚠️ Important Updates\n[Significant changes to be aware of - explain why they matter for this specific parent]\n" : ""}

${lowPriority.length > 0 ? "## 📋 Recommended Next Steps\n[Proactive items to address soon - prioritize by impact]\n" : ""}

## 📊 Situation Snapshot

[Brief summary of key metrics and overall status. Be encouraging but realistic. Include:]
- Any concerning trends (health, financial, caregiving)
- Positive developments
- What's stable vs. what needs attention

GUIDELINES:
- Keep tone supportive but direct
- Avoid medical jargon - use plain language
- Be specific about deadlines and actions (e.g., "by December 7" not "soon")
- Focus on the "why it matters" for THIS parent
- Keep each section concise (2-4 bullet points max)
- If no signals in a section, skip that section entirely
- End on a supportive note

Return only the markdown briefing content, no preamble.`;
  }
}

// Export singleton instance
export const briefingGenerator = new BriefingGenerator();

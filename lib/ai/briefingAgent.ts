// Briefing Agent - Generates weekly care summaries from scored signals

import Anthropic from "@anthropic-ai/sdk";
import { SituationContext, getSituationSummary } from "@/lib/types/situationContext";
import { ScoredSignal } from "./judgmentAgent";
import { getMonday } from "@/lib/utils/dateUtils";
import { getAnthropicApiKey } from "@/lib/utils/env";

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

const BRIEFING_PROMPT = `You are creating a weekly care briefing for a family caregiver.

Your goal is to synthesize AI-detected signals into a clear, actionable summary that helps the caregiver stay ahead of their parent's care needs.

STRUCTURE:
Use this exact format:

# This Week for [Parent Name]

## 🔴 Urgent Actions
[Only items requiring action THIS WEEK with clear deadlines. If none, write "No urgent actions this week."]

For each urgent item:
- **[Title]**
  - Why it matters: [Brief explanation]
  - Deadline: [Specific date]
  - Next step: [Clear, specific action]

## ⚠️ Important Updates
[Significant changes to be aware of - action can wait 2-4 weeks. If none, write "No important updates this week."]

For each important item:
- **[Title]**
  - What changed: [Brief explanation]
  - Impact: [How this affects the parent]
  - Consider: [Optional action to consider]

## 📋 Recommended Next Steps
[Proactive items to address when you have time. If none, write "All caught up for now."]

For each recommended item:
- **[Title]** - [One-line description]

## 📊 Situation Snapshot
[Quick overview of key metrics - 2-3 bullet points max]

TONE:
- Supportive but direct
- Avoid medical jargon - use plain language
- Be specific about what to do and why it matters
- Focus on actionable next steps, not just information
- Acknowledge the emotional weight of caregiving

IMPORTANT:
- Only include signals that are truly relevant (scored 70+)
- Don't overwhelm - prioritize ruthlessly
- If something scored high (85+), it goes in Urgent
- If something scored medium-high (70-84), it goes in Important
- Keep the briefing scannable - busy caregivers need quick reads`;

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

    console.log(`Generating briefing for ${context.profile.name}`);
    console.log(`   Urgent: ${urgentSignals.length}, Important: ${importantSignals.length}, Recommended: ${recommendedSignals.length}`);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      temperature: 0.5,
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

    console.log(`Briefing generated: ${briefing.signalCount} signals processed`);

    return briefing;
  } catch (error) {
    console.error("Error generating briefing:", error);
    throw error;
  }
}

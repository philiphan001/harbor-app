import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Answer, DOMAIN_QUESTIONS } from "@/lib/types/readiness";
import { Domain } from "@/components/DomainProgress";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG, TASK_GENERATION_PROMPT } from "@/lib/config/prompts";
import { applyRateLimit, AI_EXTRACTION_LIMIT } from "@/lib/utils/rateLimit";
import { createLogger } from "@/lib/utils/logger";
import { requireAuth } from "@/lib/supabase/auth";

const log = createLogger("api/readiness-tasks");

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "generate-readiness-tasks", AI_EXTRACTION_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { domain, answers, parentProfile, existingTasks } = body as {
      domain: Domain;
      answers: Answer[];
      parentProfile?: { name?: string; age?: number; state?: string };
      existingTasks?: string[];
    };

    log.info("Generating readiness tasks", { domain, answerCount: answers.length });

    // Get the questions for this domain
    const domainData = DOMAIN_QUESTIONS.find((d) => d.domain === domain);
    if (!domainData) {
      return NextResponse.json({ tasks: [], count: 0 });
    }

    // Build context for Claude — include captured data
    const answerSummary = domainData.questions
      .map((q) => {
        const answer = answers.find((a) => a.questionId === q.id);
        if (!answer) return `Q: ${q.text}\nA: [Not answered]`;
        if (answer.isUncertain) return `Q: ${q.text}\nA: I don't know / Not certain`;

        let line = `Q: ${q.text}\nA: ${answer.selectedOption}`;

        // Include captured data if present
        if (answer.capturedData && Object.keys(answer.capturedData).length > 0) {
          const dataEntries = Object.entries(answer.capturedData)
            .map(([key, val]) => `  ${key}: ${val}`)
            .join("\n");
          line += `\n[Data already captured in Harbor:\n${dataEntries}]`;
        }

        return line;
      })
      .join("\n\n");

    const contextInfo = parentProfile?.name
      ? `User is assessing readiness for ${parentProfile.name}${parentProfile.age ? ` (age ${parentProfile.age})` : ""}${parentProfile.state ? ` in ${parentProfile.state}` : ""}.`
      : "User is assessing care readiness for their parent.";

    const existingTasksBlock = existingTasks && existingTasks.length > 0
      ? `\n\nEXISTING TASKS (do not duplicate these):\n${existingTasks.map(t => `- ${t}`).join("\n")}`
      : "";

    const prompt = `${contextInfo}

Domain: ${domainData.title}

User's answers:
${answerSummary}
${existingTasksBlock}

Generate actionable tasks based on these answers. For questions where the user already captured data in Harbor, you can reduce the priority of data-capture tasks (they're partially done). Focus gap tasks on things that are missing, uncertain, or incomplete. Return only the JSON array.`;

    // Call Claude to generate tasks
    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.extraction,
      system: TASK_GENERATION_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: AI_CONFIG.temperature.conversation,
    });

    const responseText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    log.debug("Claude response received", { preview: responseText.substring(0, 200) });

    // Parse the JSON response
    let tasks: Array<{ title: string; priority: string; domain: string; why: string; suggestedActions: string[] }> = [];
    try {
      // Try to extract JSON from the response (in case Claude adds markdown)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0]);
      } else {
        tasks = JSON.parse(responseText);
      }
    } catch (parseError) {
      log.error("Failed to parse JSON response", { error: String(parseError) });
      return NextResponse.json({ tasks: [], count: 0, error: "Failed to parse tasks" });
    }

    log.info("Tasks generated", { count: tasks.length, domain });

    return NextResponse.json({
      tasks,
      count: tasks.length,
      domain,
    });
  } catch (error) {
    log.errorWithStack("Failed to generate readiness tasks", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to generate tasks", detail: errorMessage, tasks: [], count: 0 },
      { status: 500 }
    );
  }
}

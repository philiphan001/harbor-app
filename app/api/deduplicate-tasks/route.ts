import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG } from "@/lib/config/prompts";
import { applyRateLimit, AI_EXTRACTION_LIMIT } from "@/lib/utils/rateLimit";
import { createLogger } from "@/lib/utils/logger";
import { requireAuth } from "@/lib/supabase/auth";

const log = createLogger("api/deduplicate-tasks");

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

interface TaskInput {
  title: string;
  domain: string;
  priority: string;
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "deduplicate-tasks", AI_EXTRACTION_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { tasks } = body as { tasks: TaskInput[] };

    if (!Array.isArray(tasks) || tasks.length < 2) {
      return NextResponse.json({ removeTitles: [] });
    }

    log.info("Starting task deduplication", { taskCount: tasks.length });

    const taskList = tasks
      .map((t, i) => `${i}. [${t.domain}/${t.priority}] ${t.title}`)
      .join("\n");

    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: 1024,
      system: `You are a deduplication assistant. Given a numbered list of tasks, identify duplicates or near-duplicates (same intent, different wording). For each duplicate group, keep the better-worded version and mark the others for removal. Return ONLY a JSON array of the exact titles to remove. If there are no duplicates, return an empty array [].`,
      messages: [
        {
          role: "user",
          content: `Identify duplicate or near-duplicate tasks in this list. Return a JSON array of the exact titles to remove (keeping the better-worded version of each duplicate group).\n\n${taskList}`,
        },
      ],
      temperature: 0,
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    log.debug("Dedup response received", { response: responseText });

    let removeTitles: string[] = [];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        removeTitles = JSON.parse(jsonMatch[0]);
      } else if (responseText.trim().startsWith("[")) {
        removeTitles = JSON.parse(responseText);
      }
    } catch (parseError) {
      log.error("Failed to parse dedup response", { error: String(parseError) });
      removeTitles = [];
    }

    // Validate that returned titles actually exist in the input
    const validTitles = new Set(tasks.map((t) => t.title));
    removeTitles = removeTitles.filter((t) => validTitles.has(t));

    log.info("Deduplication complete", {
      inputCount: tasks.length,
      removingCount: removeTitles.length,
    });

    return NextResponse.json({ removeTitles });
  } catch (error) {
    log.errorWithStack("Failed to deduplicate tasks", error);
    return NextResponse.json(
      {
        error: "Failed to deduplicate tasks",
        details: error instanceof Error ? error.message : "Unknown error",
        removeTitles: [],
      },
      { status: 500 }
    );
  }
}

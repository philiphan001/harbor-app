import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG, TASK_EXTRACTION_PROMPT } from "@/lib/config/prompts";
import { applyRateLimit, AI_EXTRACTION_LIMIT } from "@/lib/utils/rateLimit";
import { createLogger } from "@/lib/utils/logger";
import { requireAuth } from "@/lib/supabase/auth";

const log = createLogger("api/extract-tasks");

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TaskInput {
  title: string;
  why: string;
  priority: "high" | "medium" | "low";
  domain: "medical" | "financial" | "legal" | "housing" | "family" | "caregiving";
  suggestedActions: string[];
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "extract-tasks", AI_EXTRACTION_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { message, history, existingTasks } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    log.info("Starting task extraction");

    // Build conversation context
    const existingTasksContext = Array.isArray(existingTasks) && existingTasks.length > 0
      ? `\n\nEXISTING TASKS ALREADY CREATED (do not create duplicates):\n${existingTasks.map((t: string) => `- ${t}`).join("\n")}`
      : "";

    const conversationHistory: Message[] = [
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: message + existingTasksContext },
    ];

    // Use structured output to extract tasks as JSON
    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.extraction,
      system: TASK_EXTRACTION_PROMPT,
      messages: conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    log.debug("Raw response received", { response: responseText });

    // Parse JSON response
    let tasks: TaskInput[] = [];
    try {
      // Try to extract JSON from response (handles cases where Claude adds explanation)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0]);
      } else if (responseText.trim().startsWith("[")) {
        tasks = JSON.parse(responseText);
      } else {
        log.warn("No JSON array found in response");
        tasks = [];
      }
    } catch (parseError) {
      log.error("Failed to parse JSON response", { error: String(parseError) });
      tasks = [];
    }

    log.info("Tasks extracted", { count: tasks.length });

    return NextResponse.json({
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    log.errorWithStack("Failed to extract tasks", error);
    return NextResponse.json(
      {
        error: "Failed to extract tasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

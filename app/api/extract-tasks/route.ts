import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG, TASK_EXTRACTION_PROMPT } from "@/lib/config/prompts";
import { applyRateLimit, AI_EXTRACTION_LIMIT } from "@/lib/utils/rateLimit";

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

  try {
    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("🔍 [Extract] Starting task extraction...");

    // Build conversation context
    const conversationHistory: Message[] = [
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: message },
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

    console.log("📄 [Extract] Raw response:", responseText);

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
        console.log("⚠️ [Extract] No JSON array found in response");
        tasks = [];
      }
    } catch (parseError) {
      console.error("❌ [Extract] Failed to parse JSON:", parseError);
      console.log("Response was:", responseText);
      tasks = [];
    }

    console.log(`✅ [Extract] Extracted ${tasks.length} tasks`);

    return NextResponse.json({
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error("❌ [Extract] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to extract tasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

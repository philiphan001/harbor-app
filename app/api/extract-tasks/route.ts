import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Task extraction prompt - focused solely on extracting actionable tasks
const TASK_EXTRACTION_PROMPT = `You are a task extraction agent for Harbor, an AI elder care navigator.

Your role is to analyze a conversation between a user and Harbor's crisis intake agent, and extract actionable tasks that the user needs to complete.

EXTRACTION RULES:

1. CONSOLIDATE RELATED TASKS:
   - ❌ DON'T: "Get doctor's name", "Get doctor's phone", "Get doctor's address"
   - ✅ DO: "Get primary care doctor contact information (name, phone, office address)"

2. PRIORITIZE REALISTICALLY:
   - HIGH: Needed in next 24-48 hours (hospital discharge, immediate safety, urgent appointments)
   - MEDIUM: Important this week (legal documents, insurance verification, care planning)
   - LOW: Can wait 2-4 weeks (long-term housing, estate planning, preventive care)

3. LIMIT HIGH PRIORITY TASKS to 5-8 maximum
   - Most legal/financial tasks are MEDIUM or LOW unless there's an immediate deadline

4. PROVIDE CLEAR, ACTIONABLE TITLES:
   - Each task should be something the user can DO
   - Include context in the title itself
   - Example: "Contact hospital discharge planner about post-surgery care plan"

5. EXPLAIN THE "WHY":
   - Every task needs a clear reason explaining its importance
   - Connect it to the parent's situation
   - Example: "This ensures your father has proper care when he returns home after hip surgery"

6. SUGGEST 2-4 CONCRETE ACTIONS:
   - Break down HOW to complete the task
   - Be specific with who to call, what to ask, what to bring
   - Example: "Call main hospital line, ask for discharge planning, request meeting before release"

7. ASSIGN CORRECT DOMAIN:
   - medical: Healthcare, medications, doctors, hospital
   - financial: Insurance, bills, Medicare, expenses
   - legal: POA, advance directives, guardianship, estate
   - housing: Home modifications, assisted living, nursing homes
   - family: Communication, roles, emotional support
   - caregiving: Daily care tasks, respite, caregiver support

OUTPUT FORMAT:
Return a JSON array of tasks. Each task must have:
{
  "title": "Clear, actionable task title",
  "why": "Why this task matters for the parent's situation",
  "priority": "high" | "medium" | "low",
  "domain": "medical" | "financial" | "legal" | "housing" | "family" | "caregiving",
  "suggestedActions": ["Action 1", "Action 2", "Action 3"]
}

IMPORTANT:
- Only extract tasks from the LATEST message in the conversation
- Don't repeat tasks that have already been created in previous turns
- If there are no new actionable tasks in this turn, return an empty array: []
- Focus on what's NEW in this conversation turn
`;

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
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
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

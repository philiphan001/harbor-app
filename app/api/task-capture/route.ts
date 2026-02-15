import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Task } from "@/lib/ai/claude";
import { getAnthropicApiKey } from "@/lib/utils/env";
import type { AnthropicToolDefinition } from "@/lib/types/taskCapture";
import { AI_CONFIG, getTaskCapturePrompt } from "@/lib/config/prompts";
import { applyRateLimit, AI_CHAT_LIMIT } from "@/lib/utils/rateLimit";

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

// Define data extraction tools based on task domain
const getExtractionTools = (task: Task): AnthropicToolDefinition[] => {
  const tools: AnthropicToolDefinition[] = [];

  if (task.domain === "medical") {
    // Medical information extraction
    if (task.title.toLowerCase().includes("doctor") || task.title.toLowerCase().includes("physician")) {
      tools.push({
        name: "save_doctor_info",
        description: "Save primary care doctor contact information",
        input_schema: {
          type: "object" as const,
          properties: {
            name: { type: "string", description: "Doctor's full name" },
            phone: { type: "string", description: "Office phone number" },
            address: { type: "string", description: "Office address (optional)" },
            specialty: { type: "string", description: "Medical specialty (optional)" },
          },
          required: ["name", "phone"],
        },
      });
    }

    if (task.title.toLowerCase().includes("medication")) {
      tools.push({
        name: "save_medication_list",
        description: "Save medication information",
        input_schema: {
          type: "object" as const,
          properties: {
            medications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Medication name" },
                  dosage: { type: "string", description: "Dosage (e.g., '10mg')" },
                  frequency: { type: "string", description: "How often taken (e.g., 'twice daily')" },
                  purpose: { type: "string", description: "What it's for (optional)" },
                },
                required: ["name", "dosage", "frequency"],
              },
            },
          },
          required: ["medications"],
        },
      });
    }

    if (task.title.toLowerCase().includes("insurance")) {
      tools.push({
        name: "save_insurance_info",
        description: "Save health insurance information",
        input_schema: {
          type: "object" as const,
          properties: {
            provider: { type: "string", description: "Insurance company name" },
            policyNumber: { type: "string", description: "Policy or member ID number" },
            groupNumber: { type: "string", description: "Group number (optional)" },
            phone: { type: "string", description: "Customer service phone number" },
          },
          required: ["provider", "policyNumber"],
        },
      });
    }
  }

  if (task.domain === "legal") {
    if (task.title.toLowerCase().includes("proxy") || task.title.toLowerCase().includes("poa")) {
      tools.push({
        name: "save_legal_document_info",
        description: "Save legal document information",
        input_schema: {
          type: "object" as const,
          properties: {
            documentType: { type: "string", description: "Type of document (e.g., 'Healthcare Proxy', 'Power of Attorney')" },
            status: { type: "string", description: "Status (e.g., 'completed', 'in progress', 'not started')" },
            agent: { type: "string", description: "Person named as agent/proxy (optional)" },
            location: { type: "string", description: "Where document is stored (optional)" },
            dateCompleted: { type: "string", description: "Date completed (optional)" },
          },
          required: ["documentType", "status"],
        },
      });
    }
  }

  // Generic capture for any task
  tools.push({
    name: "save_task_notes",
    description: "Save general notes or information about this task",
    input_schema: {
      type: "object" as const,
      properties: {
        notes: { type: "string", description: "Information gathered about this task" },
        complete: { type: "boolean", description: "Whether the task information gathering is complete" },
      },
      required: ["notes"],
    },
  });

  return tools;
};

// System prompt for task-specific data capture (uses centralized prompt config)
const getSystemPrompt = (task: Task, parentName?: string) =>
  getTaskCapturePrompt(task.title, task.domain, task.why, parentName);

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "task-capture", AI_CHAT_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { task, messages, userContext } = body as {
      task: Task;
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      userContext?: { parentState?: string; parentName?: string };
    };

    if (!task || !messages) {
      return NextResponse.json(
        { error: "Task and messages are required" },
        { status: 400 }
      );
    }

    const tools = getExtractionTools(task);
    const systemPrompt = getSystemPrompt(task, userContext?.parentName);

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Call Claude with extraction tools
    let response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.taskCapture,
      system: systemPrompt,
      messages: anthropicMessages,
      tools,
      temperature: AI_CONFIG.temperature.conversation,
    });

    // Extract response
    let messageText = "";
    let extractedData: { toolName: string; data: Record<string, unknown> } | null = null;
    let complete = false;

    // Handle tool use loop (same as main chat)
    let maxContinuations = 3;
    let continuationCount = 0;
    let continueMessages: Anthropic.Messages.MessageParam[] = [...anthropicMessages];
    const allResponses = [response];

    while (response.stop_reason === "tool_use" && continuationCount < maxContinuations) {
      console.log(`🔄 Task capture - tool use detected (attempt ${continuationCount + 1})`);

      const toolResults = response.content
        .filter((block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use")
        .map(block => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: "Information saved successfully. Continue the conversation.",
        }));

      continueMessages = [
        ...continueMessages,
        { role: "assistant" as const, content: response.content },
        { role: "user" as const, content: toolResults }
      ];

      const continueResponse = await anthropic.messages.create({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens.taskCapture,
        system: systemPrompt,
        messages: continueMessages,
        tools,
        temperature: AI_CONFIG.temperature.conversation,
      });

      allResponses.push(continueResponse);
      response = continueResponse;
      continuationCount++;
    }

    // Extract from all responses
    for (const resp of allResponses) {
      for (const block of resp.content) {
        if (block.type === "text") {
          messageText += block.text;
        } else if (block.type === "tool_use") {
          // Extract data from tool use
          console.log("📋 Task data captured:", block.name, block.input);
          extractedData = {
            ...(extractedData || {}),
            toolName: block.name,
            data: block.input as Record<string, unknown>,
          };
        }
      }
    }

    // Check if conversation is complete (look for completion indicators)
    const completionPhrases = ["that's it", "nothing else", "that's all", "saved", "✓"];
    complete = completionPhrases.some(phrase => messageText.toLowerCase().includes(phrase));

    return NextResponse.json({
      message: messageText,
      complete,
      extractedData,
    });
  } catch (error) {
    console.error("Task capture API error:", error);
    return NextResponse.json(
      { error: "Failed to process task capture" },
      { status: 500 }
    );
  }
}

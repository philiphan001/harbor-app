import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Task } from "@/lib/ai/claude";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Define data extraction tools based on task domain
const getExtractionTools = (task: Task) => {
  const tools: any[] = [];

  if (task.domain === "medical") {
    // Medical information extraction
    if (task.title.toLowerCase().includes("doctor") || task.title.toLowerCase().includes("physician")) {
      tools.push({
        name: "save_doctor_info",
        description: "Save primary care doctor contact information",
        input_schema: {
          type: "object",
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
          type: "object",
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
          type: "object",
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
          type: "object",
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
      type: "object",
      properties: {
        notes: { type: "string", description: "Information gathered about this task" },
        complete: { type: "boolean", description: "Whether the task information gathering is complete" },
      },
      required: ["notes"],
    },
  });

  return tools;
};

// System prompt for task-specific data capture
const getSystemPrompt = (task: Task, parentName?: string) => {
  return `You are Harbor, helping someone gather information about: "${task.title}"

Your goal is to have a brief, natural conversation to extract the specific information needed for this task, then save it using the appropriate tool.

CRITICAL GUIDELINES:
- Keep responses SHORT and conversational (2-3 sentences max)
- Ask ONE specific follow-up question at a time
- When you have enough information, use the appropriate save tool
- After using a save tool, confirm what you saved and ask if there's anything else
- If user says "that's it" or "nothing else", thank them and mark as complete

TASK CONTEXT:
- Domain: ${task.domain}
- Why this matters: ${task.why}
${parentName ? `- Parent's name: ${parentName}` : ""}

EXAMPLE FLOW:
User: "His doctor is Dr. Smith"
You: "Got it — Dr. Smith. Do you have the office phone number?"
User: "555-1234"
You: [uses save_doctor_info tool] "Perfect! I've saved Dr. Smith at 555-1234. Anything else about his doctor?"
User: "No that's it"
You: "Great! This information is now saved. ✓"

Keep it brief, natural, and focused on extracting the specific data points.`;
};

export async function POST(request: NextRequest) {
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
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
      tools,
      temperature: 0.7,
    });

    // Extract response
    let messageText = "";
    let extractedData: any = null;
    let complete = false;

    // Handle tool use loop (same as main chat)
    let maxContinuations = 3;
    let continuationCount = 0;
    let continueMessages = [...anthropicMessages];
    const allResponses = [response];

    while (response.stop_reason === "tool_use" && continuationCount < maxContinuations) {
      console.log(`🔄 Task capture - tool use detected (attempt ${continuationCount + 1})`);

      const toolResults = response.content
        .filter(block => block.type === "tool_use")
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
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: continueMessages,
        tools,
        temperature: 0.7,
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
            data: block.input,
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

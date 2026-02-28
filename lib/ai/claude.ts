import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@/lib/types/situation";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { type ExtendedDomain, type Priority } from "@/lib/constants/domains";
import type { ChatResponse, ClaudeResponseMetadata, TaskDataPayload } from "@/lib/types/taskCapture";
import { AI_CONFIG, CRISIS_INTAKE_PROMPT, READINESS_PROMPT } from "@/lib/config/prompts";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("Chat");

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

// Task type for extraction
export interface Task {
  title: string;
  priority: Priority;
  domain: ExtendedDomain;
  why: string;
  suggestedActions: string[];
  completedAt?: string; // ISO timestamp when marked complete
  recurrence?: {
    frequency: "monthly" | "quarterly" | "semi-annual" | "annual";
    nextDueDate?: string; // ISO date string
  };
  checklist?: Array<{
    id: string;
    label: string;
    completed: boolean;
    linkTo?: string; // optional URL to a guided page
  }>;
}

// Parent profile information extraction
export interface ParentProfileData {
  name?: string;
  age?: number;
  state?: string;
  livingArrangement?: string;
}

// Note: Task extraction now uses Anthropic's Tool Use feature
// Old marker-based and intelligent extraction methods removed

// Define the task creation tool for Claude
const taskCreationTool = {
  name: "create_action_item",
  description: "Create an action item when the user reveals they don't know something, haven't done something, or identifies a gap in their care planning. Use this EVERY TIME you identify a gap.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string",
        description: "Brief, action-oriented title for the task (e.g., 'Get contact info for Mom's primary care doctor')"
      },
      priority: {
        type: "string",
        enum: ["high", "medium", "low"],
        description: "Priority level: high for urgent/time-sensitive, medium for important but not urgent, low for nice-to-have"
      },
      domain: {
        type: "string",
        enum: ["medical", "financial", "legal", "housing", "family", "caregiving"],
        description: "Which domain this task belongs to"
      },
      why: {
        type: "string",
        description: "One sentence explaining why this task matters (e.g., 'You'll need this for medical coordination in an emergency')"
      },
      suggestedActions: {
        type: "array",
        items: { type: "string" },
        description: "3-5 specific, actionable steps to complete this task"
      },
      checklist: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique ID for this checklist item (e.g., 'step-1')" },
            label: { type: "string", description: "Short description of the step" },
            completed: { type: "boolean", description: "Whether this step is done (default false)" },
            linkTo: { type: "string", description: "Optional URL to a guided page (e.g., '/power-of-attorney')" }
          },
          required: ["id", "label", "completed"]
        },
        description: "Optional checklist of sub-steps for this task"
      }
    },
    required: ["title", "priority", "domain", "why", "suggestedActions"]
  }
};


export async function chat(
  messages: Message[],
  mode: "crisis" | "readiness",
  options?: { useTools?: boolean } // NEW: Option to disable tools for continuous extraction
): Promise<ChatResponse> {
  const systemPrompt =
    mode === "crisis" ? CRISIS_INTAKE_PROMPT : READINESS_PROMPT;

  // Convert our Message format to Anthropic's format
  const anthropicMessages = messages.map((msg) => ({
    role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
    content: msg.content,
  }));

  const useTools = options?.useTools ?? false; // Default to NO TOOLS (continuous extraction mode)

  try {
    // If tools are disabled, just return the conversation response (no continuation loops)
    if (!useTools) {
      log.info("Running in conversation-only mode (no tools)");

      const response = await anthropic.messages.create({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens.chat,
        system: systemPrompt,
        messages: anthropicMessages,
        temperature: AI_CONFIG.temperature.conversation,
        // NO TOOLS - just conversation
      });

      const messageText = response.content
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("");

      log.info("Conversation response (no tools)", { length: messageText.length });

      return {
        message: messageText,
        complete: false,
        extractedData: {},
        parentProfile: undefined,
        metadata: {
          model: response.model,
          usage: response.usage,
        },
      };
    }

    // LEGACY: Tool-based mode (with continuation loops)
    log.info("Running in tool-based mode (with task creation)");

    let response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.chat,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: [taskCreationTool], // Only task tool - profile extraction via text is more reliable
      temperature: AI_CONFIG.temperature.conversation,
    });

    // Extract message text and tool calls
    let messageText = "";
    const tasks: Task[] = [];
    let parentProfile: ParentProfileData | undefined;
    const allResponses = [response]; // Track all responses for merging

    // Keep continuing while Claude uses tools (loop until we get actual conversation)
    let continueMessages: Anthropic.Messages.MessageParam[] = [...anthropicMessages];
    let maxContinuations = 10; // Increased from 5 to allow more task generation
    let continuationCount = 0;
    const seenTaskTitles = new Set<string>(); // Track created tasks to prevent duplicates

    while (response.stop_reason === "tool_use" && continuationCount < maxContinuations) {
      log.debug("Tool use continuation", { attempt: continuationCount + 1 });

      // Build tool results for all tool calls
      const toolResults = response.content
        .filter((block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use")
        .map(block => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: "Task saved successfully. Please continue with the next question."
        }));

      // Continue the conversation with tool results
      continueMessages = [
        ...continueMessages,
        { role: "assistant" as const, content: response.content },
        { role: "user" as const, content: toolResults }
      ];

      const continueResponse = await anthropic.messages.create({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens.chat,
        system: systemPrompt,
        messages: continueMessages,
        tools: [taskCreationTool],
        temperature: AI_CONFIG.temperature.conversation,
      });

      allResponses.push(continueResponse);
      response = continueResponse;
      continuationCount++;
    }

    if (continuationCount >= maxContinuations) {
      log.warn("Reached max tool use continuations", { maxContinuations });
    }

    // Extract from ALL responses (both initial tool call and continuation)
    for (const resp of allResponses) {
      for (const block of resp.content) {
      if (block.type === "text") {
        messageText += block.text;
      } else if (block.type === "tool_use" && block.name === "create_action_item") {
        // Extract task from tool use
        const taskInput = block.input as Record<string, unknown>;

        // Check for duplicate - normalize title for comparison
        const normalizedTitle = (taskInput.title as string).toLowerCase().trim();

        // Check if we've seen a very similar task
        let isDuplicate = false;
        for (const seenTitle of seenTaskTitles) {
          // Simple similarity check - if titles share most words, consider duplicate
          const seenWords = seenTitle.split(' ');
          const newWords = normalizedTitle.split(' ');
          const commonWords = seenWords.filter(word => newWords.includes(word) && word.length > 3);

          if (commonWords.length >= Math.min(seenWords.length, newWords.length) * 0.6) {
            isDuplicate = true;
            log.debug("Skipping duplicate task", { title: taskInput.title as string });
            break;
          }
        }

        if (!isDuplicate) {
          log.info("Task extracted via tool use", { title: taskInput.title as string, domain: taskInput.domain as string });
          tasks.push({
            title: taskInput.title as string,
            priority: taskInput.priority as Priority,
            domain: taskInput.domain as ExtendedDomain,
            why: taskInput.why as string,
            suggestedActions: taskInput.suggestedActions as string[],
          });
          seenTaskTitles.add(normalizedTitle);
        }
      }
      }
    }

    log.debug("Response complete", { length: messageText.length, tasks: tasks.length, stopReason: response.stop_reason ?? "unknown" });

    // TODO: Add logic to detect when intake is complete
    // For now, we'll mark it as incomplete unless explicitly stated
    const complete = false;
    const extractedData = {};

    return {
      message: messageText,
      complete,
      extractedData,
      tasks: tasks.length > 0 ? tasks : undefined,
      parentProfile,
      metadata: {
        model: response.model,
        usage: response.usage,
      },
    };
  } catch (error) {
    log.errorWithStack("Claude API error", error);
    throw new Error("Failed to get response from AI");
  }
}

/** Domain score breakdown */
interface DomainScores {
  medical: number;
  financial: number;
  legal: number;
  housing: number;
  family: number;
}

/** Readiness score result */
interface ReadinessScoreResult {
  overall: number;
  byDomain: DomainScores;
  gaps: string[];
}

export async function generateScenarios(situationModel: Record<string, unknown>): Promise<Record<string, unknown>[]> {
  // TODO: Implement scenario generation
  // This will use a specialized prompt to generate care pathway scenarios
  // based on the complete situation model
  return [];
}

export async function calculateReadinessScore(
  assessmentData: Record<string, unknown>
): Promise<ReadinessScoreResult> {
  // TODO: Implement readiness score calculation
  // This will analyze the assessment responses and calculate scores
  // across all 5 domains
  return {
    overall: 0,
    byDomain: {
      medical: 0,
      financial: 0,
      legal: 0,
      housing: 0,
      family: 0,
    },
    gaps: [],
  };
}

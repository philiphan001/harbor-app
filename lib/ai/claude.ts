import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@/lib/types/situation";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { type ExtendedDomain, type Priority } from "@/lib/constants/domains";

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

// System prompts from harbor-spec.md

const CRISIS_INTAKE_PROMPT = `You are Harbor, an AI elder care navigator helping a family through an acute care crisis. Your tone is calm, warm, structured, and competent — like the best emergency room social worker someone has ever met.

CRITICAL GUIDELINES:
- Open with empathy before asking questions: "First, take a breath. You're doing the right thing by reaching out."
- Ask one question at a time. Never overwhelm with multiple questions.
- After each answer, briefly acknowledge what they've shared before moving on.
- If they express distress, pause and validate: "That sounds incredibly stressful. Let's take this one step at a time."
- Use plain language. Never use jargon without explaining it.
- Be honest about what you don't know: "I'm not sure about that yet — let's add it to the list of things we need to find out."
- Never provide medical advice. Frame as: "Your doctor would be the best person to answer that. What I can help with is..."
- Progressively build the Situation Model from the conversation.
- Flag urgent gaps immediately: "We should find out about the healthcare proxy as soon as possible — here's why it matters right now."

CAPTURING INFORMATION:
When the user says they KNOW something (e.g., "Yes, I know her primary doctor"), always ask for the details with an easy out:
- "Great! What's their name and phone number? (Or just say 'later' and I'll add it to your follow-up list.)"
- If they provide details: acknowledge and continue
- If they say "later" or "I don't have it handy": create an action item using the tool and move on

ACTION ITEM TRACKING:
When the user reveals they don't know something or haven't done something, naturally acknowledge it and mention you'll note it for follow-up.

Keep acknowledgments brief and conversational:
- "Got it — I'll note that for your follow-up list."
- "That's completely normal. I'll add that to your action items."
- "I'll make sure that's on your list to address."

Then immediately continue the conversation with the next question. The conversation should flow naturally without dwelling on the task creation.

INFORMATION CAPTURE:
When you learn the parent's name and age, naturally incorporate it into your response using the pattern "Name at Age".
For example: "Thanks! Jack at 90 — that's wonderful that you're thinking ahead."
This helps confirm you heard correctly and builds rapport. Always use this exact pattern so the system can capture the information.

REVISED INTAKE SEQUENCE (USER-DIRECTED):

Phase 1: IMMEDIATE TRIAGE (Fixed - Always First, Keep to 4-5 Questions Max)
1. What happened and when?
2. Parent's name, age, state
3. Where is parent now? (Hospital/ER/Home/Other)
4. Is parent safe and stable right now?

Phase 2: USER PRIORITY (New - Let Them Drive)
After triage, ask: "I've captured the immediate situation. What's most urgent for you right now?"

Then offer options:
"You can ask me about:
- Medical coordination (doctors, medications, hospital discharge)
- Insurance & costs (coverage, bills, Medicare/Medicaid)
- Legal documents (healthcare proxy, power of attorney)
- Family coordination (who to notify, decision-making)
- Next 24-48 hours (what to do immediately)

Or just say 'I'm not sure' and I'll guide you through the essentials."

Phase 3: ADDRESS USER'S PRIORITY FIRST
- Dive deep into whatever they ask about
- Create consolidated tasks for that domain
- When done, ask: "What else is on your mind? Or should I flag the other areas you'll need to address soon?"

Phase 4: COMPREHENSIVE TASK GENERATION
Regardless of conversation path, generate tasks for ALL domains at the end, but prioritize:
- HIGH: What user asked about + time-sensitive items (discharge, immediate medical needs)
- MEDIUM: Important but not urgent (legal docs, full insurance review)
- LOW: Can wait until crisis stabilizes (long-term financial planning, family dynamics)

Your goal is to be responsive to their immediate concerns while ensuring nothing critical falls through the cracks.`;

const READINESS_PROMPT = `You are Harbor, helping someone assess their preparedness for their aging parent's care needs. Your tone is encouraging, educational, and practical — like a knowledgeable friend who's been through this before.

CRITICAL GUIDELINES:
- Frame this as empowering, not frightening: "Most families discover gaps they didn't know about. That's exactly why this assessment exists."
- Celebrate what they DO have: "Great — having the healthcare proxy in place is really important. You're ahead of most families there."
- For gaps, explain WHY each item matters with a concrete scenario.
- Use their parent's actual situation to make it real: "Since your mom lives alone in a two-story house, the home safety assessment is especially important."
- At the end, generate the Readiness Score and prioritized action list.
- The first recommended action should be achievable in under 30 minutes to create momentum.

ASSESSMENT STRUCTURE - SHOW THE ROADMAP UPFRONT:
Start with: "I'll help you assess your readiness across 4 key areas:

1. **Medical Readiness** - Healthcare providers, medications, insurance, advance directives
2. **Legal Readiness** - Powers of attorney, wills, estate planning
3. **Financial Readiness** - Income, expenses, insurance, long-term care funding
4. **Housing Readiness** - Current living situation and future planning

This usually takes 10-15 minutes. We'll go through each domain together, and I'll identify any gaps we should address.

First, let's start with your parent's basic information..."

Then proceed conversationally through each domain.

CAPTURING INFORMATION:
When the user says they HAVE something (e.g., "Yes, we have a healthcare proxy"), ask for specifics with an easy out:
- "Excellent! Who is named as the proxy? (Or say 'later' if you want to add those details to your action items.)"
- If they provide details: acknowledge and continue
- If they say "later" or "I don't have it handy": note it for follow-up and move on

ACTION ITEM TRACKING:
When you identify a gap (something Missing or Partial), briefly acknowledge it and mention you're noting it for follow-up.

Keep acknowledgments brief:
- "I'll note that for your action items."
- "That's something we'll want to address — I'll add it to your list."
- "Got it — I'll make sure that's on your follow-up list."

Then immediately ask the next assessment question. Keep the conversation flowing naturally.

INFORMATION CAPTURE:
When you learn the parent's name and age, naturally incorporate it into your response using the pattern "Name at Age".
For example: "Great! Mary at 82 — that's wonderful that you're being proactive."
This helps confirm you heard correctly and builds rapport. Always use this exact pattern so the system can capture the information.

ASSESSMENT DOMAINS (Cover systematically):
1. **Medical Readiness** - Primary care physician, current medications, chronic conditions, medical records access, Medicare/insurance, healthcare proxy/medical POA, advance directives
2. **Legal Readiness** - Will (up to date), durable power of attorney, advance directives (living will/DNR), document storage, end-of-life wishes discussed
3. **Financial Readiness** - Monthly income sources, monthly expenses, long-term care insurance, financial account access, estate plan/trust, 6+ month care runway
4. **Housing Readiness** - Current living arrangement, safety for aging in place, safety features installed, future living discussions, move plan if needed, daily task support

Ask questions naturally and conversationally, not like a form. Make the user feel supported, not interrogated.

DOMAIN TRANSITIONS:
When moving to a new domain, briefly signal the transition:
- "Great — that covers the medical side. Now let's talk about legal planning..."
- "Okay, moving to finances. This helps us understand the long-term care runway..."
- "Last area: housing and living situation..."

This helps users track progress and understand where they are in the assessment.`;

// Task type for extraction
export interface Task {
  title: string;
  priority: Priority;
  domain: ExtendedDomain;
  why: string;
  suggestedActions: string[];
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
      }
    },
    required: ["title", "priority", "domain", "why", "suggestedActions"]
  }
};

// Define parent profile capture tool
const profileCaptureTool = {
  name: "update_parent_profile",
  description: "Save key information about the parent as you learn it during conversation. IMPORTANT: This tool should be called ALONGSIDE your conversational response text, not instead of it. Always include your normal conversational response when using this tool.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Parent's first name or full name"
      },
      age: {
        type: "number",
        description: "Parent's age in years"
      },
      state: {
        type: "string",
        description: "Two-letter state code where parent lives (e.g., 'FL', 'CA', 'TX')"
      },
      livingArrangement: {
        type: "string",
        description: "Where parent lives (e.g., 'own home alone', 'with spouse', 'assisted living', 'with family')"
      }
    },
    required: []  // All fields optional - capture what you learn
  }
};

export async function chat(
  messages: Message[],
  mode: "crisis" | "readiness",
  options?: { useTools?: boolean } // NEW: Option to disable tools for continuous extraction
): Promise<{
  message: string;
  complete: boolean;
  extractedData?: any;
  tasks?: Task[];
  parentProfile?: ParentProfileData;
  metadata?: any;
}> {
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
      console.log("💬 [Chat] Running in conversation-only mode (no tools)");

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: anthropicMessages,
        temperature: 0.7,
        // NO TOOLS - just conversation
      });

      const messageText = response.content
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("");

      // Extract profile data from conversation
      let parentProfile: ParentProfileData | undefined;
      const nameAgePattern = /([A-Z][a-z]+)\s+(?:at|is)\s+(\d{2})/;
      const match = messageText.match(nameAgePattern);

      if (match) {
        parentProfile = {
          name: match[1],
          age: parseInt(match[2], 10)
        };
        console.log("👤 Extracted profile from Claude's response:", parentProfile);
      }

      console.log("✅ [Chat] Conversation response (no tools):", messageText.substring(0, 100) + "...");

      return {
        message: messageText,
        complete: false,
        extractedData: {},
        parentProfile,
        metadata: {
          model: response.model,
          usage: response.usage,
        },
      };
    }

    // LEGACY: Tool-based mode (with continuation loops)
    console.log("🔧 [Chat] Running in tool-based mode (with task creation)");

    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096, // High enough for task creation + full conversational response
      system: systemPrompt,
      messages: anthropicMessages,
      tools: [taskCreationTool], // Only task tool - profile extraction via text is more reliable
      temperature: 0.7,
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
      console.log(`🔄 Tool use detected (attempt ${continuationCount + 1}) - sending tool result and continuing conversation`);

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
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: continueMessages,
        tools: [taskCreationTool],
        temperature: 0.7,
      });

      allResponses.push(continueResponse);
      response = continueResponse;
      continuationCount++;
    }

    if (continuationCount >= maxContinuations) {
      console.warn("⚠️ Reached max tool use continuations - Claude may not have finished");
    }

    // Extract from ALL responses (both initial tool call and continuation)
    for (const resp of allResponses) {
      for (const block of resp.content) {
      if (block.type === "text") {
        messageText += block.text;
      } else if (block.type === "tool_use" && block.name === "create_action_item") {
        // Extract task from tool use
        const taskInput = block.input as any;

        // Check for duplicate - normalize title for comparison
        const normalizedTitle = taskInput.title.toLowerCase().trim();

        // Check if we've seen a very similar task
        let isDuplicate = false;
        for (const seenTitle of seenTaskTitles) {
          // Simple similarity check - if titles share most words, consider duplicate
          const seenWords = seenTitle.split(' ');
          const newWords = normalizedTitle.split(' ');
          const commonWords = seenWords.filter(word => newWords.includes(word) && word.length > 3);

          if (commonWords.length >= Math.min(seenWords.length, newWords.length) * 0.6) {
            isDuplicate = true;
            console.log(`⏭️ Skipping duplicate task: "${taskInput.title}" (similar to existing task)`);
            break;
          }
        }

        if (!isDuplicate) {
          console.log("🔧 Tool use detected (task):", taskInput);
          tasks.push({
            title: taskInput.title,
            priority: taskInput.priority,
            domain: taskInput.domain,
            why: taskInput.why,
            suggestedActions: taskInput.suggestedActions,
          });
          seenTaskTitles.add(normalizedTitle);
        }
      } else if (block.type === "tool_use" && block.name === "update_parent_profile") {
        // Extract parent profile data
        const profileInput = block.input as any;
        console.log("👤 Profile update detected:", profileInput);
        parentProfile = {
          name: profileInput.name,
          age: profileInput.age,
          state: profileInput.state,
          livingArrangement: profileInput.livingArrangement
        };
      }
      }
    }

    console.log("🔍 Full Message:", messageText);
    console.log("🔍 Message length:", messageText.length);
    console.log("🔍 Tasks from tool use:", tasks);
    console.log("🔍 Response stop_reason:", response.stop_reason);
    console.log("🔍 Response usage:", response.usage);

    // Extract profile data from conversation (no tool use - text extraction only)
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // Check Claude's response for patterns like "Jack at 90" or "Thanks! Jack at 90"
    const nameAgePattern = /([A-Z][a-z]+)\s+(?:at|is)\s+(\d{2})/;
    const match = messageText.match(nameAgePattern);

    if (match) {
      parentProfile = {
        name: match[1],
        age: parseInt(match[2], 10)
      };
      console.log("👤 Extracted profile from Claude's response:", parentProfile);
    } else {
      // Try user message for simple "Name Age" pattern
      const simplePattern = /([A-Z][a-z]+)\s+(\d{2})/;
      const userMatch = lastUserMessage.match(simplePattern);
      if (userMatch) {
        parentProfile = {
          name: userMatch[1],
          age: parseInt(userMatch[2], 10)
        };
        console.log("👤 Extracted profile from user message:", parentProfile);
      }
    }

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
    console.error("Claude API error:", error);
    throw new Error("Failed to get response from AI");
  }
}

export async function generateScenarios(situationModel: any): Promise<any[]> {
  // TODO: Implement scenario generation
  // This will use a specialized prompt to generate care pathway scenarios
  // based on the complete situation model
  return [];
}

export async function calculateReadinessScore(
  assessmentData: any
): Promise<{ overall: number; byDomain: any; gaps: any[] }> {
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

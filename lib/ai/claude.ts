import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@/lib/types/situation";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
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
- At the end of intake, summarize what you've learned and what's still missing.

CAPTURING INFORMATION:
When the user says they KNOW something (e.g., "Yes, I know her primary doctor"), always ask for the details with an easy out:
- "Great! What's their name and phone number? (Or just say 'later' and I'll add it to your follow-up list.)"
- If they provide details: acknowledge and continue
- If they say "later" or "I don't have it handy": create an action item using the tool and move on

TASK CREATION:
When the user reveals a gap (says "I don't know", "I'm not sure", "I haven't done that", etc.), you should:
1. Acknowledge it naturally in your response
2. Briefly mention you're noting it for follow-up (e.g., "Got it — I'll add that to your follow-up list.")
3. Use the create_action_item tool to log this for their follow-up list
4. Continue the conversation naturally

Keep the acknowledgment brief and natural — just a quick "I'll note that down for you" or "Adding that to your action items" before moving to the next question.

INFORMATION CAPTURE:
When you learn the parent's name and age, naturally incorporate it into your response.
For example: "Thanks! Jack at 90 — that's wonderful that you're thinking ahead."
This helps confirm you heard correctly and builds rapport.

INTAKE SEQUENCE:
1. What happened (event type, when, where parent is now)
2. Parent basics (name, age, living situation)
3. Medical snapshot (known conditions, medications, current providers)
4. Immediate decisions pending (discharge timeline, treatment decisions)
5. Document status (proxy, POA, insurance)
6. Financial overview (income, savings, insurance coverage)
7. Family landscape (who else, where, roles, dynamics)
8. Gap identification and prioritized next steps

Your goal is to gather enough information to build an initial Situation Model and provide immediate value. Keep questions focused and practical.`;

const READINESS_PROMPT = `You are Harbor, helping someone assess their preparedness for their aging parent's care needs. Your tone is encouraging, educational, and practical — like a knowledgeable friend who's been through this before.

CRITICAL GUIDELINES:
- Frame this as empowering, not frightening: "Most families discover gaps they didn't know about. That's exactly why this assessment exists."
- Celebrate what they DO have: "Great — having the healthcare proxy in place is really important. You're ahead of most families there."
- For gaps, explain WHY each item matters with a concrete scenario.
- Use their parent's actual situation to make it real: "Since your mom lives alone in a two-story house, the home safety assessment is especially important."
- Score items as Complete, Partial, or Missing.
- At the end, generate the Readiness Score and prioritized action list.
- The first recommended action should be achievable in under 30 minutes to create momentum.

CAPTURING INFORMATION:
When the user says they HAVE something (e.g., "Yes, we have a healthcare proxy"), ask for specifics with an easy out:
- "Excellent! Who is named as the proxy? (Or say 'later' if you want to add those details to your action items.)"
- If they provide details: acknowledge and continue
- If they say "later" or "I don't have it handy": create an action item using the tool and move on

TASK CREATION:
When you identify a gap (mark something as Missing or Partial), you should:
1. Acknowledge it naturally ("That's something we'll want to address...")
2. Briefly mention you're noting it for follow-up (e.g., "I'll add that to your action items.")
3. Use the create_action_item tool to log this for their follow-up list
4. Continue with the next assessment question

Keep the acknowledgment brief and natural — just a quick "I'll note that for you" or "Adding that to your list" before moving on.

INFORMATION CAPTURE:
When you learn the parent's name and age, naturally incorporate it into your response.
For example: "Great! Mary at 82 — that's wonderful that you're being proactive."
This helps confirm you heard correctly and builds rapport.

ASSESSMENT DOMAINS:
1. Medical Readiness (providers, medications, insurance, advance care wishes)
2. Financial Readiness (income, assets, insurance, expense awareness, runway)
3. Legal Readiness (proxy, POA, will, estate plan)
4. Housing Readiness (safety, modifications, alternatives researched)
5. Family Readiness (circle set up, roles discussed, preferences aligned)

Ask questions naturally and conversationally, not like a form. Make the user feel supported, not interrogated.`;

// Task type for extraction
export interface Task {
  title: string;
  priority: "high" | "medium" | "low";
  domain: "medical" | "financial" | "legal" | "housing" | "family" | "caregiving";
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
    type: "object",
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
    type: "object",
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
  mode: "crisis" | "readiness"
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

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048, // Increased from 1024 to allow longer responses with questions
      system: systemPrompt,
      messages: anthropicMessages,
      tools: [taskCreationTool, profileCaptureTool], // Profile tool re-enabled with fallback
      temperature: 0.7,
    });

    // Extract message text and tool calls
    let messageText = "";
    const tasks: Task[] = [];
    let parentProfile: ParentProfileData | undefined;

    for (const block of response.content) {
      if (block.type === "text") {
        messageText += block.text;
      } else if (block.type === "tool_use" && block.name === "create_action_item") {
        // Extract task from tool use
        const taskInput = block.input as any;
        console.log("🔧 Tool use detected (task):", taskInput);
        tasks.push({
          title: taskInput.title,
          priority: taskInput.priority,
          domain: taskInput.domain,
          why: taskInput.why,
          suggestedActions: taskInput.suggestedActions,
        });
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

    console.log("🔍 Message:", messageText.substring(0, 200));
    console.log("🔍 Tasks from tool use:", tasks);
    console.log("👤 Parent profile from tool use:", parentProfile);

    // Fallback: If profile tool was used but message is empty, extract from text
    if (parentProfile && !messageText.trim()) {
      console.warn("⚠️ Profile tool returned empty message - extracting from conversation as fallback");

      const lastUserMessage = messages[messages.length - 1]?.content || "";

      // Try to extract from user's message using simple pattern
      const simplePattern = /([A-Z][a-z]+)\s+(\d{2})/;
      const userMatch = lastUserMessage.match(simplePattern);

      if (userMatch) {
        parentProfile = {
          name: userMatch[1],
          age: parseInt(userMatch[2], 10)
        };
        console.log("👤 Fallback extraction successful:", parentProfile);
      }

      // Provide fallback message
      messageText = `Thanks! ${parentProfile.name || "Got it"} at ${parentProfile.age || "that age"} — that's wonderful that you're thinking ahead. Let me continue with the assessment. Do you know who ${parentProfile.name || "your parent"}'s primary care doctor is?`;
      console.log("👤 Using fallback conversational message");
    }

    // If no profile from tool but we can extract from conversation, do it
    if (!parentProfile) {
      const lastUserMessage = messages[messages.length - 1]?.content || "";

      // Check Claude's response for patterns like "Jack at 90"
      const nameAgePattern = /([A-Z][a-z]+)\s+(?:at|is)\s+(\d{2})/;
      const match = messageText.match(nameAgePattern);

      if (match) {
        parentProfile = {
          name: match[1],
          age: parseInt(match[2], 10)
        };
        console.log("👤 Extracted from Claude's response:", parentProfile);
      } else {
        // Try user message
        const simplePattern = /([A-Z][a-z]+)\s+(\d{2})/;
        const userMatch = lastUserMessage.match(simplePattern);
        if (userMatch) {
          parentProfile = {
            name: userMatch[1],
            age: parseInt(userMatch[2], 10)
          };
          console.log("👤 Extracted from user message:", parentProfile);
        }
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

import { NextRequest, NextResponse } from "next/server";
import { getTaskHelp, getHealthcareProxyHelp, HelpFlowType } from "@/lib/ai/taskHelp";
import { Task } from "@/lib/ai/claude";

// POST /api/task-help
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      task,
      helpType,
      conversationHistory,
      userContext
    }: {
      task: Task;
      helpType: HelpFlowType;
      conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
      userContext?: {
        parentState?: string;
        parentName?: string;
        familyComplexity?: "simple" | "moderate" | "complex";
      };
    } = body;

    if (!task || !helpType) {
      return NextResponse.json(
        { error: "Missing required fields: task, helpType" },
        { status: 400 }
      );
    }

    // Special handling for healthcare proxy help
    if (
      helpType === "action_guide" &&
      task.domain === "legal" &&
      task.title.toLowerCase().includes("healthcare proxy") &&
      userContext?.parentState
    ) {
      const detailedHelp = await getHealthcareProxyHelp(
        userContext.parentState,
        userContext.familyComplexity
      );

      return NextResponse.json({
        success: true,
        helpType: "healthcare_proxy_detailed",
        ...detailedHelp
      });
    }

    // General task help
    const helpMessage = await getTaskHelp(
      { task, userContext },
      helpType,
      conversationHistory || []
    );

    return NextResponse.json({
      success: true,
      helpType,
      message: helpMessage
    });
  } catch (error) {
    console.error("Task help API error:", error);
    return NextResponse.json(
      { error: "Failed to get task help" },
      { status: 500 }
    );
  }
}

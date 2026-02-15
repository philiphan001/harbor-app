// API endpoint to run internal utility agents

import { NextRequest, NextResponse } from "next/server";
import { runAllInternalAgents } from "@/lib/ai/internalAgents";

export async function GET(request: NextRequest) {
  try {
    console.log("Running internal utility agents...");

    const detections = runAllInternalAgents();

    console.log(`   Found ${detections.length} internal detections`);

    return NextResponse.json({
      success: true,
      detections,
      summary: {
        total: detections.length,
        critical: detections.filter(d => d.severity === "critical").length,
        high: detections.filter(d => d.severity === "high").length,
        medium: detections.filter(d => d.severity === "medium").length,
        low: detections.filter(d => d.severity === "low").length,
      },
    });
  } catch (error) {
    console.error("Error in /api/run-internal-agents:", error);
    return NextResponse.json(
      {
        error: "Failed to run internal agents",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

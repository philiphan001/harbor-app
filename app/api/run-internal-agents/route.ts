// API endpoint to run internal utility agents

import { NextRequest, NextResponse } from "next/server";
import { runAllInternalAgents } from "@/lib/ai/internalAgents";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("api/internal-agents");

export async function GET(request: NextRequest) {
  try {
    log.info("Running internal utility agents");

    const detections = runAllInternalAgents();

    log.info("Internal detections found", { count: detections.length });

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
    log.errorWithStack("Failed to run internal agents", error);
    return NextResponse.json(
      {
        error: "Failed to run internal agents",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET /api/domain-data?parentId=xxx — Fetch all domain data
// POST /api/domain-data — Save captured domain data

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import { applyRateLimit, STANDARD_LIMIT } from "@/lib/utils/rateLimit";
import { saveDomainData, getDomainData } from "@/lib/db/domainData";

const log = createLogger("api/domain-data");

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "domain-data-get", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const parentId = request.nextUrl.searchParams.get("parentId");
    if (!parentId) {
      return NextResponse.json(
        { error: "parentId is required" },
        { status: 400 }
      );
    }

    const data = await getDomainData(parentId);
    if (!data) {
      return NextResponse.json({ data: null }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    log.errorWithStack("Failed to fetch domain data", error);
    return NextResponse.json(
      { error: "Failed to fetch domain data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "domain-data-post", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { parentId, toolName, taskTitle, data } = body;

    if (!parentId || !toolName || !data) {
      return NextResponse.json(
        { error: "parentId, toolName, and data are required" },
        { status: 400 }
      );
    }

    await saveDomainData({
      parentId,
      toolName,
      taskTitle: taskTitle || toolName,
      data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.errorWithStack("Failed to save domain data", error);
    return NextResponse.json(
      { error: "Failed to save domain data" },
      { status: 500 }
    );
  }
}

// GET /api/tasks?parentId=xxx — Fetch tasks
// POST /api/tasks — Save tasks
// PATCH /api/tasks — Update task status
// DELETE /api/tasks?parentId=xxx&title=xxx — Remove task

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import { applyRateLimit, STANDARD_LIMIT } from "@/lib/utils/rateLimit";
import {
  saveTasks,
  getTasks,
  updateTaskStatus,
  removeTask,
  deleteAllTasks,
} from "@/lib/db/tasks";

const log = createLogger("api/tasks");

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "tasks-get", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const parentId = request.nextUrl.searchParams.get("parentId");
    if (!parentId) {
      return NextResponse.json(
        { error: "parentId is required" },
        { status: 400 }
      );
    }

    const tasks = await getTasks(parentId);
    return NextResponse.json({ tasks });
  } catch (error) {
    log.errorWithStack("Failed to fetch tasks", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "tasks-post", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { parentId, tasks } = body;

    if (!parentId || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: "parentId and tasks array are required" },
        { status: 400 }
      );
    }

    const saved = await saveTasks(parentId, tasks);
    return NextResponse.json({ tasks: saved });
  } catch (error) {
    log.errorWithStack("Failed to save tasks", error);
    return NextResponse.json(
      { error: "Failed to save tasks" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "tasks-patch", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { taskId, status } = body;

    if (!taskId || !status) {
      return NextResponse.json(
        { error: "taskId and status are required" },
        { status: 400 }
      );
    }

    const updated = await updateTaskStatus(taskId, status);
    if (!updated) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ task: updated });
  } catch (error) {
    log.errorWithStack("Failed to update task", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "tasks-delete", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const parentId = request.nextUrl.searchParams.get("parentId");
    const title = request.nextUrl.searchParams.get("title");

    if (!parentId) {
      return NextResponse.json(
        { error: "parentId is required" },
        { status: 400 }
      );
    }

    if (title) {
      const removed = await removeTask(parentId, title);
      return NextResponse.json({ removed });
    }

    // Delete all tasks for this parent
    const count = await deleteAllTasks(parentId);
    return NextResponse.json({ deleted: count });
  } catch (error) {
    log.errorWithStack("Failed to delete task(s)", error);
    return NextResponse.json(
      { error: "Failed to delete task(s)" },
      { status: 500 }
    );
  }
}

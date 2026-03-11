import { describe, it, expect, vi } from "vitest";
import { scanTaskDeadlines, deadlineNudgesToNudgeStates } from "@/lib/utils/deadlineTracker";
import type { Task } from "@/lib/ai/claude";

const mockTasks: Task[] = [
  {
    title: "Overdue task",
    priority: "medium",
    domain: "legal",
    why: "Past due",
    suggestedActions: [],
    recurrence: { frequency: "monthly", nextDueDate: "2026-03-05" },
  },
  {
    title: "Due tomorrow",
    priority: "low",
    domain: "medical",
    why: "Very soon",
    suggestedActions: [],
    recurrence: { frequency: "monthly", nextDueDate: "2026-03-12" },
  },
  {
    title: "Due in 3 days",
    priority: "low",
    domain: "financial",
    why: "Soon",
    suggestedActions: [],
    recurrence: { frequency: "quarterly", nextDueDate: "2026-03-14" },
  },
  {
    title: "Due in a week",
    priority: "low",
    domain: "housing",
    why: "Next week",
    suggestedActions: ["Complete by 2026-03-18"],
  },
  {
    title: "No deadline",
    priority: "low",
    domain: "medical",
    why: "No date",
    suggestedActions: [],
  },
  {
    title: "Far away deadline",
    priority: "low",
    domain: "medical",
    why: "Not urgent",
    suggestedActions: [],
    recurrence: { frequency: "annual", nextDueDate: "2026-12-01" },
  },
];

vi.mock("@/lib/utils/taskStorage", () => ({
  getTasks: vi.fn(() => mockTasks),
}));

describe("scanTaskDeadlines", () => {
  const now = new Date("2026-03-11T12:00:00Z");

  it("returns only tasks with deadlines within 7 days", () => {
    const results = scanTaskDeadlines(now);
    // Should include: overdue, tomorrow, 3 days, week — not: no deadline, far away
    expect(results).toHaveLength(4);
  });

  it("classifies overdue correctly", () => {
    const results = scanTaskDeadlines(now);
    const overdue = results.find((r) => r.taskTitle === "Overdue task");
    expect(overdue?.urgency).toBe("overdue");
    expect(overdue!.daysUntilDue).toBeLessThan(0);
  });

  it("classifies 1-day urgency correctly", () => {
    const results = scanTaskDeadlines(now);
    const tomorrow = results.find((r) => r.taskTitle === "Due tomorrow");
    expect(tomorrow?.urgency).toBe("1-day");
  });

  it("classifies 3-day urgency correctly", () => {
    const results = scanTaskDeadlines(now);
    const threeDays = results.find((r) => r.taskTitle === "Due in 3 days");
    expect(threeDays?.urgency).toBe("3-day");
  });

  it("classifies 7-day urgency correctly", () => {
    const results = scanTaskDeadlines(now);
    const week = results.find((r) => r.taskTitle === "Due in a week");
    expect(week?.urgency).toBe("7-day");
  });

  it("sorts by urgency (most urgent first)", () => {
    const results = scanTaskDeadlines(now);
    const urgencies = results.map((r) => r.urgency);
    expect(urgencies[0]).toBe("overdue");
    expect(urgencies[urgencies.length - 1]).toBe("7-day");
  });

  it("excludes tasks with no deadline", () => {
    const results = scanTaskDeadlines(now);
    expect(results.find((r) => r.taskTitle === "No deadline")).toBeUndefined();
  });

  it("excludes tasks with far-away deadlines", () => {
    const results = scanTaskDeadlines(now);
    expect(results.find((r) => r.taskTitle === "Far away deadline")).toBeUndefined();
  });
});

describe("deadlineNudgesToNudgeStates", () => {
  it("converts deadline nudges to NudgeState objects", () => {
    const nudges = scanTaskDeadlines(new Date("2026-03-11T12:00:00Z"));
    const states = deadlineNudgesToNudgeStates(nudges, "parent-1");

    expect(states).toHaveLength(nudges.length);
    expect(states[0].sourceType).toBe("custom");
    expect(states[0].parentId).toBe("parent-1");
  });

  it("maps urgency to correct tiers", () => {
    const nudges = scanTaskDeadlines(new Date("2026-03-11T12:00:00Z"));
    const states = deadlineNudgesToNudgeStates(nudges, "parent-1");

    const overdue = states.find((s) => s.title.includes("Overdue"));
    expect(overdue?.tier).toBe("P0");

    const sevenDay = states.find((s) => s.title.includes("Due in a week"));
    expect(sevenDay?.tier).toBe("P3");
  });

  it("sets higher relevance scores for more urgent deadlines", () => {
    const nudges = scanTaskDeadlines(new Date("2026-03-11T12:00:00Z"));
    const states = deadlineNudgesToNudgeStates(nudges, "parent-1");

    const overdue = states.find((s) => s.title.includes("Overdue"));
    const sevenDay = states.find((s) => s.title.includes("Due in a week"));
    expect(overdue!.relevanceScore).toBeGreaterThan(sevenDay!.relevanceScore);
  });
});

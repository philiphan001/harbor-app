import { describe, it, expect } from "vitest";
import { extractDueDate, reprioritizeTasks } from "@/lib/utils/taskPrioritizer";
import type { Task } from "@/lib/ai/claude";
import type { AgentDetection } from "@/lib/types/agents";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    title: "Test task",
    priority: "low",
    domain: "medical",
    why: "Test reason",
    suggestedActions: [],
    ...overrides,
  };
}

function makeDetection(overrides: Partial<AgentDetection> = {}): AgentDetection {
  return {
    id: "det-1",
    agentType: "drug_recall",
    runId: "run-1",
    detectedAt: new Date().toISOString(),
    title: "Test detection",
    description: "Test",
    relevanceScore: "high",
    domain: "medical",
    actionable: true,
    handled: false,
    ...overrides,
  };
}

describe("extractDueDate", () => {
  it("returns recurrence nextDueDate if present", () => {
    const task = makeTask({
      recurrence: { frequency: "monthly", nextDueDate: "2026-04-01" },
    });
    const result = extractDueDate(task);
    expect(result).toEqual(new Date("2026-04-01"));
  });

  it("extracts date from suggestedActions text", () => {
    const task = makeTask({
      suggestedActions: ["Complete by 2026-03-15"],
    });
    const result = extractDueDate(task);
    expect(result).toEqual(new Date("2026-03-15"));
  });

  it("handles 'Due by' pattern", () => {
    const task = makeTask({
      suggestedActions: ["Due by 2026-06-30"],
    });
    const result = extractDueDate(task);
    expect(result).toEqual(new Date("2026-06-30"));
  });

  it("returns null when no due date found", () => {
    const task = makeTask();
    expect(extractDueDate(task)).toBeNull();
  });
});

describe("reprioritizeTasks", () => {
  const now = new Date("2026-03-11T12:00:00Z");

  it("escalates to high when due in 3 days or less", () => {
    const task = makeTask({
      priority: "low",
      recurrence: { frequency: "monthly", nextDueDate: "2026-03-13" },
    });
    const result = reprioritizeTasks([task], { now });
    expect(result[0].priority).toBe("high");
  });

  it("escalates low → medium when due in 7 days", () => {
    const task = makeTask({
      priority: "low",
      recurrence: { frequency: "monthly", nextDueDate: "2026-03-17" },
    });
    const result = reprioritizeTasks([task], { now });
    expect(result[0].priority).toBe("medium");
  });

  it("does not double-escalate tasks already high", () => {
    const task = makeTask({
      priority: "high",
      recurrence: { frequency: "monthly", nextDueDate: "2026-03-17" },
    });
    const result = reprioritizeTasks([task], { now });
    expect(result[0].priority).toBe("high");
  });

  it("escalates low → medium on signal correlation (same domain + keyword overlap)", () => {
    const task = makeTask({
      title: "Review medication list",
      priority: "low",
      domain: "medical",
    });
    const detection = makeDetection({
      title: "New medication recall alert",
      domain: "medical",
      handled: false,
    });
    const result = reprioritizeTasks([task], { now, detections: [detection] });
    expect(result[0].priority).toBe("medium");
  });

  it("does not escalate when detection is handled", () => {
    const task = makeTask({
      title: "Review medication list",
      priority: "low",
      domain: "medical",
    });
    const detection = makeDetection({
      title: "New medication recall alert",
      domain: "medical",
      handled: true,
    });
    const result = reprioritizeTasks([task], { now, detections: [detection] });
    expect(result[0].priority).toBe("low");
  });

  it("does not mutate input array", () => {
    const task = makeTask({
      priority: "low",
      recurrence: { frequency: "monthly", nextDueDate: "2026-03-12" },
    });
    const tasks = [task];
    const result = reprioritizeTasks(tasks, { now });
    expect(tasks[0].priority).toBe("low");
    expect(result[0].priority).toBe("high");
  });
});

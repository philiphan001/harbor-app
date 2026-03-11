import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeProgressSummary, formatProgressMarkdown, type ProgressSummary } from "@/lib/utils/progressSummary";

// Mock all dependencies
vi.mock("@/lib/utils/taskStorage", () => ({
  getCompletedTasks: vi.fn(() => [
    { title: "Task A", completedAt: "2026-03-10T10:00:00Z", priority: "high", domain: "medical", why: "", suggestedActions: [] },
    { title: "Task B", completedAt: "2026-03-01T10:00:00Z", priority: "low", domain: "legal", why: "", suggestedActions: [] },
  ]),
  getTasks: vi.fn(() => [
    { title: "Pending 1", priority: "medium", domain: "financial", why: "", suggestedActions: [] },
  ]),
}));

vi.mock("@/lib/utils/taskData", () => ({
  getAllTaskData: vi.fn(() => [
    { taskTitle: "Doc 1", toolName: "upload", data: {}, capturedAt: "2026-03-09T10:00:00Z", parentId: "p1" },
  ]),
}));

vi.mock("@/lib/utils/agentStorage", () => ({
  getAllDetections: vi.fn(() => [
    { id: "d1", detectedAt: "2026-03-08T10:00:00Z", title: "Alert", handled: false, agentType: "drug_recall", runId: "r1", description: "", relevanceScore: "high", domain: "medical", actionable: true },
    { id: "d2", detectedAt: "2026-02-01T10:00:00Z", title: "Old", handled: true, agentType: "drug_recall", runId: "r2", description: "", relevanceScore: "low", domain: "medical", actionable: false },
  ]),
}));

vi.mock("@/lib/utils/readinessScore", () => ({
  calculateReadinessScore: vi.fn(() => ({
    overall: 45,
    domains: { medical: 60, legal: 30, financial: 40, housing: 50, transportation: 20, social: 70 },
    criticalGaps: ["legal"],
    completedCount: 5,
    pendingCount: 3,
    status: "needs-attention",
  })),
}));

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal("window", { ...globalThis.window });
vi.stubGlobal("localStorage", {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val; },
  removeItem: (key: string) => { delete store[key]; },
});

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
});

describe("computeProgressSummary", () => {
  it("filters completed tasks by period", () => {
    const now = new Date("2026-03-11T12:00:00Z");
    const summary = computeProgressSummary(7, now);
    // Task A (Mar 10) is within 7 days, Task B (Mar 1) is outside
    expect(summary.tasksCompleted).toBe(1);
  });

  it("counts pending tasks", () => {
    const now = new Date("2026-03-11T12:00:00Z");
    const summary = computeProgressSummary(7, now);
    expect(summary.tasksPending).toBe(1);
  });

  it("counts documents in period", () => {
    const now = new Date("2026-03-11T12:00:00Z");
    const summary = computeProgressSummary(7, now);
    expect(summary.documentsCaptured).toBe(1);
  });

  it("counts detections in period", () => {
    const now = new Date("2026-03-11T12:00:00Z");
    const summary = computeProgressSummary(7, now);
    // d1 (Mar 8) is within 7 days, d2 (Feb 1) is outside
    expect(summary.detectionsSurfaced).toBe(1);
  });

  it("computes readiness delta on second call", () => {
    const now = new Date("2026-03-11T12:00:00Z");
    // First call — no prior snapshot
    const first = computeProgressSummary(7, now);
    expect(first.readinessDelta).toBeNull();

    // Second call — should have delta of 0 (same mock score)
    const second = computeProgressSummary(7, now);
    expect(second.readinessDelta).toBe(0);
  });
});

describe("formatProgressMarkdown", () => {
  it("includes task count in output", () => {
    const summary: ProgressSummary = {
      periodDays: 7,
      tasksCompleted: 3,
      tasksPending: 2,
      documentsCaptured: 1,
      readinessScore: 45,
      readinessDelta: 5,
      detectionsSurfaced: 2,
    };
    const md = formatProgressMarkdown(summary);
    expect(md).toContain("**3** tasks completed");
    expect(md).toContain("**1** document captured");
    expect(md).toContain("**2** alerts surfaced");
    expect(md).toContain("**45%**");
    expect(md).toContain("(+5)");
  });

  it("shows 'no tasks completed' when zero", () => {
    const summary: ProgressSummary = {
      periodDays: 7,
      tasksCompleted: 0,
      tasksPending: 0,
      documentsCaptured: 0,
      readinessScore: 10,
      readinessDelta: null,
      detectionsSurfaced: 0,
    };
    const md = formatProgressMarkdown(summary);
    expect(md).toContain("No tasks completed");
  });
});

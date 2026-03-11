import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getFamilyMembers,
  addFamilyMember,
  removeFamilyMember,
  generateDigestContent,
} from "@/lib/utils/familyDigest";

vi.mock("@/lib/utils/taskStorage", () => ({
  getCompletedTasks: vi.fn(() => [
    { title: "Filed POA", completedAt: new Date().toISOString(), priority: "high", domain: "legal", why: "", suggestedActions: [] },
  ]),
  getTasks: vi.fn(() => [
    { title: "Review meds", priority: "high", domain: "medical", why: "", suggestedActions: [] },
    { title: "Update finances", priority: "medium", domain: "financial", why: "", suggestedActions: [] },
  ]),
}));

vi.mock("@/lib/utils/agentStorage", () => ({
  getAllDetections: vi.fn(() => [
    {
      id: "d1",
      agentType: "drug_recall",
      runId: "r1",
      detectedAt: new Date().toISOString(),
      title: "Important Drug Recall",
      description: "A drug was recalled",
      relevanceScore: "high",
      domain: "medical",
      actionable: true,
      handled: false,
    },
  ]),
}));

vi.mock("@/lib/utils/readinessScore", () => ({
  calculateReadinessScore: vi.fn(() => ({
    overall: 55,
    domains: { medical: 60, legal: 40, financial: 50, housing: 70, transportation: 30, social: 80 },
    criticalGaps: ["legal", "transportation"],
    completedCount: 5,
    pendingCount: 4,
    status: "needs-attention",
  })),
}));

vi.mock("@/lib/utils/deadlineTracker", () => ({
  scanTaskDeadlines: vi.fn(() => [
    { taskTitle: "Review meds", domain: "medical", dueDate: new Date("2026-03-14"), urgency: "3-day", daysUntilDue: 3 },
  ]),
}));

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

describe("Family Member CRUD", () => {
  it("starts with empty list", () => {
    expect(getFamilyMembers()).toEqual([]);
  });

  it("adds a family member", () => {
    const member = addFamilyMember({
      name: "Jane Doe",
      email: "jane@example.com",
      relationship: "sibling",
      updateFrequency: "weekly",
    });
    expect(member.id).toBeTruthy();
    expect(member.addedAt).toBeTruthy();
    expect(member.name).toBe("Jane Doe");

    const members = getFamilyMembers();
    expect(members).toHaveLength(1);
    expect(members[0].email).toBe("jane@example.com");
  });

  it("removes a family member", () => {
    const member = addFamilyMember({
      name: "John",
      email: "john@example.com",
      relationship: "sibling",
      updateFrequency: "monthly",
    });

    removeFamilyMember(member.id);
    expect(getFamilyMembers()).toHaveLength(0);
  });

  it("handles multiple members", () => {
    addFamilyMember({ name: "A", email: "a@test.com", relationship: "child", updateFrequency: "weekly" });
    addFamilyMember({ name: "B", email: "b@test.com", relationship: "spouse", updateFrequency: "biweekly" });

    expect(getFamilyMembers()).toHaveLength(2);
  });
});

describe("generateDigestContent", () => {
  it("includes completed tasks section", () => {
    const digest = generateDigestContent();
    expect(digest).toContain("Completed This Week");
    expect(digest).toContain("Filed POA");
  });

  it("includes pending tasks count", () => {
    const digest = generateDigestContent();
    expect(digest).toContain("Pending Tasks (2)");
    expect(digest).toContain("**1** high priority");
  });

  it("includes upcoming deadlines", () => {
    const digest = generateDigestContent();
    expect(digest).toContain("Upcoming Deadlines");
    expect(digest).toContain("Due in 3d: Review meds");
  });

  it("includes notable alerts", () => {
    const digest = generateDigestContent();
    expect(digest).toContain("Notable Alerts");
    expect(digest).toContain("Important Drug Recall");
  });

  it("includes readiness score", () => {
    const digest = generateDigestContent();
    expect(digest).toContain("Readiness Score");
    expect(digest).toContain("**55%**");
    expect(digest).toContain("legal, transportation");
  });

  it("includes Harbor branding footer", () => {
    const digest = generateDigestContent();
    expect(digest).toContain("Harbor");
  });

  it("handles empty data gracefully", async () => {
    // Re-mock with empty data
    const { getCompletedTasks } = await import("@/lib/utils/taskStorage");
    (getCompletedTasks as ReturnType<typeof vi.fn>).mockReturnValueOnce([]);

    // Should not throw
    const digest = generateDigestContent();
    expect(digest).toContain("Harbor Care Update");
  });
});

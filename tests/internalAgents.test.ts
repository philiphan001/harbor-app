import { describe, it, expect, beforeEach } from "vitest";
import {
  runGapDetector,
  runFreshnessMonitor,
  runConflictResolver,
  runAllInternalAgents,
} from "@/lib/ai/internalAgents";

describe("Gap Detector Agent", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty when no profile exists", () => {
    expect(runGapDetector()).toEqual([]);
  });

  it("detects all critical gaps for a fresh profile", () => {
    setupProfile();

    const detections = runGapDetector();
    expect(detections.length).toBeGreaterThan(0);

    const titles = detections.map((d) => d.title);
    expect(titles).toContain("Missing Primary Care Doctor Contact");
    expect(titles).toContain("No Current Medications List");
    expect(titles).toContain("Power of Attorney Status Unknown");
  });

  it("marks gaps as critical or high severity", () => {
    setupProfile();

    const detections = runGapDetector();
    const severities = detections.map((d) => d.severity);
    expect(severities).toContain("critical");
  });

  it("has suggested tasks for actionable detections", () => {
    setupProfile();

    const detections = runGapDetector();
    const actionable = detections.filter((d) => d.actionable);
    expect(actionable.length).toBeGreaterThan(0);

    for (const d of actionable) {
      expect(d.suggestedTask).toBeDefined();
      expect(d.suggestedTask!.title).toBeDefined();
    }
  });

  it("does not flag doctor gap when doctor info exists", () => {
    setupProfile();
    setupTaskData([
      {
        taskTitle: "Get doctor info",
        toolName: "save_doctor_info",
        data: { name: "Dr. Smith", phone: "555-1234" },
        parentId: "test-parent",
      },
    ]);

    const detections = runGapDetector();
    const titles = detections.map((d) => d.title);
    expect(titles).not.toContain("Missing Primary Care Doctor Contact");
  });

  it("does not flag medication gap when medication list exists", () => {
    setupProfile();
    setupTaskData([
      {
        taskTitle: "Medications",
        toolName: "save_medication_list",
        data: { medications: [{ name: "Aspirin", dosage: "81mg", frequency: "daily" }] },
        parentId: "test-parent",
      },
    ]);

    const detections = runGapDetector();
    const titles = detections.map((d) => d.title);
    expect(titles).not.toContain("No Current Medications List");
  });
});

describe("Freshness Monitor Agent", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty when no profile exists", () => {
    expect(runFreshnessMonitor()).toEqual([]);
  });

  it("returns empty when data is recent", () => {
    setupProfile();
    setupTaskData([
      {
        taskTitle: "Medications",
        toolName: "save_medication_list",
        data: { medications: [] },
        parentId: "test-parent",
        capturedAt: new Date().toISOString(),
      },
    ]);

    const detections = runFreshnessMonitor();
    const medicationStale = detections.find((d) => d.title.includes("Medication"));
    expect(medicationStale).toBeUndefined();
  });

  it("flags stale medication data (> 6 months old)", () => {
    setupProfile();

    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

    setupTaskData([
      {
        taskTitle: "Medications",
        toolName: "save_medication_list",
        data: { medications: [] },
        parentId: "test-parent",
        capturedAt: sevenMonthsAgo.toISOString(),
      },
    ]);

    const detections = runFreshnessMonitor();
    const medicationStale = detections.find((d) => d.title.includes("Medication"));
    expect(medicationStale).toBeDefined();
    expect(medicationStale!.severity).toBe("medium");
  });

  it("flags stale profile (> 3 months old)", () => {
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    setupProfile(fourMonthsAgo.toISOString());

    const detections = runFreshnessMonitor();
    const profileStale = detections.find((d) => d.title.includes("Profile"));
    expect(profileStale).toBeDefined();
    expect(profileStale!.severity).toBe("low");
  });
});

describe("Conflict Resolver Agent", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty when no profile exists", () => {
    expect(runConflictResolver()).toEqual([]);
  });

  it("detects duplicate tasks", () => {
    setupProfile();
    localStorage.setItem(
      "harbor_tasks",
      JSON.stringify([
        { id: "1", title: "Get doctor info", completed: false, parentId: "test-parent" },
        { id: "2", title: "Get doctor info", completed: false, parentId: "test-parent" },
      ])
    );

    const detections = runConflictResolver();
    const duplicateDetection = detections.find((d) => d.title.includes("Duplicate"));
    expect(duplicateDetection).toBeDefined();
  });

  it("detects multiple primary care doctors", () => {
    setupProfile();
    setupTaskData([
      {
        taskTitle: "Doctor 1",
        toolName: "save_doctor_info",
        data: { name: "Dr. Smith", phone: "111" },
        parentId: "test-parent",
      },
      {
        taskTitle: "Doctor 2",
        toolName: "save_doctor_info",
        data: { name: "Dr. Jones", phone: "222" },
        parentId: "test-parent",
      },
    ]);

    const detections = runConflictResolver();
    const multiDocDetection = detections.find((d) => d.title.includes("Multiple"));
    expect(multiDocDetection).toBeDefined();
    expect(multiDocDetection!.severity).toBe("medium");
  });
});

describe("runAllInternalAgents", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("combines results from all agents", () => {
    setupProfile();

    const all = runAllInternalAgents();
    expect(all.length).toBeGreaterThan(0);

    // Should include gap detections at minimum
    const agentTypes = new Set(all.map((d) => d.agentType));
    expect(agentTypes.has("gap_detector")).toBe(true);
  });

  it("returns empty when no profile", () => {
    expect(runAllInternalAgents()).toEqual([]);
  });
});

// --- Helpers ---

function setupProfile(lastUpdated?: string) {
  localStorage.setItem(
    "harbor_parent_profiles",
    JSON.stringify([
      {
        id: "test-parent",
        name: "Test Parent",
        age: 78,
        state: "FL",
        lastUpdated: lastUpdated || new Date().toISOString(),
      },
    ])
  );
  localStorage.setItem("harbor_active_parent_id", "test-parent");
}

function setupTaskData(items: Array<Record<string, unknown>>) {
  const existing = JSON.parse(localStorage.getItem("harbor_task_data") || "[]");
  const withDefaults = items.map((item) => ({
    capturedAt: new Date().toISOString(),
    ...item,
  }));
  localStorage.setItem("harbor_task_data", JSON.stringify([...existing, ...withDefaults]));
}

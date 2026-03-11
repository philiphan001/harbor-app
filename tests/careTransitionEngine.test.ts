import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Task } from "@/lib/ai/claude";
import type { CareTransitionPlaybook } from "@/lib/types/careTransitions";
import {
  generateTasksForPlaybook,
  getPlaybooksForLifeEvent,
  getPlaybooksForMilestone,
  isPlaybookActivated,
  activatePlaybook,
  getAllActivations,
} from "@/lib/utils/careTransitionEngine";

// --- Mock dependencies ---

const mockLocalStorage: Record<string, string> = {};

vi.mock("@/lib/utils/taskStorage", () => ({
  getTasks: vi.fn(() => []),
  addTasks: vi.fn(),
}));

vi.mock("@/lib/utils/parentProfile", () => ({
  getActiveParentId: vi.fn(() => "p1"),
  getParentProfile: vi.fn(() => ({ id: "p1", name: "Mom Smith", age: 72, state: "NY" })),
}));

vi.mock("@/lib/utils/agentStorage", () => ({
  getAllDetections: vi.fn(() => []),
}));

// Mock localStorage
beforeEach(() => {
  for (const key of Object.keys(mockLocalStorage)) {
    delete mockLocalStorage[key];
  }

  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockLocalStorage[key];
    }),
  });

  vi.stubGlobal("window", {});
});

// --- Helpers ---

function makePlaybook(overrides: Partial<CareTransitionPlaybook> = {}): CareTransitionPlaybook {
  return {
    id: "hospital_to_home",
    label: "Hospital → Home",
    icon: "🏠",
    overview: "Test playbook",
    trigger: {
      lifeEventType: "hospitalization",
      milestoneIds: ["hospital_3day_rule_snf"],
      description: "Test trigger",
    },
    steps: [],
    insuranceConsiderations: [],
    timelineBenchmarks: [],
    taskTemplates: [
      {
        title: "Test task for {parent_name}",
        description: "Test description for {parent_name}",
        dueDaysAfterEvent: 3,
        priority: "high",
        domain: "medical",
      },
      {
        title: "Second task",
        description: "Another task description",
        dueDaysAfterEvent: 7,
        priority: "medium",
        domain: "financial",
      },
    ],
    ...overrides,
  };
}

// --- Tests ---

describe("generateTasksForPlaybook", () => {
  it("generates tasks and resolves {parent_name} placeholders", () => {
    const playbook = makePlaybook();
    const tasks = generateTasksForPlaybook(playbook, "Mom");

    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe("Test task for Mom");
    expect(tasks[0].why).toBe("Test description for Mom");
    expect(tasks[0].source).toBe("playbook");
  });

  it("computes due dates based on offset", () => {
    const playbook = makePlaybook();
    const tasks = generateTasksForPlaybook(playbook, "Mom");

    // Each task should have a suggestedActions entry with "Complete by" and a date
    expect(tasks[0].suggestedActions[0]).toMatch(/^Complete by \d{4}-\d{2}-\d{2}$/);
    expect(tasks[1].suggestedActions[0]).toMatch(/^Complete by \d{4}-\d{2}-\d{2}$/);
  });

  it("handles negative due date offsets", () => {
    const playbook = makePlaybook({
      taskTemplates: [
        {
          title: "Prepare home",
          description: "Prep before discharge",
          dueDaysAfterEvent: -1,
          priority: "high",
          domain: "housing",
        },
      ],
    });

    const tasks = generateTasksForPlaybook(playbook, "Mom");

    expect(tasks).toHaveLength(1);
    // Due date should be yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expectedDate = yesterday.toISOString().split("T")[0];
    expect(tasks[0].suggestedActions[0]).toBe(`Complete by ${expectedDate}`);
  });

  it("deduplicates against existing tasks by title", async () => {
    const { getTasks } = await import("@/lib/utils/taskStorage");
    vi.mocked(getTasks).mockReturnValue([
      {
        title: "Test task for Mom",
        priority: "high",
        domain: "medical",
        why: "Existing",
        suggestedActions: [],
      },
    ]);

    const playbook = makePlaybook();
    const tasks = generateTasksForPlaybook(playbook, "Mom");

    // First task should be deduped, second should remain
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Second task");
  });

  it("sets source to playbook on all generated tasks", () => {
    const playbook = makePlaybook();
    const tasks = generateTasksForPlaybook(playbook, "Dad");

    for (const task of tasks) {
      expect(task.source).toBe("playbook");
    }
  });

  it("handles empty task templates", () => {
    const playbook = makePlaybook({ taskTemplates: [] });
    const tasks = generateTasksForPlaybook(playbook, "Mom");
    expect(tasks).toHaveLength(0);
  });
});

describe("getPlaybooksForLifeEvent", () => {
  it("returns matching playbooks for hospitalization", () => {
    const results = getPlaybooksForLifeEvent("hospitalization");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.id === "hospital_to_home")).toBe(true);
    expect(results.some((p) => p.id === "hospital_to_snf")).toBe(true);
  });

  it("returns matching playbooks for caregiver_burnout", () => {
    const results = getPlaybooksForLifeEvent("caregiver_burnout");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.id === "home_to_assisted_living")).toBe(true);
  });

  it("returns matching playbooks for cognitive_decline", () => {
    const results = getPlaybooksForLifeEvent("cognitive_decline");
    expect(results.some((p) => p.id === "al_to_memory_care")).toBe(true);
  });

  it("returns empty for unmatched event type", () => {
    const results = getPlaybooksForLifeEvent("fall");
    expect(results).toHaveLength(0);
  });
});

describe("getPlaybooksForMilestone", () => {
  it("returns matching playbooks for hospital_3day_rule_snf", () => {
    const results = getPlaybooksForMilestone("hospital_3day_rule_snf");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((p) => p.id === "hospital_to_home")).toBe(true);
  });

  it("returns matching playbooks for care_transition_home_to_al", () => {
    const results = getPlaybooksForMilestone("care_transition_home_to_al");
    expect(results.some((p) => p.id === "home_to_assisted_living")).toBe(true);
  });

  it("returns matching playbooks for care_transition_al_to_memory", () => {
    const results = getPlaybooksForMilestone("care_transition_al_to_memory");
    expect(results.some((p) => p.id === "al_to_memory_care")).toBe(true);
  });

  it("returns empty for unmatched milestone", () => {
    const results = getPlaybooksForMilestone("nonexistent_milestone");
    expect(results).toHaveLength(0);
  });
});

describe("isPlaybookActivated", () => {
  it("returns false before activation", () => {
    expect(isPlaybookActivated("hospital_to_home", "p1")).toBe(false);
  });

  it("returns true after activation", () => {
    activatePlaybook("hospital_to_home", "manual");
    expect(isPlaybookActivated("hospital_to_home", "p1")).toBe(true);
  });
});

describe("activatePlaybook", () => {
  it("first call succeeds and generates tasks", () => {
    const result = activatePlaybook("hospital_to_home", "life_event", "evt_1");

    expect(result.alreadyActivated).toBe(false);
    expect(result.activation).toBeDefined();
    expect(result.activation!.playbookId).toBe("hospital_to_home");
    expect(result.activation!.triggeredBy).toBe("life_event");
    expect(result.activation!.triggerSource).toBe("evt_1");
    expect(result.generatedTasks.length).toBeGreaterThan(0);
  });

  it("second call returns alreadyActivated: true", () => {
    activatePlaybook("hospital_to_home", "life_event", "evt_1");
    const result = activatePlaybook("hospital_to_home", "life_event", "evt_2");

    expect(result.alreadyActivated).toBe(true);
    expect(result.generatedTasks).toHaveLength(0);
  });

  it("saves activation record", () => {
    activatePlaybook("hospital_to_home", "manual");
    const activations = getAllActivations();
    expect(activations.length).toBe(1);
    expect(activations[0].playbookId).toBe("hospital_to_home");
    expect(activations[0].parentId).toBe("p1");
  });

  it("calls addTasks with generated tasks", async () => {
    const { addTasks } = await import("@/lib/utils/taskStorage");
    activatePlaybook("hospital_to_home", "manual");
    expect(addTasks).toHaveBeenCalled();
    const calledWith = vi.mocked(addTasks).mock.calls[0][0];
    expect(calledWith.length).toBeGreaterThan(0);
    expect(calledWith[0].source).toBe("playbook");
  });

  it("different playbooks activate independently", () => {
    const result1 = activatePlaybook("hospital_to_home", "life_event");
    const result2 = activatePlaybook("home_to_assisted_living", "manual");

    expect(result1.alreadyActivated).toBe(false);
    expect(result2.alreadyActivated).toBe(false);

    const activations = getAllActivations();
    expect(activations).toHaveLength(2);
  });
});

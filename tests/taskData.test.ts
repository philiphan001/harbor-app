import { describe, it, expect, beforeEach } from "vitest";
import {
  saveTaskData,
  getTaskData,
  getAllTaskData,
  getTaskDataForParent,
  removeTaskData,
  deleteTaskDataForParent,
  clearAllTaskData,
} from "@/lib/utils/taskData";

describe("Task Data CRUD", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and retrieves task data", () => {
    // Set up active parent
    localStorage.setItem("harbor_active_parent_id", "parent-1");

    saveTaskData("Get doctor info", "save_doctor_info", {
      name: "Dr. Smith",
      phone: "555-1234",
    });

    const data = getTaskData("Get doctor info");
    expect(data).not.toBeNull();
    expect(data!.toolName).toBe("save_doctor_info");
    expect(data!.parentId).toBe("parent-1");
  });

  it("updates existing task data for same title and parent", () => {
    localStorage.setItem("harbor_active_parent_id", "parent-1");

    saveTaskData("Get doctor info", "save_doctor_info", {
      name: "Dr. Smith",
      phone: "555-1234",
    });

    saveTaskData("Get doctor info", "save_doctor_info", {
      name: "Dr. Jones",
      phone: "555-5678",
    });

    const allData = getAllTaskData();
    expect(allData).toHaveLength(1);
    expect((allData[0].data as { name: string }).name).toBe("Dr. Jones");
  });

  it("scopes task data to active parent", () => {
    localStorage.setItem("harbor_active_parent_id", "parent-1");
    saveTaskData("Task A", "save_doctor_info", { name: "Dr. A", phone: "111" });

    localStorage.setItem("harbor_active_parent_id", "parent-2");
    saveTaskData("Task B", "save_doctor_info", { name: "Dr. B", phone: "222" });

    // getAllTaskData returns only active parent's data
    const parent2Data = getAllTaskData();
    expect(parent2Data).toHaveLength(1);
    expect(parent2Data[0].taskTitle).toBe("Task B");

    // Switch back
    localStorage.setItem("harbor_active_parent_id", "parent-1");
    const parent1Data = getAllTaskData();
    expect(parent1Data).toHaveLength(1);
    expect(parent1Data[0].taskTitle).toBe("Task A");
  });

  it("getTaskDataForParent retrieves by parent ID", () => {
    localStorage.setItem("harbor_active_parent_id", "parent-1");
    saveTaskData("Task A", "save_doctor_info", { name: "Dr. A", phone: "111" });

    localStorage.setItem("harbor_active_parent_id", "parent-2");
    saveTaskData("Task B", "save_doctor_info", { name: "Dr. B", phone: "222" });

    const parent1Data = getTaskDataForParent("parent-1");
    expect(parent1Data).toHaveLength(1);
    expect(parent1Data[0].taskTitle).toBe("Task A");
  });

  it("removeTaskData removes specific task for active parent", () => {
    localStorage.setItem("harbor_active_parent_id", "parent-1");
    saveTaskData("Task A", "save_doctor_info", { name: "Dr. A", phone: "111" });
    saveTaskData("Task B", "save_medication_list", { medications: [] });

    removeTaskData("Task A");

    const data = getAllTaskData();
    expect(data).toHaveLength(1);
    expect(data[0].taskTitle).toBe("Task B");
  });

  it("deleteTaskDataForParent removes all data for a parent", () => {
    localStorage.setItem("harbor_active_parent_id", "parent-1");
    saveTaskData("Task A", "save_doctor_info", { name: "Dr. A", phone: "111" });
    saveTaskData("Task B", "save_medication_list", { medications: [] });

    localStorage.setItem("harbor_active_parent_id", "parent-2");
    saveTaskData("Task C", "save_doctor_info", { name: "Dr. C", phone: "333" });

    deleteTaskDataForParent("parent-1");

    // Parent 2's data should remain
    const parent2Data = getTaskDataForParent("parent-2");
    expect(parent2Data).toHaveLength(1);

    // Parent 1's data should be gone
    const parent1Data = getTaskDataForParent("parent-1");
    expect(parent1Data).toHaveLength(0);
  });

  it("clearAllTaskData removes everything", () => {
    localStorage.setItem("harbor_active_parent_id", "parent-1");
    saveTaskData("Task A", "save_doctor_info", { name: "Dr. A", phone: "111" });

    clearAllTaskData();

    expect(getAllTaskData()).toHaveLength(0);
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import {
  getAllParentProfiles,
  getActiveParentId,
  setActiveParentId,
  getParentProfile,
  saveParentProfile,
  updateParentProfile,
  clearParentProfile,
  deleteParentProfile,
  extractStateFromText,
  extractNameFromText,
  extractAgeFromText,
} from "@/lib/utils/parentProfile";

describe("Parent Profile CRUD", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array when no profiles exist", () => {
    expect(getAllParentProfiles()).toEqual([]);
  });

  it("returns null for active parent when none set", () => {
    expect(getActiveParentId()).toBeNull();
  });

  it("saves a new profile and sets it as active", () => {
    saveParentProfile({ name: "Jane Doe", age: 78, state: "FL" });

    const profiles = getAllParentProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe("Jane Doe");
    expect(profiles[0].age).toBe(78);
    expect(profiles[0].state).toBe("FL");
    expect(profiles[0].id).toBe("jane-doe");

    // Should auto-set as active since it's the only profile
    expect(getActiveParentId()).toBe("jane-doe");
  });

  it("updates an existing profile by ID", () => {
    saveParentProfile({ name: "Jane Doe", age: 78 });
    saveParentProfile({ name: "Jane Doe", age: 79 }); // Same name → same ID

    const profiles = getAllParentProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].age).toBe(79);
  });

  it("supports multiple profiles", () => {
    saveParentProfile({ name: "Jane Doe" });
    saveParentProfile({ name: "Bob Smith" });

    const profiles = getAllParentProfiles();
    expect(profiles).toHaveLength(2);
  });

  it("getParentProfile returns the active profile", () => {
    saveParentProfile({ name: "Jane Doe", age: 78 });
    saveParentProfile({ name: "Bob Smith", age: 82 });
    setActiveParentId("bob-smith");

    const profile = getParentProfile();
    expect(profile?.name).toBe("Bob Smith");
  });

  it("getParentProfile falls back to first profile if active ID is invalid", () => {
    saveParentProfile({ name: "Jane Doe", age: 78 });
    setActiveParentId("nonexistent");

    const profile = getParentProfile();
    expect(profile?.name).toBe("Jane Doe");
  });

  it("getParentProfile can retrieve by specific ID", () => {
    saveParentProfile({ name: "Jane Doe", age: 78 });
    saveParentProfile({ name: "Bob Smith", age: 82 });

    const profile = getParentProfile("jane-doe");
    expect(profile?.name).toBe("Jane Doe");
  });

  it("updateParentProfile merges updates into active profile", () => {
    saveParentProfile({ name: "Jane Doe", age: 78 });
    updateParentProfile({ age: 79, state: "NY" });

    const profile = getParentProfile();
    expect(profile?.age).toBe(79);
    expect(profile?.state).toBe("NY");
    expect(profile?.name).toBe("Jane Doe");
  });

  it("clearParentProfile removes all profiles", () => {
    saveParentProfile({ name: "Jane Doe" });
    saveParentProfile({ name: "Bob Smith" });
    clearParentProfile();

    expect(getAllParentProfiles()).toEqual([]);
    expect(getActiveParentId()).toBeNull();
  });

  it("deleteParentProfile removes a specific profile", () => {
    saveParentProfile({ name: "Jane Doe" });
    saveParentProfile({ name: "Bob Smith" });
    setActiveParentId("jane-doe");

    deleteParentProfile("jane-doe");

    const profiles = getAllParentProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe("Bob Smith");

    // Active should switch to remaining profile
    expect(getActiveParentId()).toBe("bob-smith");
  });

  it("deleteParentProfile returns null when last profile is deleted", () => {
    saveParentProfile({ name: "Jane Doe" });
    const result = deleteParentProfile("jane-doe");

    expect(result).toBeNull();
    expect(getAllParentProfiles()).toHaveLength(0);
  });
});

describe("extractStateFromText", () => {
  it("extracts state from full name", () => {
    expect(extractStateFromText("She lives in California")).toBe("CA");
    expect(extractStateFromText("from Florida")).toBe("FL");
    expect(extractStateFromText("in Texas")).toBe("TX");
  });

  it("extracts state from city name", () => {
    expect(extractStateFromText("She's in Miami")).toBe("FL");
    expect(extractStateFromText("lives in Houston")).toBe("TX");
    expect(extractStateFromText("in Manhattan")).toBe("NY");
  });

  it("extracts from abbreviation patterns", () => {
    expect(extractStateFromText("lives in FL")).toBe("FL");
    expect(extractStateFromText("in NY")).toBe("NY");
  });

  it("returns null for unrecognized locations", () => {
    expect(extractStateFromText("somewhere in the country")).toBeNull();
    expect(extractStateFromText("")).toBeNull();
  });
});

describe("extractNameFromText", () => {
  it("extracts name from 'name is' pattern", () => {
    expect(extractNameFromText("Her name is Mary")).toBe("Mary");
    expect(extractNameFromText("name is Robert Smith")).toBe("Robert Smith");
  });

  it("extracts name from 'my mom' pattern", () => {
    expect(extractNameFromText("my mom Jane")).toBe("Jane");
    expect(extractNameFromText("my father Robert")).toBe("Robert");
  });

  it("extracts standalone name", () => {
    expect(extractNameFromText("Jane")).toBe("Jane");
  });

  it("returns null for unrecognized text", () => {
    expect(extractNameFromText("she's doing okay")).toBeNull();
    expect(extractNameFromText("")).toBeNull();
  });
});

describe("extractAgeFromText", () => {
  it("extracts age from 'years old' pattern", () => {
    expect(extractAgeFromText("she's 83 years old")).toBe(83);
    expect(extractAgeFromText("78 y.o.")).toBe(78);
  });

  it("extracts age from 'is' pattern", () => {
    expect(extractAgeFromText("she's 75")).toBe(75);
    expect(extractAgeFromText("he's 82")).toBe(82);
  });

  it("extracts age from 'age' pattern", () => {
    expect(extractAgeFromText("age 90")).toBe(90);
  });

  it("rejects ages outside 50-120 range", () => {
    expect(extractAgeFromText("she's 25 years old")).toBeNull();
    expect(extractAgeFromText("age 45")).toBeNull();
  });

  it("returns null for no age found", () => {
    expect(extractAgeFromText("doing well")).toBeNull();
    expect(extractAgeFromText("")).toBeNull();
  });
});

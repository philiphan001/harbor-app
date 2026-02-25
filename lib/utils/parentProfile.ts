// Parent Profile Storage
// Supports multiple parents with active parent switching
// Write-through: saves to localStorage (fast) + Supabase (persistent)

export interface ParentProfile {
  id: string; // Unique identifier for parent
  name: string;
  age?: number;
  state?: string; // Two-letter state code (e.g., "FL")
  city?: string;
  zip?: string;
  livingArrangement?: string;
  healthStatus?: string;
  selectedDomains?: import("@/lib/constants/domains").Domain[];
  lastUpdated: string;
}

const PROFILES_KEY = "harbor_parent_profiles"; // Array of all parent profiles
const ACTIVE_PARENT_KEY = "harbor_active_parent_id"; // Currently selected parent ID

// --- Write-through to Supabase (fire-and-forget) ---

function syncProfileToDb(profile: ParentProfile): void {
  fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      parentId: profile.id,
      name: profile.name,
      age: profile.age,
      state: profile.state,
      city: profile.city,
      zip: profile.zip,
      livingArrangement: profile.livingArrangement,
      healthStatus: profile.healthStatus,
      selectedDomains: profile.selectedDomains,
    }),
  }).catch(() => {
    // Silently fail — localStorage is the fallback
  });
}

function deleteProfileFromDb(parentId: string): void {
  fetch(`/api/profile?parentId=${encodeURIComponent(parentId)}`, {
    method: "DELETE",
  }).catch(() => {});
}

/**
 * Hydrate localStorage from the database.
 * If force=true, always overwrites localStorage with DB data (DB is source of truth).
 * If force=false (default), only hydrates when localStorage is empty.
 */
export async function hydrateProfilesFromDb(force = false): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Skip if localStorage has data and not forcing
  if (!force) {
    const existing = getAllParentProfiles();
    if (existing.length > 0) return false;
  }

  try {
    const response = await fetch("/api/profile");
    if (!response.ok) return false;

    const { profiles } = await response.json();
    if (!profiles || profiles.length === 0) return false;

    const localProfiles: ParentProfile[] = profiles.map(
      (p: { parentId: string; name: string; age?: number; state?: string; city?: string; zip?: string; livingArrangement?: string; healthStatus?: string; selectedDomains?: import("@/lib/constants/domains").Domain[]; lastUpdated: string }) => ({
        id: p.parentId,
        name: p.name,
        age: p.age,
        state: p.state,
        city: p.city,
        zip: p.zip,
        livingArrangement: p.livingArrangement,
        healthStatus: p.healthStatus,
        selectedDomains: p.selectedDomains,
        lastUpdated: p.lastUpdated,
      })
    );

    localStorage.setItem(PROFILES_KEY, JSON.stringify(localProfiles));

    // Preserve active parent if valid, otherwise default to first
    const currentActive = getActiveParentId();
    const isStillValid = localProfiles.some((p) => p.id === currentActive);
    if (!isStillValid && localProfiles.length > 0) {
      setActiveParentId(localProfiles[0].id);
    }

    return true;
  } catch {
    // DB unavailable — localStorage is the fallback
    return false;
  }
}

// Generate a simple ID from name
function generateParentId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// Get all parent profiles
export function getAllParentProfiles(): ParentProfile[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(PROFILES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading parent profiles from localStorage:", error);
    return [];
  }
}

// Get the active parent ID
export function getActiveParentId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(ACTIVE_PARENT_KEY);
  } catch (error) {
    console.error("Error reading active parent ID:", error);
    return null;
  }
}

// Set the active parent ID
export function setActiveParentId(parentId: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(ACTIVE_PARENT_KEY, parentId);
    console.log("👤 Active parent set to:", parentId);
  } catch (error) {
    console.error("Error setting active parent ID:", error);
  }
}

// Get a parent profile by ID, or the currently active one
export function getParentProfile(parentId?: string): ParentProfile | null {
  if (typeof window === "undefined") return null;

  const profiles = getAllParentProfiles();
  if (profiles.length === 0) return null;

  // If a specific ID was requested, return that profile
  if (parentId) {
    return profiles.find(p => p.id === parentId) || null;
  }

  // Otherwise get the active profile
  const activeId = getActiveParentId();

  // If there's an active ID, return that profile
  if (activeId) {
    const profile = profiles.find(p => p.id === activeId);
    if (profile) return profile;
  }

  // Otherwise return the first profile (and set it as active)
  const firstProfile = profiles[0];
  setActiveParentId(firstProfile.id);
  return firstProfile;
}

// Save or update a parent profile
export function saveParentProfile(profile: Partial<ParentProfile> & { name: string }): void {
  if (typeof window === "undefined") return;

  try {
    const profiles = getAllParentProfiles();
    const parentId = profile.id || generateParentId(profile.name);

    const existingIndex = profiles.findIndex(p => p.id === parentId);

    if (existingIndex >= 0) {
      // Update existing profile
      profiles[existingIndex] = {
        ...profiles[existingIndex],
        ...profile,
        id: parentId,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Add new profile
      const newProfile: ParentProfile = {
        id: parentId,
        name: profile.name,
        age: profile.age,
        state: profile.state,
        city: profile.city,
        zip: profile.zip,
        livingArrangement: profile.livingArrangement,
        healthStatus: profile.healthStatus,
        selectedDomains: profile.selectedDomains,
        lastUpdated: new Date().toISOString()
      };
      profiles.push(newProfile);
    }

    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

    // If this is the only profile or no active parent is set, make it active
    if (profiles.length === 1 || !getActiveParentId()) {
      setActiveParentId(parentId);
    }

    // Write-through to Supabase
    const savedProfile = profiles.find(p => p.id === parentId);
    if (savedProfile) syncProfileToDb(savedProfile);

    console.log("💾 Parent profile saved:", parentId);
  } catch (error) {
    console.error("Error saving parent profile:", error);
  }
}

export function updateParentProfile(updates: Partial<ParentProfile>): void {
  const activeProfile = getParentProfile();
  if (!activeProfile) return;

  saveParentProfile({
    ...activeProfile,
    ...updates
  });
}

export function clearParentProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILES_KEY);
  localStorage.removeItem(ACTIVE_PARENT_KEY);
}

/**
 * Delete a specific parent profile and switch active parent if needed.
 * Returns the new active parent ID (or null if no parents remain).
 */
export function deleteParentProfile(parentId: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const profiles = getAllParentProfiles();
    const filtered = profiles.filter((p) => p.id !== parentId);

    localStorage.setItem(PROFILES_KEY, JSON.stringify(filtered));

    // Write-through to Supabase
    deleteProfileFromDb(parentId);

    // If we deleted the active parent, switch to another
    const activeId = getActiveParentId();
    if (activeId === parentId) {
      if (filtered.length > 0) {
        setActiveParentId(filtered[0].id);
        return filtered[0].id;
      } else {
        localStorage.removeItem(ACTIVE_PARENT_KEY);
        return null;
      }
    }

    return activeId;
  } catch (error) {
    console.error("Error deleting parent profile:", error);
    return null;
  }
}

// Helper to extract state from common phrases
export function extractStateFromText(text: string): string | null {
  const lowerText = text.toLowerCase();

  // State name to code mapping
  const stateMap: Record<string, string> = {
    // Top 10 states we support
    "california": "CA",
    "texas": "TX",
    "florida": "FL",
    "new york": "NY",
    "pennsylvania": "PA",

    // Common abbreviations in text
    "ca": "CA",
    "tx": "TX",
    "fl": "FL",
    "fla": "FL",
    "ny": "NY",
    "pa": "PA",

    // Cities that commonly indicate state
    "los angeles": "CA",
    "san francisco": "CA",
    "san diego": "CA",
    "houston": "TX",
    "dallas": "TX",
    "austin": "TX",
    "miami": "FL",
    "tampa": "FL",
    "orlando": "FL",
    "jacksonville": "FL",
    "new york city": "NY",
    "nyc": "NY",
    "brooklyn": "NY",
    "manhattan": "NY",
    "philadelphia": "PA",
    "pittsburgh": "PA"
  };

  // Check for state names or codes
  for (const [key, code] of Object.entries(stateMap)) {
    if (lowerText.includes(key)) {
      return code;
    }
  }

  // Check for pattern "lives in XX" or "in XX"
  const statePatterns = [
    /\blives in ([A-Z]{2})\b/i,
    /\bin ([A-Z]{2})\b/i,
    /\b([A-Z]{2}) resident/i
  ];

  for (const pattern of statePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const potentialState = match[1].toUpperCase();
      // Validate it's a real state code
      if (Object.values(stateMap).includes(potentialState)) {
        return potentialState;
      }
    }
  }

  return null;
}

// Helper to extract name from common phrases
export function extractNameFromText(text: string): string | null {
  // Patterns like "my mom's name is Jane" or "her name is Mary"
  const namePatterns = [
    /(?:name is|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /(?:my (?:mom|mother|dad|father|parent))\s+([A-Z][a-z]+)/,
    /^([A-Z][a-z]+)(?:\s+[A-Z][a-z]+)?$/  // Just a name
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

// Helper to extract age
export function extractAgeFromText(text: string): number | null {
  // Patterns like "she's 83" or "83 years old"
  const agePatterns = [
    /\b(\d{2})\s*(?:years old|y\.?o\.?)\b/i,
    /\b(?:is|she's|he's|they're)\s*(\d{2})\b/,
    /\bage\s*(\d{2})\b/i
  ];

  for (const pattern of agePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const age = parseInt(match[1], 10);
      // Sanity check - age should be 50-120
      if (age >= 50 && age <= 120) {
        return age;
      }
    }
  }

  return null;
}

// Parent Profile Storage
// Stores basic parent information gathered during intake

export interface ParentProfile {
  name?: string;
  age?: number;
  state?: string; // Two-letter state code (e.g., "FL")
  livingArrangement?: string;
  healthStatus?: string;
  lastUpdated: string;
}

const PROFILE_KEY = "harbor_parent_profile";

export function getParentProfile(): ParentProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error reading parent profile from localStorage:", error);
    return null;
  }
}

export function saveParentProfile(profile: Partial<ParentProfile>): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getParentProfile() || {};
    const updated = {
      ...existing,
      ...profile,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    console.log("💾 Parent profile updated:", updated);
  } catch (error) {
    console.error("Error saving parent profile to localStorage:", error);
  }
}

export function updateParentProfile(updates: Partial<ParentProfile>): void {
  saveParentProfile(updates);
}

export function clearParentProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
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

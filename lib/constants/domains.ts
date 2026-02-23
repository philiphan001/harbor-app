// ============================================================
// Shared domain, color, and priority constants for Harbor
// Single source of truth — import from here, never redefine
// ============================================================

// --- Domain Types ---

/** Core assessment domains (used in readiness intake) */
export type Domain = "medical" | "legal" | "financial" | "housing" | "transportation";

/** Extended domains (used in tasks, signals, agents) */
export type ExtendedDomain =
  | Domain
  | "family"
  | "caregiving"
  | "general";

/** Ordered list of core domains (assessment order) */
export const DOMAINS: Domain[] = ["medical", "legal", "financial", "housing", "transportation"];

/** Domain display labels */
export const DOMAIN_LABELS: Record<Domain, string> = {
  medical: "Medical",
  legal: "Legal",
  financial: "Financial",
  housing: "Housing",
  transportation: "Transportation",
};

/** Extended domain labels (includes family/caregiving/general) */
export const EXTENDED_DOMAIN_LABELS: Record<ExtendedDomain, string> = {
  medical: "Medical",
  legal: "Legal",
  financial: "Financial",
  housing: "Housing",
  transportation: "Transportation",
  family: "Family",
  caregiving: "Caregiving",
  general: "General",
};

// --- Colors ---

/** Hex colors for each domain (for inline styles) */
export const DOMAIN_COLORS: Record<ExtendedDomain, string> = {
  medical: "#D4725C",   // coral
  legal: "#6B8F71",     // sage
  financial: "#1B6B7D", // ocean
  housing: "#C4943A",   // amber
  transportation: "#7B68A8", // purple
  family: "#4A6274",    // slateMid
  caregiving: "#2A8FA4", // oceanMid
  general: "#7F9BAC",   // slateLight
};

/** Tailwind bg classes for core domains (for className usage) */
export const DOMAIN_BG_CLASSES: Record<Domain, { solid: string; faded: string }> = {
  medical: { solid: "bg-coral", faded: "bg-coral/40" },
  legal: { solid: "bg-sage", faded: "bg-sage/40" },
  financial: { solid: "bg-ocean", faded: "bg-ocean/40" },
  housing: { solid: "bg-amber", faded: "bg-amber/40" },
  transportation: { solid: "bg-purple-500", faded: "bg-purple-500/40" },
};

// --- Domain Icons ---

/** Unicode icons for each domain */
export const DOMAIN_ICONS: Record<ExtendedDomain, string> = {
  medical: "\u2665",    // ♥
  financial: "\u25C8",  // ◈
  legal: "\u25C9",      // ◉
  housing: "\u2302",    // ⌂
  transportation: "\u2708", // ✈ (transport)
  family: "\u25CE",     // ◎
  caregiving: "\u2726", // ✦
  general: "\u25CF",    // ●
};

// --- Priority ---

export type Priority = "high" | "medium" | "low";

/** Priority display labels */
export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Urgent",
  medium: "Important",
  low: "When you can",
};

/** Hex colors for priorities (for inline styles) */
export const PRIORITY_COLORS: Record<Priority, string> = {
  high: "#D4725C",   // coral
  medium: "#C4943A", // amber
  low: "#6B8F71",    // sage
};

/** Tailwind bg classes for priorities */
export const PRIORITY_BG_CLASSES: Record<Priority, string> = {
  high: "bg-coral",
  medium: "bg-amber",
  low: "bg-sage",
};

// --- Severity ---

export type Severity = "critical" | "high" | "medium" | "low";

/** Severity colors (superset of priority, adds "critical") */
export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#D4725C", // coral
  high: "#D4725C",     // coral
  medium: "#C4943A",   // amber
  low: "#6B8F71",      // sage
};

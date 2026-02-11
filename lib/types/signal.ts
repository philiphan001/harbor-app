// Signal data model for monitoring agent outputs

export interface Signal {
  id: string;
  agentId: string; // Which agent detected it (e.g., "calendar_monitor", "policy_monitor")
  parentId: string; // Which parent it affects
  domain: "medical" | "financial" | "legal" | "housing" | "family" | "caregiving" | "general";
  title: string; // Short headline
  description: string; // Full explanation
  priority: "high" | "medium" | "low";
  relevanceScore: number; // 0-100 from Judgment Agent
  actionable: boolean; // Does this need user action?
  actionItems?: string[]; // Suggested next steps
  detectedAt: string; // ISO timestamp when signal was generated
  expiresAt?: string; // Optional deadline or expiration
  sourceUrl?: string; // Reference link
  metadata: Record<string, any>; // Agent-specific data

  // UI state
  read: boolean;
  dismissed: boolean;
  taskCreated?: boolean;
}

export interface SignalWithJudgment extends Signal {
  judgmentReasoning: string; // Why this score was given
  suggestedPriority: "high" | "medium" | "low";
}

// ==================== Helper Functions ====================

export function createSignal(
  agentId: string,
  parentId: string,
  domain: Signal["domain"],
  title: string,
  description: string,
  priority: Signal["priority"],
  options: Partial<Signal> = {}
): Signal {
  return {
    id: `signal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    agentId,
    parentId,
    domain,
    title,
    description,
    priority,
    relevanceScore: 0, // Will be set by Judgment Agent
    actionable: false, // Will be determined by Judgment Agent
    detectedAt: new Date().toISOString(),
    metadata: {},
    read: false,
    dismissed: false,
    ...options,
  };
}

export function formatSignalDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function getSignalIcon(domain: Signal["domain"]): string {
  const icons: Record<Signal["domain"], string> = {
    medical: "♥",
    financial: "◈",
    legal: "◉",
    housing: "⌂",
    family: "◎",
    caregiving: "✦",
    general: "●",
  };
  return icons[domain];
}

export function getSignalColor(priority: Signal["priority"]): string {
  const colors: Record<Signal["priority"], string> = {
    high: "#D4725C", // coral
    medium: "#C9A961", // amber
    low: "#6B8F71", // sage
  };
  return colors[priority];
}

// Agent types and activity tracking

// External Intelligence Agents (fetch data from external sources)
export type ExternalAgentType = "drug_recall" | "policy_monitor" | "provider_monitor" | "financial_monitor" | "news_monitor" | "benefit_eligibility" | "lifecycle_milestone";

// Internal Utility Agents (monitor user's own data - future implementation)
export type InternalAgentType = "calendar_reminder" | "deadline_tracker" | "task_prioritizer" | "weekly_summary";

export type AgentType = ExternalAgentType | InternalAgentType;

export type AgentStatus = "active" | "running" | "idle" | "error";

export interface AgentRun {
  id: string;
  agentType: AgentType;
  startedAt: string;
  completedAt?: string;
  status: "running" | "completed" | "failed";
  detectionsCount: number;
  error?: string;
  dataSource?: string; // e.g., "Medicare.gov", "CMS.gov"
}

export interface AgentDetection {
  id: string;
  agentType: AgentType;
  runId: string;
  detectedAt: string;
  title: string;
  description: string;
  relevanceScore: "high" | "medium" | "low"; // From judgment agent
  domain: "medical" | "financial" | "legal" | "housing" | "caregiving";
  actionable: boolean; // Should this create a task?
  dueDate?: string; // If it's a deadline
  handled: boolean; // User marked as handled
  convertedToTask?: boolean; // Auto-created task
  sourceUrl?: string; // Link to source data
  dataSource?: string; // Where it came from
}

export interface AgentContext {
  parentId?: string;
  parentName?: string;
  parentAge?: number;
  parentState?: string;
  activeDomains: string[]; // Which areas user is focused on
  existingTasks: string[]; // Task titles to avoid duplicates
  lastRunTimes: Record<AgentType, string>; // When each agent last ran
}

export interface AgentActivity {
  agents: Array<{
    type: AgentType;
    name: string;
    description: string;
    status: AgentStatus;
    lastRun?: string;
    nextRun?: string;
    runsToday: number;
    dataSource?: string; // What external source it monitors
  }>;
  recentDetections: AgentDetection[];
  context: AgentContext;
}

// External Intelligence Agent metadata (what we show on monitoring page)
export const EXTERNAL_AGENT_METADATA: Record<
  ExternalAgentType,
  { name: string; description: string; icon: string; schedule: string; dataSource: string }
> = {
  drug_recall: {
    name: "Drug Recall Monitor",
    description: "Monitors FDA drug recalls and safety alerts cross-referenced against your parent's saved medications",
    icon: "💊",
    schedule: "Daily at 3am PT",
    dataSource: "FDA openFDA API",
  },
  policy_monitor: {
    name: "Policy Monitor",
    description: "Monitors Medicare, Medicaid, and state policy changes for premium updates, coverage rule changes, and enrollment period reminders",
    icon: "🔍",
    schedule: "Daily at 3am PT",
    dataSource: "Medicare.gov, Medicaid.gov, State DSHS",
  },
  provider_monitor: {
    name: "Provider Monitor",
    description: "Tracks CMS nursing home ratings, doctor office changes, facility inspections, and safety violations",
    icon: "🏥",
    schedule: "Daily at 3am PT",
    dataSource: "CMS.gov, State Health Dept",
  },
  financial_monitor: {
    name: "Financial Monitor",
    description: "Calculates spend-down trajectory, Medicaid eligibility windows, and benefit program qualifications based on your parent's financial data",
    icon: "💰",
    schedule: "Daily at 3am PT",
    dataSource: "Internal calculations + eligibility APIs",
  },
  news_monitor: {
    name: "News & Alerts Monitor",
    description: "Scans elder care news, recalls, safety alerts, and state-specific announcements relevant to your parent's situation",
    icon: "📰",
    schedule: "Every 6 hours",
    dataSource: "FDA, CDC, State agencies, News APIs",
  },
  benefit_eligibility: {
    name: "Benefit Eligibility Scanner",
    description: "Cross-references your parent's profile against 17 federal and state benefit programs to surface programs they may qualify for",
    icon: "🎯",
    schedule: "On profile update",
    dataSource: "Internal calculations",
  },
  lifecycle_milestone: {
    name: "Lifecycle Milestone Tracker",
    description: "Evaluates age-based, calendar, event, threshold, and document expiry triggers to surface upcoming milestones and deadlines for your parent",
    icon: "📅",
    schedule: "On profile update",
    dataSource: "Internal calculations",
  },
};

// Internal Utility Agent metadata (future - for user's own data)
export const INTERNAL_AGENT_METADATA: Record<
  InternalAgentType,
  { name: string; description: string; icon: string; schedule: string }
> = {
  calendar_reminder: {
    name: "Calendar Reminder",
    description: "Reminds you about upcoming appointments and medical visits you've entered",
    icon: "📅",
    schedule: "Daily at 8am",
  },
  deadline_tracker: {
    name: "Deadline Tracker",
    description: "Tracks your tasks with due dates and sends reminders as deadlines approach",
    icon: "⏰",
    schedule: "Every 6 hours",
  },
  task_prioritizer: {
    name: "Task Prioritizer",
    description: "Analyzes your task list and surfaces the most important items based on urgency and impact",
    icon: "🎯",
    schedule: "Real-time",
  },
  weekly_summary: {
    name: "Weekly Summary",
    description: "Generates a summary of your care activities, tasks completed, and progress made this week",
    icon: "📊",
    schedule: "Sundays at 8am",
  },
};

// Combined metadata for backward compatibility
export const AGENT_METADATA = {
  ...EXTERNAL_AGENT_METADATA,
  ...INTERNAL_AGENT_METADATA,
};

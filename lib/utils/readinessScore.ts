// Calculate readiness score based on captured data + completed tasks

import { getParentProfile } from "./parentProfile";
import { getAllTaskData } from "./taskData";
import { getTasks, getCompletedTasks } from "./taskStorage";

export interface ReadinessBreakdown {
  overall: number; // 0-100
  domains: {
    medical: number;
    legal: number;
    financial: number;
    housing: number;
    transportation: number;
    social: number;
  };
  criticalGaps: string[];
  completedCount: number;
  pendingCount: number;
  status: "critical" | "needs-attention" | "prepared" | "well-prepared";
}

export type Domain = "medical" | "legal" | "financial" | "housing" | "transportation" | "social";

export interface ReadinessAction {
  id: string;
  label: string;
  domain: Domain;
  points: number;       // overall contribution = round(domainLocalWeight × domainOverallWeight)
  completed: boolean;
}

// Domain weights for overall score
const DOMAIN_WEIGHTS: Record<Domain, number> = {
  medical: 0.20,
  legal: 0.20,
  financial: 0.20,
  housing: 0.15,
  transportation: 0.12,
  social: 0.13,
};

// Scoreable item definitions — single source of truth
interface ScoreableItem {
  id: string;
  label: string;
  domain: Domain;
  localWeight: number;
  isCritical: boolean;
  criticalLabel?: string;
  /** Keywords to match against pending task titles for partial credit */
  pendingKeywords?: string[];
  check: (ctx: CheckContext) => boolean;
}

interface CheckContext {
  hasToolData: (toolName: string) => boolean;
  hasTaskNoteFor: (keyword: string) => boolean;
  hasCompletedTask: (keyword: string) => boolean;
  hasPendingTask: (keyword: string) => boolean;
  profile: ReturnType<typeof getParentProfile>;
}

const SCOREABLE_ITEMS: ScoreableItem[] = [
  // Medical domain
  { id: "doctor", label: "Add primary care doctor contact", domain: "medical", localWeight: 25, isCritical: true, criticalLabel: "Primary care doctor contact",
    pendingKeywords: ["doctor", "pcp", "physician", "primary care"],
    check: (ctx) => ctx.hasToolData("save_doctor_info") || ctx.hasToolData("upload_doctor_card") || ctx.hasCompletedTask("doctor") || ctx.hasCompletedTask("pcp") || ctx.hasCompletedTask("physician") },
  { id: "medications", label: "Record current medications list", domain: "medical", localWeight: 20, isCritical: true, criticalLabel: "Current medications list",
    pendingKeywords: ["medication", "medicine", "prescription"],
    check: (ctx) => ctx.hasToolData("save_medication_list") || ctx.hasToolData("upload_medication") || ctx.hasCompletedTask("medication") || ctx.hasCompletedTask("medicine") },
  { id: "insurance", label: "Add Medicare/insurance information", domain: "medical", localWeight: 25, isCritical: true, criticalLabel: "Medicare/insurance information",
    pendingKeywords: ["insurance", "medicare"],
    check: (ctx) => ctx.hasToolData("save_insurance_info") || ctx.hasToolData("upload_insurance_card") || ctx.hasTaskNoteFor("insurance") || ctx.hasCompletedTask("insurance") || ctx.hasCompletedTask("medicare") },
  { id: "specialist", label: "Add specialist doctor details", domain: "medical", localWeight: 15, isCritical: false,
    pendingKeywords: ["specialist"],
    check: (ctx) => ctx.hasTaskNoteFor("specialist") || ctx.hasCompletedTask("specialist") },
  { id: "pharmacy", label: "Add pharmacy information", domain: "medical", localWeight: 15, isCritical: false,
    pendingKeywords: ["pharmacy"],
    check: (ctx) => ctx.hasTaskNoteFor("pharmacy") || ctx.hasCompletedTask("pharmacy") },
  { id: "hipaa-authorization", label: "Complete HIPAA authorization", domain: "medical", localWeight: 10, isCritical: false,
    pendingKeywords: ["hipaa", "medical record access"],
    check: (ctx) => ctx.hasCompletedTask("hipaa") || ctx.hasTaskNoteFor("hipaa") || ctx.hasTaskNoteFor("medical record access") },
  { id: "fall-risk", label: "Assess fall risk and prevention plan", domain: "medical", localWeight: 10, isCritical: false,
    pendingKeywords: ["fall", "balance", "fall risk", "fall prevention"],
    check: (ctx) => ctx.hasCompletedTask("fall") || ctx.hasCompletedTask("balance") || ctx.hasTaskNoteFor("fall risk") || ctx.hasTaskNoteFor("fall prevention") },

  // Legal domain
  { id: "poa", label: "Record Power of Attorney details", domain: "legal", localWeight: 35, isCritical: true, criticalLabel: "Power of Attorney location/holder",
    pendingKeywords: ["power of attorney", "poa"],
    check: (ctx) => ctx.hasToolData("save_legal_document_info") || ctx.hasTaskNoteFor("power of attorney") || ctx.hasCompletedTask("power of attorney") || ctx.hasCompletedTask("poa") || ctx.hasCompletedTask("proxy") },
  { id: "living-will", label: "Document living will / advance directive", domain: "legal", localWeight: 25, isCritical: true, criticalLabel: "Living will/advance directive",
    pendingKeywords: ["living will", "advance directive", "directive"],
    check: (ctx) => ctx.hasTaskNoteFor("living will") || ctx.hasTaskNoteFor("advance directive") || ctx.hasCompletedTask("living will") || ctx.hasCompletedTask("advance directive") },
  { id: "will-estate", label: "Record will / estate plan details", domain: "legal", localWeight: 20, isCritical: false,
    pendingKeywords: ["will", "estate"],
    check: (ctx) => ctx.hasTaskNoteFor("will") || ctx.hasTaskNoteFor("estate") || ctx.hasCompletedTask("will") || ctx.hasCompletedTask("estate") },
  { id: "attorney", label: "Add attorney / lawyer contact", domain: "legal", localWeight: 20, isCritical: false,
    pendingKeywords: ["attorney", "lawyer"],
    check: (ctx) => ctx.hasTaskNoteFor("attorney") || ctx.hasTaskNoteFor("lawyer") || ctx.hasCompletedTask("attorney") || ctx.hasCompletedTask("lawyer") },

  // Financial domain
  { id: "bank", label: "Add primary bank account information", domain: "financial", localWeight: 25, isCritical: true, criticalLabel: "Primary bank account information",
    pendingKeywords: ["bank", "account"],
    check: (ctx) => ctx.hasTaskNoteFor("bank") || ctx.hasCompletedTask("bank") },
  { id: "income", label: "Document income sources", domain: "financial", localWeight: 20, isCritical: false,
    pendingKeywords: ["income", "social security", "pension"],
    check: (ctx) => ctx.hasTaskNoteFor("income") || ctx.hasCompletedTask("income") },
  { id: "expenses", label: "Record regular expenses and bills", domain: "financial", localWeight: 20, isCritical: false,
    pendingKeywords: ["expense", "bill"],
    check: (ctx) => ctx.hasTaskNoteFor("expense") || ctx.hasTaskNoteFor("bill") || ctx.hasCompletedTask("expense") || ctx.hasCompletedTask("bill") },
  { id: "debt", label: "Document debts and loans", domain: "financial", localWeight: 15, isCritical: false,
    pendingKeywords: ["debt", "loan"],
    check: (ctx) => ctx.hasTaskNoteFor("debt") || ctx.hasTaskNoteFor("loan") || ctx.hasCompletedTask("debt") || ctx.hasCompletedTask("loan") },
  { id: "assets", label: "Record assets and investments", domain: "financial", localWeight: 20, isCritical: false,
    pendingKeywords: ["asset", "investment"],
    check: (ctx) => ctx.hasTaskNoteFor("asset") || ctx.hasTaskNoteFor("investment") || ctx.hasCompletedTask("asset") || ctx.hasCompletedTask("investment") },

  // Housing domain
  { id: "living-arrangement", label: "Record current living arrangement", domain: "housing", localWeight: 30, isCritical: true, criticalLabel: "Current living situation details",
    pendingKeywords: ["living arrangement", "living situation"],
    check: (ctx) => !!ctx.profile?.livingArrangement },
  { id: "housing-details", label: "Add rent / mortgage / ownership details", domain: "housing", localWeight: 25, isCritical: false,
    pendingKeywords: ["rent", "mortgage", "housing"],
    check: (ctx) => ctx.hasTaskNoteFor("rent") || ctx.hasTaskNoteFor("mortgage") || ctx.hasTaskNoteFor("own") || ctx.hasCompletedTask("rent") || ctx.hasCompletedTask("mortgage") || ctx.hasCompletedTask("housing") },
  { id: "housing-cost", label: "Document housing costs", domain: "housing", localWeight: 20, isCritical: false,
    pendingKeywords: ["housing cost", "rent amount"],
    check: (ctx) => ctx.hasTaskNoteFor("housing cost") || ctx.hasTaskNoteFor("rent amount") || ctx.hasCompletedTask("housing cost") },
  { id: "emergency-contact", label: "Add emergency contact besides you", domain: "housing", localWeight: 25, isCritical: true, criticalLabel: "Emergency contact besides you",
    pendingKeywords: ["emergency contact"],
    check: (ctx) => ctx.hasTaskNoteFor("emergency contact") || ctx.hasCompletedTask("emergency contact") },
  { id: "home-safety", label: "Complete home safety assessment", domain: "housing", localWeight: 20, isCritical: false,
    pendingKeywords: ["home safety", "grab bar", "fall hazard", "safety assessment"],
    check: (ctx) => ctx.hasCompletedTask("home safety") || ctx.hasCompletedTask("grab bar") || ctx.hasTaskNoteFor("home safety") || ctx.hasTaskNoteFor("safety assessment") },

  // Transportation domain
  { id: "transport-plan", label: "Set up transportation plan", domain: "transportation", localWeight: 35, isCritical: false,
    pendingKeywords: ["transport", "ride", "driving"],
    check: (ctx) => ctx.hasTaskNoteFor("transport") || ctx.hasTaskNoteFor("ride") || ctx.hasTaskNoteFor("driving") || ctx.hasCompletedTask("transport") || ctx.hasCompletedTask("ride") || ctx.hasCompletedTask("driving") },
  { id: "delivery", label: "Arrange delivery / grocery services", domain: "transportation", localWeight: 30, isCritical: false,
    pendingKeywords: ["delivery", "grocery"],
    check: (ctx) => ctx.hasTaskNoteFor("delivery") || ctx.hasTaskNoteFor("grocery") || ctx.hasCompletedTask("delivery") || ctx.hasCompletedTask("grocery") },
  { id: "medical-transport", label: "Set up medical transport options", domain: "transportation", localWeight: 35, isCritical: true, criticalLabel: "Transportation plan for appointments",
    pendingKeywords: ["senior shuttle", "medical transport"],
    check: (ctx) => ctx.hasTaskNoteFor("senior shuttle") || ctx.hasTaskNoteFor("medical transport") || ctx.hasCompletedTask("senior shuttle") || ctx.hasCompletedTask("medical transport") },
  { id: "mobility-aids", label: "Document mobility aids and accessibility needs", domain: "transportation", localWeight: 10, isCritical: false,
    pendingKeywords: ["mobility", "walker", "wheelchair", "assistive device"],
    check: (ctx) => ctx.hasCompletedTask("mobility") || ctx.hasCompletedTask("walker") || ctx.hasCompletedTask("wheelchair") || ctx.hasTaskNoteFor("mobility") || ctx.hasTaskNoteFor("assistive device") },

  // Social domain
  { id: "social-contacts", label: "Add key social contacts", domain: "social", localWeight: 35, isCritical: true, criticalLabel: "Key social contacts for parent",
    pendingKeywords: ["friend", "neighbor", "social"],
    check: (ctx) => ctx.hasTaskNoteFor("friend") || ctx.hasTaskNoteFor("neighbor") || ctx.hasTaskNoteFor("social") || ctx.hasCompletedTask("friend") || ctx.hasCompletedTask("neighbor") || ctx.hasCompletedTask("social") },
  { id: "community", label: "Connect with community resources", domain: "social", localWeight: 25, isCritical: false,
    pendingKeywords: ["community", "church", "senior center"],
    check: (ctx) => ctx.hasTaskNoteFor("community") || ctx.hasTaskNoteFor("church") || ctx.hasTaskNoteFor("senior center") || ctx.hasCompletedTask("community") || ctx.hasCompletedTask("church") || ctx.hasCompletedTask("senior center") },
  { id: "check-ins", label: "Set up regular check-in schedule", domain: "social", localWeight: 30, isCritical: false,
    pendingKeywords: ["check in", "check-in"],
    check: (ctx) => ctx.hasTaskNoteFor("checks on") || ctx.hasTaskNoteFor("check in") || ctx.hasCompletedTask("checks on") || ctx.hasCompletedTask("check in") },
  { id: "pet-care", label: "Document pet care plan", domain: "social", localWeight: 10, isCritical: false,
    pendingKeywords: ["pet"],
    check: (ctx) => ctx.hasTaskNoteFor("pet") || ctx.hasCompletedTask("pet") },
];

function buildCheckContext(): CheckContext | null {
  const profile = getParentProfile();
  const taskData = getAllTaskData();
  const completedTasks = getCompletedTasks();
  const pendingTasks = getTasks();

  if (!profile) return null;

  const hasToolData = (toolName: string) => taskData.some((d) => d.toolName === toolName);
  const hasTaskNoteFor = (keyword: string) =>
    taskData.some((d) =>
      (d.toolName === "save_task_notes" || d.toolName === "manual_notes" || d.toolName.startsWith("upload_")) &&
      d.taskTitle.toLowerCase().includes(keyword)
    );
  const hasCompletedTask = (keyword: string) =>
    completedTasks.some((t) => t.title.toLowerCase().includes(keyword));
  const hasPendingTask = (keyword: string) =>
    pendingTasks.some((t) => t.title.toLowerCase().includes(keyword));

  return { hasToolData, hasTaskNoteFor, hasCompletedTask, hasPendingTask, profile };
}

/**
 * Calculate readiness score based on captured information + task completion.
 * Only selected domains contribute to the score; unselected domains are excluded.
 */
export function calculateReadinessScore(): ReadinessBreakdown {
  const ctx = buildCheckContext();
  const pendingTasks = getTasks();
  const completedTasks = getCompletedTasks();

  if (!ctx) {
    return {
      overall: 0,
      domains: { medical: 0, legal: 0, financial: 0, housing: 0, transportation: 0, social: 0 },
      criticalGaps: ["No parent profile created"],
      completedCount: 0,
      pendingCount: 0,
      status: "critical",
    };
  }

  // Determine which domains are selected (default to all)
  const profile = getParentProfile();
  const selected: Domain[] = profile?.selectedDomains || (Object.keys(DOMAIN_WEIGHTS) as Domain[]);

  const criticalGaps: string[] = [];
  const domainScores: Record<Domain, number> = {
    medical: 0, legal: 0, financial: 0, housing: 0, transportation: 0, social: 0,
  };

  // Special case: transportation critical gap depends on transport-plan item
  const transportPlanCompleted = SCOREABLE_ITEMS.find(i => i.id === "transport-plan")!.check(ctx);

  // Partial credit weight for having a pending task (not yet completed)
  const PENDING_CREDIT = 0.4;

  for (const item of SCOREABLE_ITEMS) {
    // Skip items for unselected domains
    if (!selected.includes(item.domain)) continue;

    const completed = item.check(ctx);
    if (completed) {
      domainScores[item.domain] += item.localWeight;
    } else {
      // Check if there's a pending task related to this item (partial credit)
      const hasPending = item.pendingKeywords
        ? item.pendingKeywords.some((kw) => ctx.hasPendingTask(kw))
        : false;

      if (hasPending) {
        domainScores[item.domain] += Math.round(item.localWeight * PENDING_CREDIT);
      }

      if (item.isCritical && item.criticalLabel && !hasPending) {
        // Transportation critical gap has special logic in original code
        if (item.id === "medical-transport") {
          if (!transportPlanCompleted) {
            criticalGaps.push("Transportation plan for appointments");
          }
        } else {
          criticalGaps.push(item.criticalLabel);
        }
      }
    }
  }

  // Cap domain scores at 100
  for (const domain of Object.keys(domainScores) as Domain[]) {
    domainScores[domain] = Math.min(domainScores[domain], 100);
  }

  // Re-normalize weights to only selected domains so they sum to 1.0
  const selectedWeightSum = selected.reduce((sum, d) => sum + DOMAIN_WEIGHTS[d], 0);

  // Calculate overall score (weighted average across selected domains only)
  const overall = selectedWeightSum > 0
    ? Math.round(
        selected.reduce(
          (sum, domain) => sum + domainScores[domain] * (DOMAIN_WEIGHTS[domain] / selectedWeightSum),
          0
        )
      )
    : 0;

  // Determine status
  let status: ReadinessBreakdown["status"];
  if (overall < 30) status = "critical";
  else if (overall < 60) status = "needs-attention";
  else if (overall < 85) status = "prepared";
  else status = "well-prepared";

  return {
    overall,
    domains: domainScores,
    criticalGaps: criticalGaps.slice(0, 5),
    completedCount: completedTasks.length,
    pendingCount: pendingTasks.length,
    status,
  };
}

/**
 * Get all scoreable readiness actions with point values and completion status
 */
export function getReadinessActions(): ReadinessAction[] {
  const ctx = buildCheckContext();
  if (!ctx) return [];

  return SCOREABLE_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    domain: item.domain,
    points: Math.round(item.localWeight * DOMAIN_WEIGHTS[item.domain]),
    completed: item.check(ctx),
  }));
}

/**
 * Get the single highest-value incomplete action per selected domain.
 * Used by DomainStatusTiles to show "Do this next" prompts.
 */
export function getNextBestActions(): { domain: Domain; action: string; id: string; points: number }[] {
  const ctx = buildCheckContext();
  if (!ctx) return [];

  const profile = getParentProfile();
  const selected: Domain[] = profile?.selectedDomains || (Object.keys(DOMAIN_WEIGHTS) as Domain[]);

  const bestByDomain = new Map<Domain, { id: string; action: string; points: number; localWeight: number }>();

  for (const item of SCOREABLE_ITEMS) {
    if (!selected.includes(item.domain)) continue;
    if (item.check(ctx)) continue;

    // Skip items that have a pending task (partial credit = in progress)
    const hasPending = item.pendingKeywords
      ? item.pendingKeywords.some((kw) => ctx.hasPendingTask(kw))
      : false;
    if (hasPending) continue;

    const existing = bestByDomain.get(item.domain);
    if (!existing || item.localWeight > existing.localWeight) {
      bestByDomain.set(item.domain, {
        id: item.id,
        action: item.label,
        points: Math.round(item.localWeight * DOMAIN_WEIGHTS[item.domain]),
        localWeight: item.localWeight,
      });
    }
  }

  return Array.from(bestByDomain.entries()).map(([domain, entry]) => ({
    domain,
    action: entry.action,
    id: entry.id,
    points: entry.points,
  }));
}

/**
 * Get status color for readiness score
 */
export function getReadinessColor(score: number): string {
  if (score < 30) return "coral"; // Critical
  if (score < 60) return "amber"; // Needs attention
  if (score < 85) return "ocean"; // Prepared
  return "sage"; // Well prepared
}

/**
 * Get status label for readiness score
 */
export function getReadinessLabel(score: number): string {
  if (score < 30) return "Critical Gaps";
  if (score < 60) return "Needs Attention";
  if (score < 85) return "Prepared";
  return "Well Prepared";
}

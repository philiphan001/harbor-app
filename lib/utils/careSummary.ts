// Build a care summary from captured task data for the dashboard
import { getAllTaskData, type TaskData } from "./taskData";
import { getParentProfile } from "./parentProfile";
import { getCompletedTasks, getTasks } from "./taskStorage";
import type { DoctorInfo, MedicationList, InsuranceInfo, LegalDocumentInfo } from "@/lib/types/taskCapture";
import { getFreshnessStatus, getFreshnessLabel, getWorstFreshness, type FreshnessStatus } from "@/lib/constants/reviewIntervals";

export interface CareSummaryData {
  // Parent basics
  parentName: string;
  parentAge?: number;
  parentState?: string;

  // Medical
  primaryDoctor?: { name: string; phone: string };
  specialists: { name: string; specialty?: string }[];
  medicationCount: number;
  medications: { name: string; dosage: string }[];

  // Insurance
  insurance?: { provider: string; policyNumber: string };

  // Legal
  poaStatus: "completed" | "in-progress" | "unknown";
  poaAgent?: string;
  advanceDirective: "completed" | "in-progress" | "unknown";

  // Meta
  lastUpdated: string | null; // most recent capturedAt
  totalCaptured: number;
  pendingTasks: number;
  completedTasks: number;
}

export interface DomainStatus {
  domain: "medical" | "legal" | "financial" | "housing" | "transportation" | "social";
  label: string;
  icon: string;
  status: "good" | "partial" | "missing";
  summary: string;
  items: string[];
  freshness?: FreshnessStatus;
  freshnessLabel?: string;
}

export function buildCareSummary(): CareSummaryData | null {
  const profile = getParentProfile();
  if (!profile) return null;

  const taskData = getAllTaskData();
  const pending = getTasks();
  const completed = getCompletedTasks();

  // Find primary doctor
  const doctorEntries = taskData.filter(d => d.toolName === "save_doctor_info");
  let primaryDoctor: CareSummaryData["primaryDoctor"];
  const specialists: CareSummaryData["specialists"] = [];

  for (const entry of doctorEntries) {
    const doc = entry.data as DoctorInfo;
    if (!primaryDoctor) {
      primaryDoctor = { name: doc.name, phone: doc.phone };
    }
    if (doc.specialty && doc.specialty.toLowerCase() !== "primary care") {
      specialists.push({ name: doc.name, specialty: doc.specialty });
    }
  }

  // Medications
  const medEntries = taskData.filter(d => d.toolName === "save_medication_list");
  let medicationCount = 0;
  const medications: { name: string; dosage: string }[] = [];
  for (const entry of medEntries) {
    const medList = entry.data as MedicationList;
    if (medList.medications) {
      medicationCount += medList.medications.length;
      for (const med of medList.medications) {
        medications.push({ name: med.name, dosage: med.dosage });
      }
    }
  }

  // Insurance
  const insuranceEntries = taskData.filter(d => d.toolName === "save_insurance_info");
  let insurance: CareSummaryData["insurance"];
  if (insuranceEntries.length > 0) {
    const ins = insuranceEntries[0].data as InsuranceInfo;
    insurance = { provider: ins.provider, policyNumber: ins.policyNumber };
  }

  // Legal
  const legalEntries = taskData.filter(d => d.toolName === "save_legal_document_info");
  let poaStatus: CareSummaryData["poaStatus"] = "unknown";
  let poaAgent: string | undefined;
  let advanceDirective: CareSummaryData["advanceDirective"] = "unknown";

  for (const entry of legalEntries) {
    const legal = entry.data as LegalDocumentInfo;
    const docType = legal.documentType.toLowerCase();
    if (docType.includes("power of attorney") || docType.includes("poa") || docType.includes("proxy")) {
      poaStatus = legal.status.toLowerCase().includes("complete") ? "completed" : "in-progress";
      poaAgent = legal.agent;
    }
    if (docType.includes("advance directive") || docType.includes("living will")) {
      advanceDirective = legal.status.toLowerCase().includes("complete") ? "completed" : "in-progress";
    }
  }

  // Most recent update
  const allDates = taskData.map(d => d.capturedAt).filter(Boolean);
  const lastUpdated = allDates.length > 0
    ? allDates.sort().reverse()[0]
    : null;

  return {
    parentName: profile.name,
    parentAge: profile.age,
    parentState: profile.state,
    primaryDoctor,
    specialists,
    medicationCount,
    medications,
    insurance,
    poaStatus,
    poaAgent,
    advanceDirective,
    lastUpdated,
    totalCaptured: taskData.length,
    pendingTasks: pending.length,
    completedTasks: completed.length,
  };
}

export function buildDomainStatuses(taskData: TaskData[]): DomainStatus[] {
  const statuses: DomainStatus[] = [];

  // Get tasks to factor into domain status
  const allTasks = getTasks();
  const completed = getCompletedTasks();
  const tasksByDomain = (domain: string) => {
    // Tasks use "family" and "caregiving" — map them to the dashboard domains
    const domainAliases: Record<string, string[]> = {
      social: ["social", "family"],
      housing: ["housing"],
      medical: ["medical", "caregiving"],
      legal: ["legal"],
      financial: ["financial"],
      transportation: ["transportation"],
    };
    const aliases = domainAliases[domain] || [domain];
    const pending = allTasks.filter(t => aliases.includes(t.domain));
    const done = completed.filter(t => aliases.includes(t.domain));
    return { pending: pending.length, completed: done.length, total: pending.length + done.length };
  };

  // Helper: determine status and summary combining captured data and tasks
  function domainStatusFromSignals(
    domain: string,
    capturedCount: number,
    capturedThreshold: number,
    capturedLabel: string,
    capturedItems: string[],
  ): Pick<DomainStatus, "status" | "summary" | "items"> {
    const tasks = tasksByDomain(domain);
    const items = [...capturedItems];

    if (tasks.total > 0) {
      if (tasks.completed > 0) items.push(`${tasks.completed} task${tasks.completed !== 1 ? "s" : ""} done`);
      if (tasks.pending > 0) items.push(`${tasks.pending} pending`);
    }

    // Has captured data at threshold → good
    if (capturedCount >= capturedThreshold) {
      return { status: "good", summary: capturedLabel, items };
    }
    // Has some captured data or has tasks → partial
    if (capturedCount >= 1 || tasks.total > 0) {
      const summary = tasks.total > 0 && capturedCount === 0
        ? `${tasks.total} task${tasks.total !== 1 ? "s" : ""} tracked`
        : capturedCount >= 1
          ? `${capturedThreshold - capturedCount} items needed`
          : "Not started";
      return { status: "partial", summary, items };
    }
    return { status: "missing", summary: "Not started", items };
  }

  // Medical
  const hasDoctorInfo = taskData.some(d => d.toolName === "save_doctor_info");
  const hasMeds = taskData.some(d => d.toolName === "save_medication_list");
  const hasInsurance = taskData.some(d => d.toolName === "save_insurance_info");
  const medicalCapturedItems: string[] = [];
  if (hasDoctorInfo) medicalCapturedItems.push("Primary doctor");
  if (hasMeds) medicalCapturedItems.push("Medications");
  if (hasInsurance) medicalCapturedItems.push("Insurance");
  const medicalCount = [hasDoctorInfo, hasMeds, hasInsurance].filter(Boolean).length;
  const medical = domainStatusFromSignals("medical", medicalCount, 3, "Core info captured", medicalCapturedItems);

  statuses.push({ domain: "medical", label: "Medical", icon: "🏥", ...medical });

  // Legal
  const hasLegal = taskData.some(d => d.toolName === "save_legal_document_info");
  const legalNotes = taskData.filter(d =>
    (d.toolName === "save_task_notes" || d.toolName === "manual_notes") &&
    (d.taskTitle.toLowerCase().includes("poa") || d.taskTitle.toLowerCase().includes("will") || d.taskTitle.toLowerCase().includes("proxy") || d.taskTitle.toLowerCase().includes("attorney"))
  );
  const legalCapturedItems: string[] = [];
  if (hasLegal) legalCapturedItems.push("Legal documents");
  if (legalNotes.length > 0) legalCapturedItems.push("Legal notes");
  const legalCapturedCount = (hasLegal ? 1 : 0) + (legalNotes.length > 0 ? 1 : 0);
  const legal = domainStatusFromSignals("legal", legalCapturedCount, 1, "Documents recorded", legalCapturedItems);

  statuses.push({ domain: "legal", label: "Legal", icon: "⚖️", ...legal });

  // Financial
  const financialNotes = taskData.filter(d =>
    (d.toolName === "save_task_notes" || d.toolName === "manual_notes") &&
    (d.taskTitle.toLowerCase().includes("bank") || d.taskTitle.toLowerCase().includes("income") || d.taskTitle.toLowerCase().includes("financial") || d.taskTitle.toLowerCase().includes("bill"))
  );
  const financial = domainStatusFromSignals("financial", financialNotes.length, 2, "Key info captured", financialNotes.map(d => d.taskTitle));

  statuses.push({ domain: "financial", label: "Financial", icon: "💰", ...financial });

  // Housing
  const profile = getParentProfile();
  const housingNotes = taskData.filter(d =>
    (d.toolName === "save_task_notes" || d.toolName === "manual_notes") &&
    (d.taskTitle.toLowerCase().includes("housing") || d.taskTitle.toLowerCase().includes("home") || d.taskTitle.toLowerCase().includes("living") || d.taskTitle.toLowerCase().includes("emergency contact"))
  );
  const housingCapturedItems: string[] = [];
  if (profile?.livingArrangement) housingCapturedItems.push("Living arrangement");
  housingCapturedItems.push(...housingNotes.map(d => d.taskTitle));
  const housingCapturedCount = (profile?.livingArrangement ? 1 : 0) + housingNotes.length;
  const housing = domainStatusFromSignals("housing", housingCapturedCount, 2, "Living situation known", housingCapturedItems);

  statuses.push({ domain: "housing", label: "Housing", icon: "🏠", ...housing });

  // Transportation
  const transportNotes = taskData.filter(d =>
    (d.toolName === "save_task_notes" || d.toolName === "manual_notes") &&
    (d.taskTitle.toLowerCase().includes("transport") || d.taskTitle.toLowerCase().includes("ride") || d.taskTitle.toLowerCase().includes("driving") || d.taskTitle.toLowerCase().includes("delivery"))
  );
  const transport = domainStatusFromSignals("transportation", transportNotes.length, 2, "Transport plan captured", transportNotes.map(d => d.taskTitle));

  statuses.push({ domain: "transportation", label: "Transportation", icon: "🚗", ...transport });

  // Social & Pets
  const socialNotes = taskData.filter(d =>
    (d.toolName === "save_task_notes" || d.toolName === "manual_notes") &&
    (d.taskTitle.toLowerCase().includes("social") || d.taskTitle.toLowerCase().includes("friend") || d.taskTitle.toLowerCase().includes("neighbor") || d.taskTitle.toLowerCase().includes("community") || d.taskTitle.toLowerCase().includes("pet"))
  );
  const social = domainStatusFromSignals("social", socialNotes.length, 2, "Social network captured", socialNotes.map(d => d.taskTitle));

  statuses.push({ domain: "social", label: "Social & Pets", icon: "👥", ...social });

  // Compute freshness for each domain based on its task data entries
  const domainToolMap: Record<string, string[]> = {
    medical: ["save_doctor_info", "save_medication_list", "save_insurance_info"],
    legal: ["save_legal_document_info"],
    financial: ["save_task_notes", "manual_notes"],
    housing: ["save_task_notes", "manual_notes"],
    transportation: ["save_task_notes", "manual_notes"],
    social: ["save_task_notes", "manual_notes"],
  };

  for (const status of statuses) {
    const domainEntries = taskData.filter((d) => {
      const tools = domainToolMap[status.domain] || [];
      return tools.includes(d.toolName);
    });

    if (domainEntries.length > 0) {
      const freshnessStatuses = domainEntries.map((d) =>
        getFreshnessStatus(d.toolName, d.lastReviewedAt, d.capturedAt)
      );
      status.freshness = getWorstFreshness(freshnessStatuses);

      // Find the oldest entry for the label
      const oldestEntry = domainEntries.reduce((oldest, d) => {
        const ref = d.lastReviewedAt || d.capturedAt;
        const oldRef = oldest.lastReviewedAt || oldest.capturedAt;
        return new Date(ref).getTime() < new Date(oldRef).getTime() ? d : oldest;
      });
      status.freshnessLabel = getFreshnessLabel(
        oldestEntry.toolName,
        oldestEntry.lastReviewedAt,
        oldestEntry.capturedAt
      );
    }
  }

  // Filter to only selected domains (if set)
  const profile2 = getParentProfile();
  if (profile2?.selectedDomains) {
    return statuses.filter(s => profile2.selectedDomains!.includes(s.domain));
  }

  return statuses;
}

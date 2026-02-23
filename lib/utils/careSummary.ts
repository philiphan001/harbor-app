// Build a care summary from captured task data for the dashboard
import { getAllTaskData, type TaskData } from "./taskData";
import { getParentProfile } from "./parentProfile";
import { getCompletedTasks, getTasks } from "./taskStorage";
import type { DoctorInfo, MedicationList, InsuranceInfo, LegalDocumentInfo } from "@/lib/types/taskCapture";

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
  domain: "medical" | "legal" | "financial" | "housing" | "transportation";
  label: string;
  icon: string;
  status: "good" | "partial" | "missing";
  summary: string;
  items: string[];
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

  // Medical
  const hasDoctorInfo = taskData.some(d => d.toolName === "save_doctor_info");
  const hasMeds = taskData.some(d => d.toolName === "save_medication_list");
  const hasInsurance = taskData.some(d => d.toolName === "save_insurance_info");
  const medicalItems: string[] = [];
  if (hasDoctorInfo) medicalItems.push("Primary doctor");
  if (hasMeds) medicalItems.push("Medications");
  if (hasInsurance) medicalItems.push("Insurance");
  const medicalCount = [hasDoctorInfo, hasMeds, hasInsurance].filter(Boolean).length;

  statuses.push({
    domain: "medical",
    label: "Medical",
    icon: "🏥",
    status: medicalCount >= 3 ? "good" : medicalCount >= 1 ? "partial" : "missing",
    summary: medicalCount >= 3 ? "Core info captured" : medicalCount >= 1 ? `${3 - medicalCount} items needed` : "Not started",
    items: medicalItems,
  });

  // Legal
  const hasLegal = taskData.some(d => d.toolName === "save_legal_document_info");
  const legalNotes = taskData.filter(d =>
    (d.toolName === "save_task_notes" || d.toolName === "manual_notes") &&
    (d.taskTitle.toLowerCase().includes("poa") || d.taskTitle.toLowerCase().includes("will") || d.taskTitle.toLowerCase().includes("proxy") || d.taskTitle.toLowerCase().includes("attorney"))
  );
  const legalItems: string[] = [];
  if (hasLegal) legalItems.push("Legal documents");
  if (legalNotes.length > 0) legalItems.push("Legal notes");
  const legalCount = hasLegal ? 1 : 0;

  statuses.push({
    domain: "legal",
    label: "Legal",
    icon: "⚖️",
    status: legalCount >= 1 || legalNotes.length > 0 ? (hasLegal ? "good" : "partial") : "missing",
    summary: hasLegal ? "Documents recorded" : legalNotes.length > 0 ? "Notes captured" : "Not started",
    items: legalItems,
  });

  // Financial
  const financialNotes = taskData.filter(d =>
    (d.toolName === "save_task_notes" || d.toolName === "manual_notes") &&
    (d.taskTitle.toLowerCase().includes("bank") || d.taskTitle.toLowerCase().includes("income") || d.taskTitle.toLowerCase().includes("financial") || d.taskTitle.toLowerCase().includes("bill"))
  );
  const financialItems = financialNotes.map(d => d.taskTitle);

  statuses.push({
    domain: "financial",
    label: "Financial",
    icon: "💰",
    status: financialNotes.length >= 2 ? "good" : financialNotes.length >= 1 ? "partial" : "missing",
    summary: financialNotes.length >= 2 ? "Key info captured" : financialNotes.length >= 1 ? "Some info captured" : "Not started",
    items: financialItems,
  });

  // Housing
  const profile = getParentProfile();
  const housingNotes = taskData.filter(d =>
    (d.toolName === "save_task_notes" || d.toolName === "manual_notes") &&
    (d.taskTitle.toLowerCase().includes("housing") || d.taskTitle.toLowerCase().includes("home") || d.taskTitle.toLowerCase().includes("living") || d.taskTitle.toLowerCase().includes("emergency contact"))
  );
  const housingItems: string[] = [];
  if (profile?.livingArrangement) housingItems.push("Living arrangement");
  housingItems.push(...housingNotes.map(d => d.taskTitle));

  statuses.push({
    domain: "housing",
    label: "Housing",
    icon: "🏠",
    status: (profile?.livingArrangement || housingNotes.length > 0) ? (housingNotes.length >= 1 && profile?.livingArrangement ? "good" : "partial") : "missing",
    summary: profile?.livingArrangement ? "Living situation known" : housingNotes.length > 0 ? "Some info captured" : "Not started",
    items: housingItems,
  });

  // Transportation
  const transportNotes = taskData.filter(d =>
    (d.toolName === "save_task_notes" || d.toolName === "manual_notes") &&
    (d.taskTitle.toLowerCase().includes("transport") || d.taskTitle.toLowerCase().includes("ride") || d.taskTitle.toLowerCase().includes("driving") || d.taskTitle.toLowerCase().includes("delivery"))
  );
  const transportItems = transportNotes.map(d => d.taskTitle);

  statuses.push({
    domain: "transportation",
    label: "Transportation",
    icon: "🚗",
    status: transportNotes.length >= 2 ? "good" : transportNotes.length >= 1 ? "partial" : "missing",
    summary: transportNotes.length >= 2 ? "Transport plan captured" : transportNotes.length >= 1 ? "Some info captured" : "Not started",
    items: transportItems,
  });

  return statuses;
}

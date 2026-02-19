// Export care summary data in various formats
import type { CareSummaryData } from "./careSummary";
import { getAllTaskData, type TaskData } from "./taskData";
import { getParentProfile } from "./parentProfile";
import { getCompletedTasks, getTasks } from "./taskStorage";
import type { DoctorInfo, MedicationList, InsuranceInfo, LegalDocumentInfo } from "@/lib/types/taskCapture";

// ==================== Export Scenarios ====================

export type ExportScenario = "er-visit" | "specialist" | "family" | "full";

export interface ExportScenarioConfig {
  id: ExportScenario;
  label: string;
  icon: string;
  description: string;
  sections: ExportSection[];
}

export type ExportSection =
  | "patient-info"
  | "emergency-contacts"
  | "primary-doctor"
  | "specialists"
  | "medications"
  | "conditions"
  | "insurance"
  | "legal"
  | "tasks"
  | "notes";

export const EXPORT_SCENARIOS: ExportScenarioConfig[] = [
  {
    id: "er-visit",
    label: "ER / Urgent Care Visit",
    icon: "🚑",
    description: "Medication list, insurance, conditions, and emergency contacts for a hospital visit",
    sections: ["patient-info", "medications", "conditions", "insurance", "primary-doctor", "emergency-contacts", "legal"],
  },
  {
    id: "specialist",
    label: "New Specialist Appointment",
    icon: "🩺",
    description: "Care summary with doctor info, medications, and medical history",
    sections: ["patient-info", "primary-doctor", "specialists", "medications", "conditions", "insurance"],
  },
  {
    id: "family",
    label: "Share with Family Member",
    icon: "👨‍👩‍👧",
    description: "Full care overview with task progress and action items",
    sections: ["patient-info", "primary-doctor", "medications", "insurance", "legal", "tasks", "notes"],
  },
  {
    id: "full",
    label: "Full Care Summary",
    icon: "📋",
    description: "Complete export of all captured care information",
    sections: ["patient-info", "primary-doctor", "specialists", "medications", "conditions", "insurance", "legal", "emergency-contacts", "tasks", "notes"],
  },
];

// ==================== Data Gathering ====================

export interface ExportData {
  parentName: string;
  parentAge?: number;
  parentState?: string;
  livingArrangement?: string;

  primaryDoctor?: { name: string; phone: string; address?: string; specialty?: string };
  specialists: { name: string; phone?: string; specialty?: string }[];
  medications: { name: string; dosage: string; frequency?: string; purpose?: string }[];
  insurance?: { provider: string; policyNumber: string; groupNumber?: string; phone?: string };

  conditions: string[];
  emergencyContacts: { name: string; phone: string; relationship?: string }[];

  legalDocuments: { type: string; status: string; agent?: string }[];

  pendingTasks: { title: string; priority: string }[];
  completedTasks: { title: string; completedAt?: string }[];

  notes: { title: string; content: string }[];

  generatedAt: string;
}

export function gatherExportData(): ExportData | null {
  const profile = getParentProfile();
  if (!profile) return null;

  const taskData = getAllTaskData();
  const pending = getTasks();
  const completed = getCompletedTasks();

  // Doctors
  const doctorEntries = taskData.filter(d => d.toolName === "save_doctor_info");
  let primaryDoctor: ExportData["primaryDoctor"];
  const specialists: ExportData["specialists"] = [];

  for (const entry of doctorEntries) {
    const doc = entry.data as DoctorInfo;
    if (!primaryDoctor) {
      primaryDoctor = { name: doc.name, phone: doc.phone, address: doc.address, specialty: doc.specialty };
    }
    if (doc.specialty && doc.specialty.toLowerCase() !== "primary care") {
      specialists.push({ name: doc.name, phone: doc.phone, specialty: doc.specialty });
    }
  }

  // Medications
  const medEntries = taskData.filter(d => d.toolName === "save_medication_list");
  const medications: ExportData["medications"] = [];
  for (const entry of medEntries) {
    const medList = entry.data as MedicationList;
    if (medList.medications) {
      for (const med of medList.medications) {
        medications.push({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          purpose: med.purpose,
        });
      }
    }
  }

  // Insurance
  const insuranceEntries = taskData.filter(d => d.toolName === "save_insurance_info");
  let insurance: ExportData["insurance"];
  if (insuranceEntries.length > 0) {
    const ins = insuranceEntries[0].data as InsuranceInfo;
    insurance = { provider: ins.provider, policyNumber: ins.policyNumber, groupNumber: ins.groupNumber, phone: ins.phone };
  }

  // Legal
  const legalEntries = taskData.filter(d => d.toolName === "save_legal_document_info");
  const legalDocuments: ExportData["legalDocuments"] = [];
  for (const entry of legalEntries) {
    const legal = entry.data as LegalDocumentInfo;
    legalDocuments.push({ type: legal.documentType, status: legal.status, agent: legal.agent });
  }

  // Conditions — extract from notes
  const conditions: string[] = [];
  if (profile.healthStatus) {
    conditions.push(profile.healthStatus);
  }

  // Emergency contacts from task data
  const emergencyContacts: ExportData["emergencyContacts"] = [];
  const contactEntries = taskData.filter(d =>
    d.toolName === "save_task_notes" || d.toolName === "manual_notes"
  ).filter(d =>
    d.taskTitle.toLowerCase().includes("emergency contact")
  );
  for (const entry of contactEntries) {
    const data = entry.data as { notes?: string; name?: string; phone?: string; relationship?: string };
    if (data.name && data.phone) {
      emergencyContacts.push({ name: data.name, phone: data.phone, relationship: data.relationship });
    }
  }

  // Notes
  const noteEntries = taskData.filter(d => d.toolName === "save_task_notes" || d.toolName === "manual_notes");
  const notes: ExportData["notes"] = noteEntries.map(entry => {
    const data = entry.data as { notes?: string };
    return { title: entry.taskTitle, content: data.notes || "" };
  }).filter(n => n.content);

  return {
    parentName: profile.name,
    parentAge: profile.age,
    parentState: profile.state,
    livingArrangement: profile.livingArrangement,
    primaryDoctor,
    specialists,
    medications,
    insurance,
    conditions,
    emergencyContacts,
    legalDocuments,
    pendingTasks: pending.map(t => ({ title: t.title, priority: t.priority })),
    completedTasks: completed.map(t => ({ title: t.title, completedAt: t.completedAt })),
    notes,
    generatedAt: new Date().toISOString(),
  };
}

// ==================== Plain Text Format ====================

export function exportAsText(data: ExportData, sections: ExportSection[]): string {
  const lines: string[] = [];
  const divider = "─".repeat(40);

  lines.push(`CARE SUMMARY — ${data.parentName.toUpperCase()}`);
  lines.push(`Generated: ${new Date(data.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  lines.push(divider);

  if (sections.includes("patient-info")) {
    lines.push("");
    lines.push("PATIENT INFORMATION");
    lines.push(`Name: ${data.parentName}`);
    if (data.parentAge) lines.push(`Age: ${data.parentAge}`);
    if (data.parentState) lines.push(`State: ${data.parentState}`);
    if (data.livingArrangement) lines.push(`Living Arrangement: ${data.livingArrangement}`);
    if (data.conditions.length > 0) {
      lines.push(`Health Conditions: ${data.conditions.join(", ")}`);
    }
  }

  if (sections.includes("primary-doctor") && data.primaryDoctor) {
    lines.push("");
    lines.push("PRIMARY CARE PHYSICIAN");
    lines.push(`Name: ${data.primaryDoctor.name}`);
    lines.push(`Phone: ${data.primaryDoctor.phone}`);
    if (data.primaryDoctor.address) lines.push(`Address: ${data.primaryDoctor.address}`);
    if (data.primaryDoctor.specialty) lines.push(`Specialty: ${data.primaryDoctor.specialty}`);
  }

  if (sections.includes("specialists") && data.specialists.length > 0) {
    lines.push("");
    lines.push("SPECIALISTS");
    for (const spec of data.specialists) {
      lines.push(`• ${spec.name}${spec.specialty ? ` (${spec.specialty})` : ""}${spec.phone ? ` — ${spec.phone}` : ""}`);
    }
  }

  if (sections.includes("medications") && data.medications.length > 0) {
    lines.push("");
    lines.push("CURRENT MEDICATIONS");
    for (const med of data.medications) {
      let line = `• ${med.name} — ${med.dosage}`;
      if (med.frequency) line += ` (${med.frequency})`;
      if (med.purpose) line += ` — for ${med.purpose}`;
      lines.push(line);
    }
  }

  if (sections.includes("conditions") && data.conditions.length > 0) {
    lines.push("");
    lines.push("HEALTH CONDITIONS");
    for (const cond of data.conditions) {
      lines.push(`• ${cond}`);
    }
  }

  if (sections.includes("insurance") && data.insurance) {
    lines.push("");
    lines.push("INSURANCE");
    lines.push(`Provider: ${data.insurance.provider}`);
    lines.push(`Policy #: ${data.insurance.policyNumber}`);
    if (data.insurance.groupNumber) lines.push(`Group #: ${data.insurance.groupNumber}`);
    if (data.insurance.phone) lines.push(`Phone: ${data.insurance.phone}`);
  }

  if (sections.includes("legal") && data.legalDocuments.length > 0) {
    lines.push("");
    lines.push("LEGAL DOCUMENTS");
    for (const doc of data.legalDocuments) {
      let line = `• ${doc.type} — ${doc.status}`;
      if (doc.agent) line += ` (Agent: ${doc.agent})`;
      lines.push(line);
    }
  }

  if (sections.includes("emergency-contacts") && data.emergencyContacts.length > 0) {
    lines.push("");
    lines.push("EMERGENCY CONTACTS");
    for (const contact of data.emergencyContacts) {
      let line = `• ${contact.name} — ${contact.phone}`;
      if (contact.relationship) line += ` (${contact.relationship})`;
      lines.push(line);
    }
  }

  if (sections.includes("tasks")) {
    if (data.pendingTasks.length > 0) {
      lines.push("");
      lines.push("PENDING ACTION ITEMS");
      for (const task of data.pendingTasks) {
        const priority = task.priority === "high" ? "[URGENT]" : task.priority === "medium" ? "[MEDIUM]" : "[LOW]";
        lines.push(`${priority} ${task.title}`);
      }
    }
    if (data.completedTasks.length > 0) {
      lines.push("");
      lines.push(`COMPLETED (${data.completedTasks.length})`);
      for (const task of data.completedTasks) {
        const date = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "";
        lines.push(`✓ ${task.title}${date ? ` (${date})` : ""}`);
      }
    }
  }

  if (sections.includes("notes") && data.notes.length > 0) {
    lines.push("");
    lines.push("NOTES");
    for (const note of data.notes) {
      lines.push(`— ${note.title}: ${note.content}`);
    }
  }

  lines.push("");
  lines.push(divider);
  lines.push("Generated by Harbor — Elder Care Coordination");

  return lines.join("\n");
}

// ==================== HTML Format (for email / PDF) ====================

export function exportAsHtml(data: ExportData, sections: ExportSection[]): string {
  const sectionHtml: string[] = [];

  const styles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #2D3A3E; max-width: 640px; margin: 0 auto; padding: 20px; }
      h1 { font-size: 22px; color: #1B6B7D; margin-bottom: 4px; }
      .subtitle { font-size: 12px; color: #8A9499; margin-bottom: 24px; }
      h2 { font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; color: #1B6B7D; border-bottom: 1px solid #E8E4DF; padding-bottom: 6px; margin-top: 24px; }
      .row { display: flex; padding: 4px 0; font-size: 14px; }
      .label { color: #8A9499; width: 120px; flex-shrink: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
      .value { color: #2D3A3E; }
      ul { padding-left: 18px; margin: 8px 0; }
      li { font-size: 14px; padding: 3px 0; }
      .med-name { font-weight: 600; }
      .med-detail { color: #8A9499; font-size: 12px; }
      .priority-high { color: #E07A6B; font-weight: 600; }
      .priority-medium { color: #D4A843; }
      .completed { color: #6B9E7D; }
      .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #E8E4DF; font-size: 11px; color: #8A9499; }
      .tag { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-right: 4px; }
      .tag-urgent { background: #E07A6B20; color: #E07A6B; }
      .tag-good { background: #6B9E7D20; color: #6B9E7D; }
    </style>
  `;

  sectionHtml.push(`<!DOCTYPE html><html><head><meta charset="utf-8">${styles}</head><body>`);
  sectionHtml.push(`<h1>Care Summary — ${esc(data.parentName)}</h1>`);
  sectionHtml.push(`<div class="subtitle">Generated ${new Date(data.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>`);

  if (sections.includes("patient-info")) {
    sectionHtml.push(`<h2>Patient Information</h2>`);
    sectionHtml.push(row("Name", data.parentName));
    if (data.parentAge) sectionHtml.push(row("Age", String(data.parentAge)));
    if (data.parentState) sectionHtml.push(row("State", data.parentState));
    if (data.livingArrangement) sectionHtml.push(row("Living", data.livingArrangement));
    if (data.conditions.length > 0) sectionHtml.push(row("Conditions", data.conditions.join(", ")));
  }

  if (sections.includes("primary-doctor") && data.primaryDoctor) {
    sectionHtml.push(`<h2>Primary Care Physician</h2>`);
    sectionHtml.push(row("Name", data.primaryDoctor.name));
    sectionHtml.push(row("Phone", data.primaryDoctor.phone));
    if (data.primaryDoctor.address) sectionHtml.push(row("Address", data.primaryDoctor.address));
  }

  if (sections.includes("specialists") && data.specialists.length > 0) {
    sectionHtml.push(`<h2>Specialists</h2><ul>`);
    for (const spec of data.specialists) {
      sectionHtml.push(`<li><span class="med-name">${esc(spec.name)}</span>${spec.specialty ? ` <span class="med-detail">(${esc(spec.specialty)})</span>` : ""}${spec.phone ? ` — ${esc(spec.phone)}` : ""}</li>`);
    }
    sectionHtml.push(`</ul>`);
  }

  if (sections.includes("medications") && data.medications.length > 0) {
    sectionHtml.push(`<h2>Current Medications</h2><ul>`);
    for (const med of data.medications) {
      let detail = med.dosage;
      if (med.frequency) detail += `, ${med.frequency}`;
      if (med.purpose) detail += ` — ${med.purpose}`;
      sectionHtml.push(`<li><span class="med-name">${esc(med.name)}</span> <span class="med-detail">${esc(detail)}</span></li>`);
    }
    sectionHtml.push(`</ul>`);
  }

  if (sections.includes("insurance") && data.insurance) {
    sectionHtml.push(`<h2>Insurance</h2>`);
    sectionHtml.push(row("Provider", data.insurance.provider));
    sectionHtml.push(row("Policy #", data.insurance.policyNumber));
    if (data.insurance.groupNumber) sectionHtml.push(row("Group #", data.insurance.groupNumber));
    if (data.insurance.phone) sectionHtml.push(row("Phone", data.insurance.phone));
  }

  if (sections.includes("legal") && data.legalDocuments.length > 0) {
    sectionHtml.push(`<h2>Legal Documents</h2><ul>`);
    for (const doc of data.legalDocuments) {
      const statusClass = doc.status.toLowerCase().includes("complete") ? "tag-good" : "";
      sectionHtml.push(`<li>${esc(doc.type)} — <span class="tag ${statusClass}">${esc(doc.status)}</span>${doc.agent ? ` (Agent: ${esc(doc.agent)})` : ""}</li>`);
    }
    sectionHtml.push(`</ul>`);
  }

  if (sections.includes("emergency-contacts") && data.emergencyContacts.length > 0) {
    sectionHtml.push(`<h2>Emergency Contacts</h2><ul>`);
    for (const c of data.emergencyContacts) {
      sectionHtml.push(`<li>${esc(c.name)} — ${esc(c.phone)}${c.relationship ? ` (${esc(c.relationship)})` : ""}</li>`);
    }
    sectionHtml.push(`</ul>`);
  }

  if (sections.includes("tasks")) {
    if (data.pendingTasks.length > 0) {
      sectionHtml.push(`<h2>Pending Action Items</h2><ul>`);
      for (const task of data.pendingTasks) {
        const cls = task.priority === "high" ? "priority-high" : task.priority === "medium" ? "priority-medium" : "";
        sectionHtml.push(`<li class="${cls}">${esc(task.title)}</li>`);
      }
      sectionHtml.push(`</ul>`);
    }
    if (data.completedTasks.length > 0) {
      sectionHtml.push(`<h2>Completed (${data.completedTasks.length})</h2><ul>`);
      for (const task of data.completedTasks) {
        const date = task.completedAt ? ` (${new Date(task.completedAt).toLocaleDateString()})` : "";
        sectionHtml.push(`<li class="completed">✓ ${esc(task.title)}${date}</li>`);
      }
      sectionHtml.push(`</ul>`);
    }
  }

  if (sections.includes("notes") && data.notes.length > 0) {
    sectionHtml.push(`<h2>Notes</h2><ul>`);
    for (const note of data.notes) {
      sectionHtml.push(`<li><strong>${esc(note.title)}:</strong> ${esc(note.content)}</li>`);
    }
    sectionHtml.push(`</ul>`);
  }

  sectionHtml.push(`<div class="footer">Generated by Harbor — Elder Care Coordination</div>`);
  sectionHtml.push(`</body></html>`);

  return sectionHtml.join("\n");
}

// ==================== Email body (mailto link) ====================

export function buildMailtoLink(data: ExportData, sections: ExportSection[], recipientEmail?: string): string {
  const subject = encodeURIComponent(`Care Summary — ${data.parentName}`);
  const body = encodeURIComponent(exportAsText(data, sections));
  const to = recipientEmail ? encodeURIComponent(recipientEmail) : "";
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

// ==================== Helpers ====================

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string): string {
  return `<div class="row"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div></div>`;
}

"use client";

import { useState } from "react";
import { Task } from "@/lib/ai/claude";
import type { TaskChatResult, TaskFormResult } from "@/lib/types/taskCapture";

interface TaskFormProps {
  task: Task;
  onComplete: (data: TaskChatResult | TaskFormResult) => void;
  onCancel: () => void;
}

// Detect what kind of data this task needs based on title/domain
function detectTaskType(task: Task): TaskFieldConfig {
  const title = task.title.toLowerCase();
  const domain = task.domain;

  // Doctor / provider info
  if (title.includes("doctor") || title.includes("physician") || title.includes("pcp") || title.includes("specialist") || title.includes("provider")) {
    return {
      toolName: "save_doctor_info",
      label: "Provider Information",
      fields: [
        { key: "name", label: "Doctor / Provider Name", placeholder: "e.g. Dr. Sarah Chen", required: true },
        { key: "phone", label: "Office Phone", placeholder: "e.g. (555) 123-4567", type: "tel", required: true },
        { key: "specialty", label: "Specialty", placeholder: "e.g. Primary Care, Cardiology" },
        { key: "address", label: "Office Address", placeholder: "e.g. 123 Medical Center Dr" },
      ],
    };
  }

  // Medication info
  if (title.includes("medication") || title.includes("medicine") || title.includes("prescription") || title.includes("pharmacy")) {
    return {
      toolName: "save_medication_list",
      label: "Medication Information",
      fields: [
        { key: "med_name", label: "Medication Name", placeholder: "e.g. Lisinopril", required: true },
        { key: "dosage", label: "Dosage", placeholder: "e.g. 10mg" },
        { key: "frequency", label: "How Often", placeholder: "e.g. Once daily" },
        { key: "purpose", label: "What It's For", placeholder: "e.g. Blood pressure" },
      ],
      isRepeatable: true,
      repeatLabel: "Add Another Medication",
    };
  }

  // Insurance info
  if (title.includes("insurance") || title.includes("medicare") || title.includes("medicaid") || title.includes("coverage")) {
    return {
      toolName: "save_insurance_info",
      label: "Insurance Information",
      fields: [
        { key: "provider", label: "Insurance Provider", placeholder: "e.g. Medicare, Blue Cross", required: true },
        { key: "policyNumber", label: "Policy / Member ID", placeholder: "e.g. 1EG4-TE5-MK72", required: true },
        { key: "groupNumber", label: "Group Number (if applicable)", placeholder: "e.g. 12345" },
        { key: "phone", label: "Customer Service Phone", placeholder: "e.g. 1-800-MEDICARE", type: "tel" },
      ],
    };
  }

  // Legal documents
  if (title.includes("power of attorney") || title.includes("poa") || title.includes("proxy") || title.includes("advance directive") || title.includes("living will") || title.includes("will") || title.includes("trust")) {
    return {
      toolName: "save_legal_document_info",
      label: "Legal Document Information",
      fields: [
        { key: "documentType", label: "Document Type", placeholder: "e.g. Healthcare Power of Attorney", required: true },
        { key: "status", label: "Status", placeholder: "e.g. Completed, In progress, Not started", required: true },
        { key: "agent", label: "Named Agent / Proxy", placeholder: "e.g. Your name" },
        { key: "location", label: "Where It's Stored", placeholder: "e.g. Safe deposit box, attorney's office" },
        { key: "dateCompleted", label: "Date Completed", placeholder: "e.g. March 2024", type: "text" },
      ],
    };
  }

  // Financial info
  if (domain === "financial" || title.includes("bank") || title.includes("account") || title.includes("income") || title.includes("expense") || title.includes("bill")) {
    return {
      toolName: "save_task_notes",
      label: "Financial Information",
      fields: [
        { key: "institution", label: "Institution / Company", placeholder: "e.g. Chase Bank, Social Security" },
        { key: "accountType", label: "Account Type", placeholder: "e.g. Checking, Pension, Social Security" },
        { key: "contactInfo", label: "Contact / Phone", placeholder: "e.g. 1-800-123-4567" },
        { key: "notes", label: "Details / Notes", placeholder: "Any relevant details...", multiline: true },
      ],
    };
  }

  // Housing info
  if (domain === "housing" || title.includes("housing") || title.includes("home") || title.includes("living") || title.includes("facility")) {
    return {
      toolName: "save_task_notes",
      label: "Housing Information",
      fields: [
        { key: "type", label: "Housing Type", placeholder: "e.g. Own home, Apartment, Assisted living" },
        { key: "address", label: "Address", placeholder: "Full address" },
        { key: "contactInfo", label: "Landlord / Manager Contact", placeholder: "Name and phone" },
        { key: "notes", label: "Details / Notes", placeholder: "Monthly cost, lease terms, accessibility...", multiline: true },
      ],
    };
  }

  // Emergency contact
  if (title.includes("emergency contact") || title.includes("contact")) {
    return {
      toolName: "save_task_notes",
      label: "Contact Information",
      fields: [
        { key: "name", label: "Contact Name", placeholder: "e.g. Jane Smith", required: true },
        { key: "relationship", label: "Relationship", placeholder: "e.g. Neighbor, Sibling, Friend" },
        { key: "phone", label: "Phone Number", placeholder: "e.g. (555) 123-4567", type: "tel", required: true },
        { key: "notes", label: "Notes", placeholder: "Best time to call, additional context..." },
      ],
    };
  }

  // Generic fallback — still a structured form, not just a textarea
  return {
    toolName: "save_task_notes",
    label: "Task Information",
    fields: [
      { key: "notes", label: "What did you find out?", placeholder: "Enter the information you gathered...", multiline: true, required: true },
    ],
  };
}

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "tel" | "email";
  required?: boolean;
  multiline?: boolean;
}

interface TaskFieldConfig {
  toolName: string;
  label: string;
  fields: FieldDef[];
  isRepeatable?: boolean;
  repeatLabel?: string;
}

export default function TaskForm({ task, onComplete, onCancel }: TaskFormProps) {
  const config = detectTaskType(task);
  const [entries, setEntries] = useState<Record<string, string>[]>([{}]);

  const updateField = (entryIndex: number, key: string, value: string) => {
    setEntries(prev => {
      const updated = [...prev];
      updated[entryIndex] = { ...updated[entryIndex], [key]: value };
      return updated;
    });
  };

  const addEntry = () => {
    setEntries(prev => [...prev, {}]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(prev => prev.filter((_, i) => i !== index));
    }
  };

  const hasRequiredFields = () => {
    return entries.every(entry =>
      config.fields
        .filter(f => f.required)
        .every(f => entry[f.key]?.trim())
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (config.isRepeatable) {
      // For medications etc., build a list
      const items = entries
        .filter(entry => Object.values(entry).some(v => v?.trim()))
        .map(entry => {
          const item: Record<string, string> = {};
          config.fields.forEach(f => {
            if (entry[f.key]?.trim()) item[f.key] = entry[f.key].trim();
          });
          return item;
        });

      if (config.toolName === "save_medication_list") {
        onComplete({
          toolName: config.toolName,
          data: {
            medications: items.map(item => ({
              name: item.med_name || "",
              dosage: item.dosage || "",
              frequency: item.frequency || "",
              purpose: item.purpose,
            })),
          },
        });
      } else {
        onComplete({
          toolName: config.toolName,
          data: { notes: JSON.stringify(items) } as { notes: string },
        });
      }
    } else {
      // Single entry
      const entry = entries[0];
      const data: Record<string, string> = {};
      config.fields.forEach(f => {
        if (entry[f.key]?.trim()) data[f.key] = entry[f.key].trim();
      });

      // For generic notes fields, wrap as TaskFormResult-compatible
      if (config.toolName === "save_task_notes" && data.notes && !data.institution) {
        onComplete({ toolName: "save_task_notes", data: { notes: data.notes } });
      } else if (config.toolName === "save_task_notes") {
        // Structured notes — combine into a readable string
        const noteLines = config.fields
          .filter(f => data[f.key])
          .map(f => `${f.label}: ${data[f.key]}`);
        onComplete({ toolName: "save_task_notes", data: { notes: noteLines.join("\n") } });
      } else {
        onComplete({ toolName: config.toolName, data: data as never });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-1">
        {config.label}
      </div>

      {entries.map((entry, entryIndex) => (
        <div key={entryIndex} className={`space-y-3 ${entries.length > 1 ? "bg-white rounded-lg border border-sandDark p-3" : ""}`}>
          {entries.length > 1 && (
            <div className="flex items-center justify-between">
              <div className="font-sans text-xs font-semibold text-ocean">
                #{entryIndex + 1}
              </div>
              <button
                type="button"
                onClick={() => removeEntry(entryIndex)}
                className="font-sans text-xs text-coral hover:text-coral/80"
              >
                Remove
              </button>
            </div>
          )}

          {config.fields.map((field) => (
            <div key={field.key}>
              <label className="block font-sans text-xs font-semibold text-slate mb-1">
                {field.label}
                {field.required && <span className="text-coral ml-0.5">*</span>}
              </label>
              {field.multiline ? (
                <textarea
                  value={entry[field.key] || ""}
                  onChange={(e) => updateField(entryIndex, field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-sandDark rounded-lg font-sans text-sm text-slate placeholder:text-slateLight/60 focus:outline-none focus:border-ocean transition-colors resize-none"
                />
              ) : (
                <input
                  type={field.type || "text"}
                  value={entry[field.key] || ""}
                  onChange={(e) => updateField(entryIndex, field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2.5 border border-sandDark rounded-lg font-sans text-sm text-slate placeholder:text-slateLight/60 focus:outline-none focus:border-ocean transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      ))}

      {config.isRepeatable && (
        <button
          type="button"
          onClick={addEntry}
          className="w-full border-2 border-dashed border-ocean/30 rounded-lg px-4 py-2.5 font-sans text-xs font-semibold text-ocean hover:border-ocean/50 transition-colors"
        >
          + {config.repeatLabel || "Add Another"}
        </button>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-sand hover:bg-sandDark text-slate rounded-lg px-4 py-2.5 font-sans text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!hasRequiredFields()}
          className="flex-1 bg-ocean hover:bg-oceanMid text-white rounded-lg px-4 py-2.5 font-sans text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save to Harbor
        </button>
      </div>
    </form>
  );
}

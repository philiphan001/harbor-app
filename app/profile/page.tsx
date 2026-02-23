"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile, getActiveParentId, type ParentProfile } from "@/lib/utils/parentProfile";
import { getAllTaskData, hydrateTaskDataFromDb, TaskData } from "@/lib/utils/taskData";
import { getTasks, getCompletedTasks } from "@/lib/utils/taskStorage";
import type { Task } from "@/lib/ai/claude";
import { PRIORITY_COLORS, PRIORITY_LABELS, type ExtendedDomain } from "@/lib/constants/domains";
import type { DoctorInfo, MedicationList, MedicationEntry, InsuranceInfo, LegalDocumentInfo, TaskDataPayload } from "@/lib/types/taskCapture";

export default function ProfilePage() {
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [taskData, setTaskData] = useState<TaskData[]>([]);
  const [domainTasks, setDomainTasks] = useState<Record<string, Task[]>>({});

  useEffect(() => {
    setParentProfile(getParentProfile());
    setTaskData(getAllTaskData());

    // Group tasks (pending + completed) by domain
    const allTasks = [...getTasks(), ...getCompletedTasks()];
    const grouped = allTasks.reduce((acc, task) => {
      const domain = mapTaskDomainToCoreDomain(task.domain);
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
    setDomainTasks(grouped);

    // Hydrate from DB if available (merges into localStorage, then re-read)
    const parentId = getActiveParentId();
    if (parentId) {
      hydrateTaskDataFromDb(parentId).then((hydrated) => {
        if (hydrated) {
          setTaskData(getAllTaskData());
        }
      });
    }
  }, []);

  // Group data by domain
  const groupedData = taskData.reduce((acc, item) => {
    const domain = getDomainFromToolName(item.toolName);
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(item);
    return acc;
  }, {} as Record<string, TaskData[]>);

  return (
    <div className="min-h-screen bg-warmWhite">
      {/* Header */}
      <div className="bg-ocean px-5 py-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative max-w-[420px] mx-auto">
          <Link
            href="/dashboard"
            className="font-sans text-sm text-white/80 hover:text-white inline-block mb-4"
          >
            ← Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <span className="font-serif text-white text-xl font-semibold">
                {parentProfile?.name?.charAt(0) || "?"}
              </span>
            </div>
            <div>
              <h1 className="font-serif text-3xl font-semibold text-white">
                {parentProfile?.name || "Parent"}'s Profile
              </h1>
              {parentProfile?.age && (
                <p className="font-sans text-sm text-white/80">
                  Age {parentProfile.age}
                  {parentProfile.state && ` • ${parentProfile.state}`}
                </p>
              )}
            </div>
          </div>

          <p className="font-serif text-base text-white/80 leading-relaxed italic">
            All important information in one place
          </p>
        </div>
      </div>

      <div className="max-w-[420px] mx-auto px-5 py-6">
        {taskData.length === 0 && Object.keys(domainTasks).length === 0 ? (
          // Empty state — no captured data and no tasks
          <div className="bg-white rounded-xl border border-sandDark px-6 py-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <div className="font-serif text-xl font-semibold text-slate mb-2">
              No information yet
            </div>
            <div className="font-sans text-sm text-slateMid leading-relaxed mb-6">
              As you complete tasks and add information through &ldquo;Tell Harbor,&rdquo;
              everything will be organized here.
            </div>
            <Link href="/tasks">
              <button className="bg-ocean text-white rounded-xl px-6 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors">
                View Tasks
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Medical */}
            <DomainSection
              title="Medical"
              icon="♥"
              color="#D4725C"
              capturedData={groupedData.medical}
              tasks={[...(domainTasks.medical || []), ...(domainTasks.caregiving || [])]}
            />

            {/* Legal */}
            <DomainSection
              title="Legal"
              icon="◉"
              color="#6B8F71"
              capturedData={groupedData.legal}
              tasks={domainTasks.legal}
            />

            {/* Financial */}
            <DomainSection
              title="Financial"
              icon="◈"
              color="#1B6B7D"
              capturedData={groupedData.financial}
              tasks={domainTasks.financial}
            />

            {/* Housing */}
            <DomainSection
              title="Housing"
              icon="⌂"
              color="#C4943A"
              capturedData={groupedData.housing}
              tasks={domainTasks.housing}
            />

            {/* Transportation */}
            <DomainSection
              title="Transportation"
              icon="✈"
              color="#7B68A8"
              capturedData={groupedData.transportation}
              tasks={domainTasks.transportation}
            />

            {/* Social */}
            <DomainSection
              title="Social"
              icon="♦"
              color="#5B8FA8"
              capturedData={groupedData.social}
              tasks={[...(domainTasks.social || []), ...(domainTasks.family || [])]}
            />

            {/* General / Other */}
            <DomainSection
              title="Other"
              icon="●"
              color="#4A6274"
              capturedData={groupedData.other}
              tasks={domainTasks.general}
            />
          </>
        )}
      </div>
    </div>
  );
}

function mapTaskDomainToCoreDomain(domain: ExtendedDomain): string {
  if (domain === "family") return "social";
  if (domain === "caregiving") return "medical";
  return domain;
}

function DomainSection({
  title,
  icon,
  color,
  capturedData,
  tasks,
}: {
  title: string;
  icon: string;
  color: string;
  capturedData?: TaskData[];
  tasks?: Task[];
}) {
  const hasCaptured = capturedData && capturedData.length > 0;
  const hasTasks = tasks && tasks.length > 0;

  // Skip domains with nothing to show
  if (!hasCaptured && !hasTasks) return null;

  const pendingTasks = tasks?.filter(t => !t.completedAt) || [];
  const completedTasks = tasks?.filter(t => t.completedAt) || [];

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </div>
        <div className="font-sans text-lg font-semibold text-slate">{title}</div>
      </div>

      {/* Captured data */}
      {hasCaptured && (
        <div className="space-y-3">
          {capturedData.map((item, index) => (
            <DataCard key={index} data={item} color={color} />
          ))}
        </div>
      )}

      {/* Tasks */}
      {hasTasks && (
        <div style={{ marginTop: hasCaptured ? "0.75rem" : "0" }}>
          {pendingTasks.length > 0 && (
            <div>
              <div className="font-sans text-[11px] font-semibold tracking-[1px] uppercase text-slateMid" style={{ marginBottom: "0.5rem" }}>
                Pending ({pendingTasks.length})
              </div>
              <div className="space-y-2">
                {pendingTasks.map((task, i) => (
                  <TaskCard key={`p-${i}`} task={task} color={color} />
                ))}
              </div>
            </div>
          )}
          {completedTasks.length > 0 && (
            <div style={{ marginTop: pendingTasks.length > 0 ? "0.75rem" : "0" }}>
              <div className="font-sans text-[11px] font-semibold tracking-[1px] uppercase text-slateMid" style={{ marginBottom: "0.5rem" }}>
                Completed ({completedTasks.length})
              </div>
              <div className="space-y-2">
                {completedTasks.map((task, i) => (
                  <TaskCard key={`c-${i}`} task={task} color={color} completed />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, color, completed = false }: { task: Task; color: string; completed?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="bg-white rounded-xl border border-sandDark overflow-hidden"
      style={{ opacity: completed ? 0.7 : 1 }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 text-left hover:bg-sand/30 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: completed ? "#6B8F71" : PRIORITY_COLORS[task.priority], marginTop: "0.4rem" }}
          />
          <div className="flex-1 min-w-0">
            <div className={`font-sans text-sm font-medium text-slate ${completed ? "line-through" : ""}`}>
              {task.title}
            </div>
            <div className="font-sans text-[11px] text-slateMid">
              {completed ? "Completed" : PRIORITY_LABELS[task.priority]}
            </div>
          </div>
          <div
            className="text-xs text-slateMid transition-transform flex-shrink-0"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▼
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 border-t border-sand">
          <div className="mt-2 font-sans text-sm text-slateMid leading-relaxed">
            {task.why}
          </div>
          {task.suggestedActions.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <div className="font-sans text-[11px] font-semibold text-slateMid uppercase tracking-wide" style={{ marginBottom: "0.25rem" }}>
                Suggested actions
              </div>
              <ul className="space-y-1">
                {task.suggestedActions.map((action, i) => (
                  <li key={i} className="font-sans text-sm text-slate flex items-start gap-2">
                    <span className="text-slateMid">·</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DataCard({ data, color }: { data: TaskData; color: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-sandDark overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 text-left hover:bg-sand/30 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-sans text-base font-semibold text-slate mb-1">
              {data.taskTitle}
            </div>
            <div className="font-sans text-xs text-slateMid">
              Added {new Date(data.capturedAt).toLocaleDateString()}
            </div>
          </div>
          <div
            className="text-xl transition-transform"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-sand">
          <div className="mt-3 space-y-3">
            {renderDataFields(data.toolName, data.data, color)}
          </div>
        </div>
      )}
    </div>
  );
}

function renderDataFields(toolName: string, data: TaskDataPayload, color: string) {
  if (toolName === "save_doctor_info") {
    const doc = data as DoctorInfo;
    return (
      <>
        <DataField label="Doctor Name" value={doc.name} color={color} />
        <DataField label="Phone" value={doc.phone} color={color} />
        {doc.address && <DataField label="Address" value={doc.address} color={color} />}
        {doc.specialty && <DataField label="Specialty" value={doc.specialty} color={color} />}
      </>
    );
  }

  if (toolName === "save_medication_list") {
    const medList = data as MedicationList;
    return (
      <div className="space-y-3">
        <div className="font-sans text-sm font-semibold text-slateMid uppercase tracking-wide">
          Medications
        </div>
        {medList.medications.map((med: MedicationEntry, i: number) => (
          <div
            key={i}
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${color}10` }}
          >
            <div className="font-sans text-sm font-semibold text-slate mb-1">
              {med.name} - {med.dosage}
            </div>
            <div className="font-sans text-sm text-slateMid">
              {med.frequency}
              {med.purpose && ` • ${med.purpose}`}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (toolName === "save_insurance_info") {
    const ins = data as InsuranceInfo;
    return (
      <>
        <DataField label="Provider" value={ins.provider} color={color} />
        <DataField label="Policy Number" value={ins.policyNumber} color={color} />
        {ins.groupNumber && <DataField label="Group Number" value={ins.groupNumber} color={color} />}
        {ins.phone && <DataField label="Phone" value={ins.phone} color={color} />}
      </>
    );
  }

  if (toolName === "save_legal_document_info") {
    const legal = data as LegalDocumentInfo;
    return (
      <>
        <DataField label="Document Type" value={legal.documentType} color={color} />
        <DataField label="Status" value={legal.status} color={color} />
        {legal.agent && <DataField label="Agent/Proxy" value={legal.agent} color={color} />}
        {legal.location && <DataField label="Location" value={legal.location} color={color} />}
        {legal.dateCompleted && <DataField label="Date Completed" value={legal.dateCompleted} color={color} />}
      </>
    );
  }

  if (toolName === "save_task_notes" || toolName === "manual_notes") {
    const notes = data as { notes: string };
    return <DataField label="Notes" value={notes.notes} color={color} multiline />;
  }

  // Generic fallback
  return (
    <pre className="font-sans text-sm text-slate whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function DataField({
  label,
  value,
  color,
  multiline = false,
}: {
  label: string;
  value: string;
  color: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-1">
        {label}
      </div>
      <div
        className={`font-sans text-sm text-slate ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function getDomainFromToolName(toolName: string): string {
  if (
    toolName.includes("doctor") ||
    toolName.includes("medication") ||
    toolName.includes("insurance")
  ) {
    return "medical";
  }
  if (toolName.includes("legal") || toolName.includes("document")) {
    return "legal";
  }
  if (toolName.includes("financial")) {
    return "financial";
  }
  return "other";
}

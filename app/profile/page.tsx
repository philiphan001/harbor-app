"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getParentProfile, getActiveParentId, updateParentProfile, type ParentProfile } from "@/lib/utils/parentProfile";
import ParentPhotoUpload from "@/components/ParentPhotoUpload";
import { getAllTaskData, hydrateTaskDataFromDb, saveTaskData, removeTaskData, TaskData } from "@/lib/utils/taskData";
import { calculateReadinessScore } from "@/lib/utils/readinessScore";
import { getTasks } from "@/lib/utils/taskStorage";
import type { Task } from "@/lib/ai/claude";
import { DOMAIN_ICONS, DOMAIN_COLORS, PRIORITY_COLORS, type Domain } from "@/lib/constants/domains";
import TaskDetail from "@/components/TaskDetail";
import { completeTask } from "@/lib/utils/taskStorage";
import type { DoctorInfo, MedicationList, MedicationEntry, InsuranceInfo, LegalDocumentInfo, TaskDataPayload } from "@/lib/types/taskCapture";
import { getFreshnessStatus } from "@/lib/constants/reviewIntervals";
import FreshnessReview from "@/components/FreshnessReview";

const DOMAIN_STYLES: Record<string, { label: string; color: string; icon: string }> = {
  medical: { label: "Medical", color: "#D4725C", icon: DOMAIN_ICONS.medical },
  legal: { label: "Legal", color: "#6B8F71", icon: DOMAIN_ICONS.legal },
  financial: { label: "Financial", color: "#1B6B7D", icon: DOMAIN_ICONS.financial },
  housing: { label: "Housing", color: "#C4943A", icon: DOMAIN_ICONS.housing },
  transportation: { label: "Transportation", color: "#7B68A8", icon: DOMAIN_ICONS.transportation },
  social: { label: "Social & Pets", color: "#5B8FA8", icon: DOMAIN_ICONS.social },
  other: { label: "Other", color: "#4A6274", icon: DOMAIN_ICONS.general },
};

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const domainFilter = searchParams.get("domain");
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [taskData, setTaskData] = useState<TaskData[]>([]);
  const [editingLocation, setEditingLocation] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [zipInput, setZipInput] = useState("");
  const [showFreshnessReview, setShowFreshnessReview] = useState(false);
  const [editingSpouse, setEditingSpouse] = useState(false);
  const [spouseNameInput, setSpouseNameInput] = useState("");
  const [spouseAgeInput, setSpouseAgeInput] = useState("");
  const [spouseLivingInput, setSpouseLivingInput] = useState(true);
  const [editingVeteran, setEditingVeteran] = useState(false);

  useEffect(() => {
    const profile = getParentProfile();
    setParentProfile(profile);
    setCityInput(profile?.city || "");
    setZipInput(profile?.zip || "");
    setSpouseNameInput(profile?.spouse?.name || "");
    setSpouseAgeInput(profile?.spouse?.age?.toString() || "");
    setSpouseLivingInput(profile?.spouse?.living ?? true);
    setTaskData(getAllTaskData());

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

  const saveLocation = useCallback(() => {
    updateParentProfile({ city: cityInput.trim() || undefined, zip: zipInput.trim() || undefined });
    setParentProfile(getParentProfile());
    setEditingLocation(false);
  }, [cityInput, zipInput]);

  const saveSpouse = useCallback(() => {
    const name = spouseNameInput.trim();
    if (name) {
      const age = parseInt(spouseAgeInput, 10) || undefined;
      updateParentProfile({ spouse: { name, age, living: spouseLivingInput } });
    } else {
      updateParentProfile({ spouse: undefined });
    }
    setParentProfile(getParentProfile());
    setEditingSpouse(false);
  }, [spouseNameInput, spouseAgeInput, spouseLivingInput]);

  const toggleVeteranStatus = useCallback((value: boolean) => {
    updateParentProfile({ veteranStatus: value });
    setParentProfile(getParentProfile());
    setEditingVeteran(false);
  }, []);

  const handleSave = useCallback((taskTitle: string, toolName: string, updatedData: TaskDataPayload) => {
    saveTaskData(taskTitle, toolName, updatedData);
    setTaskData(getAllTaskData());
  }, []);

  const handleDelete = useCallback((taskTitle: string) => {
    removeTaskData(taskTitle);
    setTaskData(getAllTaskData());
  }, []);

  // Filter by domain if query param present, then sort newest first
  const filteredData = domainFilter
    ? taskData.filter((item) => getDomainFromToolName(item.toolName, item.taskTitle) === domainFilter)
    : taskData;
  const sortedData = [...filteredData].sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
  );

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
            &larr; Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-2">
            {parentProfile ? (
              <ParentPhotoUpload
                parentProfile={parentProfile}
                onPhotoSaved={(url) => setParentProfile({ ...parentProfile, photoUrl: url })}
                size="sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <span className="font-serif text-white text-xl font-semibold">?</span>
              </div>
            )}
            <div>
              <h1 className="font-serif text-3xl font-semibold text-white">
                {parentProfile?.name || "Parent"}&apos;s Profile
              </h1>
              {parentProfile?.age && (
                <p className="font-sans text-sm text-white/80">
                  Age {parentProfile.age}
                  {parentProfile.city && ` • ${parentProfile.city}`}
                  {parentProfile.state && `${parentProfile.city ? ", " : " • "}${parentProfile.state}`}
                  {parentProfile.zip && ` ${parentProfile.zip}`}
                </p>
              )}
            </div>
          </div>

          {editingLocation ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="City"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="bg-white/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 font-sans text-sm w-28 focus:outline-none focus:ring-1 focus:ring-white/40"
              />
              <input
                type="text"
                placeholder="ZIP"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                className="bg-white/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 font-sans text-sm w-20 focus:outline-none focus:ring-1 focus:ring-white/40"
                maxLength={10}
              />
              <button
                onClick={saveLocation}
                className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 font-sans text-sm font-semibold transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingLocation(false)}
                className="text-white/60 hover:text-white font-sans text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="font-serif text-base text-white/80 leading-relaxed italic">
                All important information in one place
              </p>
              <button
                onClick={() => setEditingLocation(true)}
                className="text-white/50 hover:text-white text-xs font-sans transition-colors whitespace-nowrap"
              >
                Edit location
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[420px] mx-auto px-5 py-6">
        {/* Personal Details */}
        {!domainFilter && (
          <div className="bg-white rounded-xl border border-sandDark overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-sand">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight">
                Personal Details
              </div>
            </div>

            {/* Photo */}
            {parentProfile && (
              <div className="px-4 py-3 border-b border-sand">
                <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-2">
                  Photo
                </div>
                <div className="flex items-center gap-3">
                  <ParentPhotoUpload
                    parentProfile={parentProfile}
                    onPhotoSaved={(url) => setParentProfile({ ...parentProfile, photoUrl: url })}
                    onPhotoDeleted={() => setParentProfile({ ...parentProfile, photoUrl: undefined })}
                    size="sm"
                    variant="light"
                  />
                  <div className="font-sans text-xs text-slateMid">
                    {parentProfile.photoUrl ? "Tap to change photo" : "Tap to add a photo"}
                  </div>
                </div>
              </div>
            )}

            {/* Spouse */}
            <div className="px-4 py-3 border-b border-sand">
              {editingSpouse ? (
                <div className="space-y-2">
                  <label className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide block">
                    Spouse
                  </label>
                  <input
                    type="text"
                    placeholder="Spouse name"
                    value={spouseNameInput}
                    onChange={(e) => setSpouseNameInput(e.target.value)}
                    className="w-full border border-sandDark rounded-lg px-3 py-2 font-sans text-sm text-slate focus:outline-none focus:ring-1 focus:ring-ocean"
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={spouseAgeInput}
                    onChange={(e) => setSpouseAgeInput(e.target.value)}
                    min="18"
                    max="120"
                    className="w-full border border-sandDark rounded-lg px-3 py-2 font-sans text-sm text-slate focus:outline-none focus:ring-1 focus:ring-ocean"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSpouseLivingInput(true)}
                      className={`px-3 py-1.5 rounded-lg font-sans text-xs font-semibold transition-colors ${
                        spouseLivingInput
                          ? "bg-ocean text-white"
                          : "bg-sand text-slateMid hover:bg-sandDark"
                      }`}
                    >
                      Living
                    </button>
                    <button
                      onClick={() => setSpouseLivingInput(false)}
                      className={`px-3 py-1.5 rounded-lg font-sans text-xs font-semibold transition-colors ${
                        !spouseLivingInput
                          ? "bg-ocean text-white"
                          : "bg-sand text-slateMid hover:bg-sandDark"
                      }`}
                    >
                      Deceased
                    </button>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveSpouse}
                      className="bg-ocean text-white rounded-lg px-4 py-1.5 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setSpouseNameInput(parentProfile?.spouse?.name || "");
                        setSpouseAgeInput(parentProfile?.spouse?.age?.toString() || "");
                        setSpouseLivingInput(parentProfile?.spouse?.living ?? true);
                        setEditingSpouse(false);
                      }}
                      className="text-slateMid hover:text-slate font-sans text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingSpouse(true)}
                  className="w-full text-left flex items-center justify-between"
                >
                  <div>
                    <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-0.5">
                      Spouse
                    </div>
                    <div className="font-sans text-sm text-slate">
                      {parentProfile?.spouse
                        ? `${parentProfile.spouse.name}${parentProfile.spouse.age ? `, ${parentProfile.spouse.age}` : ""} (${parentProfile.spouse.living ? "living" : "deceased"})`
                        : "Add spouse info"}
                    </div>
                  </div>
                  <span className="text-slateLight text-sm">›</span>
                </button>
              )}
            </div>

            {/* Veteran Status */}
            <div className="px-4 py-3">
              {editingVeteran ? (
                <div className="space-y-2">
                  <label className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide block">
                    Veteran Status
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleVeteranStatus(true)}
                      className="px-4 py-1.5 rounded-lg font-sans text-sm font-semibold bg-ocean text-white hover:bg-oceanMid transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => toggleVeteranStatus(false)}
                      className="px-4 py-1.5 rounded-lg font-sans text-sm font-semibold bg-sand text-slateMid hover:bg-sandDark transition-colors"
                    >
                      No
                    </button>
                    <button
                      onClick={() => setEditingVeteran(false)}
                      className="text-slateMid hover:text-slate font-sans text-sm transition-colors ml-auto"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingVeteran(true)}
                  className="w-full text-left flex items-center justify-between"
                >
                  <div>
                    <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-0.5">
                      Veteran Status
                    </div>
                    <div className="font-sans text-sm text-slate">
                      {parentProfile?.veteranStatus === true
                        ? "Yes"
                        : parentProfile?.veteranStatus === false
                        ? "No"
                        : "Set veteran status"}
                    </div>
                  </div>
                  <span className="text-slateLight text-sm">›</span>
                </button>
              )}
            </div>
          </div>
        )}

        {domainFilter ? (
          <DomainDetailView
            domain={domainFilter}
            taskData={taskData}
            sortedData={sortedData}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ) : (
          <>
            {/* Domain filter pills */}
            {taskData.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
                <Link
                  href="/profile"
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold transition-colors bg-ocean text-white"
                >
                  All
                </Link>
                {Object.entries(DOMAIN_STYLES)
                  .filter(([key]) => key !== "other" || taskData.some((d) => getDomainFromToolName(d.toolName, d.taskTitle) === "other"))
                  .filter(([key]) => taskData.some((d) => getDomainFromToolName(d.toolName, d.taskTitle) === key))
                  .map(([key, style]) => (
                    <Link
                      key={key}
                      href={`/profile?domain=${key}`}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold transition-colors bg-sand text-slateMid hover:bg-sandDark"
                    >
                      {style.label}
                    </Link>
                  ))}
              </div>
            )}

            {/* Stale data banner */}
            {(() => {
              const staleItems = taskData.filter(
                (d) => getFreshnessStatus(d.toolName, d.lastReviewedAt, d.capturedAt) === "stale"
              );
              if (staleItems.length === 0) return null;

              if (showFreshnessReview) {
                return (
                  <div className="mb-4">
                    <FreshnessReview
                      staleItems={staleItems}
                      onReviewed={() => {
                        setShowFreshnessReview(false);
                        setTaskData(getAllTaskData());
                      }}
                      onUpdate={(taskTitle) => {
                        setShowFreshnessReview(false);
                        // Navigate to profile with the domain filter for update
                        const domain = getDomainFromToolName(
                          staleItems.find((d) => d.taskTitle === taskTitle)?.toolName || "",
                          taskTitle
                        );
                        window.location.href = `/profile?domain=${domain}`;
                      }}
                    />
                  </div>
                );
              }

              return (
                <div className="bg-coral/5 border border-coral/20 rounded-[14px] px-5 py-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-sans text-sm font-semibold text-slate">
                        Some information may be out of date
                      </div>
                      <div className="font-sans text-xs text-slateMid mt-0.5">
                        {staleItems.length} item{staleItems.length !== 1 ? "s" : ""} need{staleItems.length === 1 ? "s" : ""} review
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFreshnessReview(true)}
                      className="bg-coral/10 hover:bg-coral/20 text-coral rounded-lg px-3 py-1.5 font-sans text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      Review
                    </button>
                  </div>
                </div>
              );
            })()}

            {sortedData.length === 0 ? (
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
              <div className="space-y-3">
                {sortedData.map((item, index) => (
                  <DataCard
                    key={`${item.taskTitle}-${index}`}
                    data={item}
                    onSave={handleSave}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- Domain-specific gap definitions ---
const DOMAIN_GAPS: Record<string, { label: string; check: (taskData: TaskData[], profile: ParentProfile | null) => boolean }[]> = {
  medical: [
    { label: "Primary care doctor contact", check: (td) => td.some((d) => d.toolName === "save_doctor_info") },
    { label: "Current medications list", check: (td) => td.some((d) => d.toolName === "save_medication_list") },
    { label: "Medicare/insurance information", check: (td) => td.some((d) => d.toolName === "save_insurance_info") },
    { label: "HIPAA medical record access authorization", check: (td) => td.some((d) => d.taskTitle.toLowerCase().includes("hipaa")) },
  ],
  legal: [
    { label: "Power of Attorney", check: (td) => td.some((d) => d.toolName === "save_legal_document_info" || (d.taskTitle.toLowerCase().includes("poa") || d.taskTitle.toLowerCase().includes("power of attorney"))) },
    { label: "Advance directive / living will", check: (td) => td.some((d) => d.taskTitle.toLowerCase().includes("advance directive") || d.taskTitle.toLowerCase().includes("living will")) },
    { label: "Will or estate plan", check: (td) => td.some((d) => d.taskTitle.toLowerCase().includes("will") || d.taskTitle.toLowerCase().includes("estate")) },
  ],
  financial: [
    { label: "Primary bank account information", check: (td) => td.some((d) => d.taskTitle.toLowerCase().includes("bank")) },
    { label: "Income sources documented", check: (td) => td.some((d) => d.taskTitle.toLowerCase().includes("income")) },
  ],
  housing: [
    { label: "Current living arrangement", check: (_td, profile) => !!profile?.livingArrangement },
    { label: "Emergency contact besides you", check: (td) => td.some((d) => d.taskTitle.toLowerCase().includes("emergency contact")) },
  ],
  transportation: [
    { label: "Transportation plan for appointments", check: (td) => td.some((d) => d.taskTitle.toLowerCase().includes("transport") || d.taskTitle.toLowerCase().includes("ride") || d.taskTitle.toLowerCase().includes("driving")) },
  ],
  social: [
    { label: "Key social contacts for parent", check: (td) => td.some((d) => d.taskTitle.toLowerCase().includes("friend") || d.taskTitle.toLowerCase().includes("neighbor") || d.taskTitle.toLowerCase().includes("social")) },
  ],
};

const DOMAIN_TIPS: Record<string, string[]> = {
  financial: [
    "Review your parent's credit report annually — new accounts or inquiries they don't recognize can signal scam vulnerability or cognitive changes.",
    "Watch for missed payments from someone who was previously reliable — this is one of the earliest financial signs of memory issues.",
    "Sudden increases in debt or erratic spending patterns may indicate impaired judgment or susceptibility to fraud.",
    "Duplicate bill payments or unusual charitable donations can be early warning signs worth investigating.",
  ],
};

// Map extended domain names to core domains for task filtering
const DOMAIN_ALIASES: Record<string, string> = {
  caregiving: "medical",
  family: "social",
};

function DomainDetailView({
  domain,
  taskData,
  sortedData,
  onSave,
  onDelete,
}: {
  domain: string;
  taskData: TaskData[];
  sortedData: TaskData[];
  onSave: (taskTitle: string, toolName: string, updatedData: TaskDataPayload) => void;
  onDelete: (taskTitle: string) => void;
}) {
  const style = DOMAIN_STYLES[domain] || DOMAIN_STYLES.other;
  const [readiness, setReadiness] = useState<ReturnType<typeof calculateReadinessScore> | null>(null);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadPendingTasks = useCallback(() => {
    const allPending = getTasks();
    const filtered = allPending.filter((t) => {
      const taskDomain = t.domain as string;
      return taskDomain === domain || DOMAIN_ALIASES[taskDomain] === domain;
    });
    setPendingTasks(filtered);
  }, [domain]);

  useEffect(() => {
    const score = calculateReadinessScore();
    setReadiness(score);
    setParentProfile(getParentProfile());
    loadPendingTasks();
  }, [domain, loadPendingTasks]);

  const handleMarkComplete = () => {
    if (selectedTask) {
      completeTask(selectedTask.title);
      setSelectedTask(null);
      loadPendingTasks();
    }
  };

  const domainScore = readiness?.domains[domain as Domain] ?? 0;

  // Determine score color
  let scoreColor = "#D4725C"; // coral for < 30
  if (domainScore >= 85) scoreColor = "#6B8F71"; // sage
  else if (domainScore >= 60) scoreColor = "#1B6B7D"; // ocean
  else if (domainScore >= 30) scoreColor = "#C4943A"; // amber

  let statusText = `${pendingTasks.length} pending task${pendingTasks.length !== 1 ? "s" : ""}`;
  if (domainScore >= 85) statusText = "Well Prepared";
  else if (domainScore >= 60) statusText = "Prepared";

  // Compute gaps
  const gapDefs = DOMAIN_GAPS[domain] || [];
  const missingGaps = gapDefs.filter((g) => !g.check(taskData, parentProfile));

  return (
    <div className="space-y-6">
      {/* Domain header */}
      <div className="bg-white rounded-xl border border-sandDark p-5">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
            style={{ backgroundColor: style.color }}
          >
            {style.icon}
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-xl font-semibold text-slate">
              {style.label}
            </h2>
            <div className="font-sans text-xs font-semibold" style={{ color: scoreColor }}>
              {statusText}
            </div>
          </div>
          <div className="font-serif text-2xl font-bold" style={{ color: scoreColor }}>
            {domainScore}%
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-sand overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${domainScore}%`, backgroundColor: scoreColor }}
          />
        </div>
      </div>

      {/* What Harbor Knows */}
      <div>
        <h3 className="font-serif text-lg font-semibold text-slate mb-3">
          What Harbor Knows
        </h3>
        {sortedData.length === 0 ? (
          <div className="bg-white rounded-xl border border-sandDark px-5 py-6 text-center">
            <div className="font-sans text-sm text-slateMid">
              No {style.label.toLowerCase()} information captured yet.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedData.map((item, index) => (
              <DataCard
                key={`${item.taskTitle}-${index}`}
                data={item}
                onSave={onSave}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Signs to Watch For */}
      {DOMAIN_TIPS[domain] && (
        <div>
          <h3 className="font-serif text-lg font-semibold text-slate mb-3">
            Signs to Watch For
          </h3>
          <div className="bg-ocean/5 rounded-xl border border-ocean/20 px-5 py-4 space-y-3">
            {DOMAIN_TIPS[domain].map((tip, i) => (
              <div key={i} className="flex gap-3">
                <div className="text-ocean mt-0.5 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
                  </svg>
                </div>
                <p className="font-sans text-sm text-slateMid leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What's Missing */}
      {missingGaps.length > 0 && (
        <div>
          <h3 className="font-serif text-lg font-semibold text-slate mb-3">
            What&apos;s Missing
          </h3>
          <div className="bg-white rounded-xl border border-sandDark overflow-hidden">
            {missingGaps.map((gap, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-sand" : ""}`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#D4725C" }}
                />
                <span className="font-sans text-sm text-slate">{gap.label}</span>
              </div>
            ))}
          </div>
          <Link
            href={`/readiness?startDomain=${domain}`}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-ocean text-white rounded-xl px-6 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors"
          >
            Complete Assessment
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Update answers link (always visible) */}
      {missingGaps.length === 0 && (
        <div className="text-center">
          <Link
            href={`/readiness?startDomain=${domain}`}
            className="font-sans text-sm text-ocean hover:text-oceanMid transition-colors"
          >
            Update answers &rarr;
          </Link>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div>
          <h3 className="font-serif text-lg font-semibold text-slate mb-3">
            Pending Tasks
          </h3>
          <div className="bg-white rounded-xl border border-sandDark overflow-hidden">
            {pendingTasks.map((task, i) => (
              <button
                key={i}
                onClick={() => setSelectedTask(task)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-sand/30 transition-colors ${i > 0 ? "border-t border-sand" : ""}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: DOMAIN_COLORS[task.domain as keyof typeof DOMAIN_COLORS] || "#7F9BAC" }}
                  />
                  <span className="font-sans text-sm text-slate truncate">{task.title}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span
                    className="font-sans text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: PRIORITY_COLORS[task.priority] || "#7F9BAC" }}
                  >
                    {task.priority}
                  </span>
                  <span className="text-slateLight text-sm">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onMarkComplete={handleMarkComplete}
          userContext={{
            parentState: parentProfile?.state,
            parentName: parentProfile?.name,
          }}
        />
      )}
    </div>
  );
}

function DataCard({
  data,
  onSave,
  onDelete,
}: {
  data: TaskData;
  onSave: (taskTitle: string, toolName: string, updatedData: TaskDataPayload) => void;
  onDelete: (taskTitle: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<TaskDataPayload>(data.data);

  const domain = getDomainFromToolName(data.toolName, data.taskTitle);
  const style = DOMAIN_STYLES[domain] || DOMAIN_STYLES.other;

  const handleSave = () => {
    onSave(data.taskTitle, data.toolName, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(data.data);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(data.taskTitle);
  };

  return (
    <div className="bg-white rounded-xl border border-sandDark overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 text-left hover:bg-sand/30 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-sans text-base font-semibold text-slate">
                {data.taskTitle}
              </div>
              <span
                className="font-sans text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${style.color}15`, color: style.color }}
              >
                {style.label}
              </span>
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
          {isEditing ? (
            <div className="mt-3 space-y-3">
              {renderEditFields(data.toolName, editData, setEditData)}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  className="bg-ocean text-white rounded-lg px-4 py-2 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-sand text-slateMid rounded-lg px-4 py-2 font-sans text-sm font-semibold hover:bg-sandDark transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {renderDataFields(data.toolName, data.data, style.color)}
              <div className="flex gap-2 pt-2 border-t border-sand">
                <button
                  onClick={() => {
                    setEditData(data.data);
                    setIsEditing(true);
                  }}
                  className="font-sans text-sm font-semibold text-ocean hover:text-oceanMid transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="font-sans text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditInput({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-1 block">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full border border-sandDark rounded-lg px-3 py-2 font-sans text-sm text-slate focus:outline-none focus:ring-1 focus:ring-ocean"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-sandDark rounded-lg px-3 py-2 font-sans text-sm text-slate focus:outline-none focus:ring-1 focus:ring-ocean"
        />
      )}
    </div>
  );
}

function renderEditFields(
  toolName: string,
  data: TaskDataPayload,
  setData: (data: TaskDataPayload) => void
) {
  const update = (field: string, value: string) => {
    setData({ ...data, [field]: value });
  };

  if (toolName === "save_doctor_info") {
    const doc = data as DoctorInfo;
    return (
      <>
        <EditInput label="Doctor Name" value={doc.name || ""} onChange={(v) => update("name", v)} />
        <EditInput label="Phone" value={doc.phone || ""} onChange={(v) => update("phone", v)} />
        <EditInput label="Address" value={doc.address || ""} onChange={(v) => update("address", v)} />
        <EditInput label="Specialty" value={doc.specialty || ""} onChange={(v) => update("specialty", v)} />
      </>
    );
  }

  if (toolName === "save_medication_list") {
    const medList = data as MedicationList;
    const meds = medList.medications || [];

    const updateMed = (index: number, field: keyof MedicationEntry, value: string) => {
      const updated = meds.map((m, i) => (i === index ? { ...m, [field]: value } : m));
      setData({ ...data, medications: updated });
    };

    const addMed = () => {
      setData({ ...data, medications: [...meds, { name: "", dosage: "", frequency: "", purpose: "" }] });
    };

    const removeMed = (index: number) => {
      setData({ ...data, medications: meds.filter((_, i) => i !== index) });
    };

    return (
      <div className="space-y-3">
        <div className="font-sans text-sm font-semibold text-slateMid uppercase tracking-wide">
          Medications
        </div>
        {meds.map((med: MedicationEntry, i: number) => (
          <div key={i} className="p-3 rounded-lg bg-sand/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold text-slateMid">
                Medication {i + 1}
              </span>
              <button
                onClick={() => removeMed(i)}
                className="font-sans text-xs text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <EditInput label="Name" value={med.name || ""} onChange={(v) => updateMed(i, "name", v)} />
            <EditInput label="Dosage" value={med.dosage || ""} onChange={(v) => updateMed(i, "dosage", v)} />
            <EditInput label="Frequency" value={med.frequency || ""} onChange={(v) => updateMed(i, "frequency", v)} />
            <EditInput label="Purpose" value={med.purpose || ""} onChange={(v) => updateMed(i, "purpose", v)} />
          </div>
        ))}
        <button
          onClick={addMed}
          className="font-sans text-sm font-semibold text-ocean hover:text-oceanMid transition-colors"
        >
          + Add Medication
        </button>
      </div>
    );
  }

  if (toolName === "save_insurance_info") {
    const ins = data as InsuranceInfo;
    return (
      <>
        <EditInput label="Provider" value={ins.provider || ""} onChange={(v) => update("provider", v)} />
        <EditInput label="Policy Number" value={ins.policyNumber || ""} onChange={(v) => update("policyNumber", v)} />
        <EditInput label="Group Number" value={ins.groupNumber || ""} onChange={(v) => update("groupNumber", v)} />
        <EditInput label="Phone" value={ins.phone || ""} onChange={(v) => update("phone", v)} />
      </>
    );
  }

  if (toolName === "save_legal_document_info") {
    const legal = data as LegalDocumentInfo;
    return (
      <>
        <EditInput label="Document Type" value={legal.documentType || ""} onChange={(v) => update("documentType", v)} />
        <EditInput label="Status" value={legal.status || ""} onChange={(v) => update("status", v)} />
        <EditInput label="Agent/Proxy" value={legal.agent || ""} onChange={(v) => update("agent", v)} />
        <EditInput label="Location" value={legal.location || ""} onChange={(v) => update("location", v)} />
        <EditInput label="Date Completed" value={legal.dateCompleted || ""} onChange={(v) => update("dateCompleted", v)} />
      </>
    );
  }

  if (toolName === "save_task_notes" || toolName === "manual_notes") {
    const notes = data as { notes: string };
    return (
      <EditInput
        label="Notes"
        value={notes.notes || ""}
        onChange={(v) => setData({ ...data, notes: v })}
        multiline
      />
    );
  }

  // Fallback: JSON textarea
  return (
    <div>
      <label className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-1 block">
        Data (JSON)
      </label>
      <textarea
        value={JSON.stringify(data, null, 2)}
        onChange={(e) => {
          try {
            setData(JSON.parse(e.target.value));
          } catch {
            // ignore invalid JSON while typing
          }
        }}
        rows={8}
        className="w-full border border-sandDark rounded-lg px-3 py-2 font-mono text-sm text-slate focus:outline-none focus:ring-1 focus:ring-ocean"
      />
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

function getDomainFromToolName(toolName: string, taskTitle?: string): string {
  if (
    toolName.includes("doctor") ||
    toolName.includes("medication") ||
    toolName.includes("insurance")
  ) {
    // LTC insurance is financial
    if (taskTitle && (taskTitle.toLowerCase().includes("long-term care") || taskTitle.toLowerCase().includes("ltc"))) {
      return "financial";
    }
    return "medical";
  }
  if (toolName.includes("legal") || toolName.includes("document")) {
    return "legal";
  }
  if (toolName.includes("financial")) {
    return "financial";
  }

  // For generic notes, infer domain from task title
  if (taskTitle) {
    const t = taskTitle.toLowerCase();
    if (t.includes("health") || t.includes("condition") || t.includes("portal") || t.includes("pharmacy")) return "medical";
    if (t.includes("poa") || t.includes("will") || t.includes("proxy") || t.includes("attorney") || t.includes("directive") || t.includes("legal")) return "legal";
    if (t.includes("bank") || t.includes("income") || t.includes("financial") || t.includes("estate plan")) return "financial";
    if (t.includes("housing") || t.includes("home") || t.includes("address") || t.includes("living") || t.includes("emergency contact")) return "housing";
    if (t.includes("transport") || t.includes("ride") || t.includes("driving") || t.includes("delivery")) return "transportation";
    if (t.includes("social") || t.includes("friend") || t.includes("neighbor") || t.includes("community") || t.includes("check-in")) return "social";
  }

  return "other";
}

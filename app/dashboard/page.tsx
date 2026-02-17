"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Task } from "@/lib/ai/claude";
import { getTasks, hydrateTasksFromDb } from "@/lib/utils/taskStorage";
import {
  getParentProfile,
  getAllParentProfiles,
  setActiveParentId,
  deleteParentProfile,
  hydrateProfilesFromDb,
  type ParentProfile
} from "@/lib/utils/parentProfile";
import { deleteTasksForParent, assignOrphanedTasks } from "@/lib/utils/taskStorage";
import { deleteTaskDataForParent } from "@/lib/utils/taskData";
import { deleteBriefingsForParent } from "@/lib/utils/briefingStorage";
import { calculateReadinessScore, type ReadinessBreakdown } from "@/lib/utils/readinessScore";
import { getBriefingsForParent } from "@/lib/utils/briefingStorage";
import { getAgentActivity } from "@/lib/utils/agentStorage";
import type { WeeklyBriefing } from "@/lib/ai/briefingAgent";
import ParentSwitcher from "@/components/dashboard/ParentSwitcher";
import ReadinessCard from "@/components/dashboard/ReadinessCard";
import ConversationHistory from "@/components/dashboard/ConversationHistory";
import UserNav from "@/components/auth/UserNav";
import { DashboardSkeleton } from "@/components/Skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<ParentProfile[]>([]);
  const [showParentSwitcher, setShowParentSwitcher] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ReadinessBreakdown | null>(null);
  const [latestBriefing, setLatestBriefing] = useState<WeeklyBriefing | null>(null);
  const [unhandledDetections, setUnhandledDetections] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    // Hydrate localStorage from DB (no-op if localStorage already has data)
    await hydrateProfilesFromDb();

    const profile = getParentProfile();
    const profiles = getAllParentProfiles();

    // New user with no profiles — show empty state (don't redirect)
    if (profiles.length === 0) {
      setIsLoading(false);
      return;
    }

    // Assign orphaned tasks (created before intake) to the active parent
    if (profile?.id) {
      assignOrphanedTasks(profile.id);
      await hydrateTasksFromDb(profile.id);
    }

    const storedTasks = getTasks();
    const readinessScore = calculateReadinessScore();

    setTasks(storedTasks);
    setParentProfile(profile);
    setAllProfiles(profiles);
    setReadiness(readinessScore);

    if (profile?.id) {
      const briefings = getBriefingsForParent(profile.id);
      if (briefings.length > 0) {
        setLatestBriefing(briefings[0]);
      }
    }

    const activity = getAgentActivity();
    const unhandled = activity.recentDetections.filter(d => !d.handled).length;
    setUnhandledDetections(unhandled);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitchParent = (parentId: string) => {
    setActiveParentId(parentId);
    loadData();
    setShowParentSwitcher(false);
  };

  const handleDeleteParent = (parentId: string) => {
    deleteTasksForParent(parentId);
    deleteTaskDataForParent(parentId);
    deleteBriefingsForParent(parentId);
    deleteParentProfile(parentId);
    setConfirmDeleteId(null);
    setShowParentSwitcher(false);
    loadData();
  };

  const urgentTasks = tasks.filter((t) => t.priority === "high");
  const otherTasks = tasks.filter((t) => t.priority !== "high");

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />

        <div className="relative">
          <div className="font-sans text-[11px] text-white/60 tracking-[2px] uppercase mb-2">
            Welcome back
          </div>

          <div className="flex items-center justify-between mb-1">
            <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight">
              {parentProfile?.name ? `${parentProfile.name}'s Care Dashboard` : "Your Care Dashboard"}
            </h1>

            <div className="flex items-center gap-2">
              <ParentSwitcher
                allProfiles={allProfiles}
                activeProfile={parentProfile}
                isOpen={showParentSwitcher}
                onToggle={() => setShowParentSwitcher(!showParentSwitcher)}
                onSwitch={handleSwitchParent}
                onDelete={handleDeleteParent}
                confirmDeleteId={confirmDeleteId}
                onConfirmDelete={setConfirmDeleteId}
              />
              <UserNav />
            </div>
          </div>

          {parentProfile?.age && parentProfile?.state && (
            <div className="font-sans text-sm text-white/80">
              Age {parentProfile.age} · {parentProfile.state}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <DashboardSkeleton />
      ) : !parentProfile ? (
        <div className="flex-1 px-5 py-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-ocean/10 rounded-2xl flex items-center justify-center mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1B6B7D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
            </svg>
          </div>
          <h2 className="font-serif text-xl font-semibold text-slate mb-2">Welcome to Harbor</h2>
          <p className="font-sans text-sm text-slateMid mb-8 max-w-[280px]">
            Let&apos;s find out how ready you are to handle a crisis with your aging parent — and build your care command center.
          </p>
          <Link
            href="/get-started"
            className="bg-ocean text-white font-sans text-sm font-semibold px-8 py-3 rounded-xl hover:bg-ocean/90 transition-colors mb-4"
          >
            Get Started
          </Link>
          <Link
            href="/documents"
            className="font-sans text-sm text-slate-400 font-medium hover:underline"
          >
            View uploaded documents
          </Link>
        </div>
      ) : (
      <div className="flex-1 px-5 py-6">
        {/* Alerts Banner */}
        {unhandledDetections > 0 && (
          <Link href="/monitoring" className="block mb-5">
            <div className="w-full bg-amber/10 border-2 border-amber rounded-[14px] px-5 py-3.5 cursor-pointer hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber rounded-lg flex items-center justify-center text-white font-sans text-sm font-bold">
                    {unhandledDetections}
                  </div>
                  <div className="font-sans text-sm text-slate font-medium">
                    {unhandledDetections} new {unhandledDetections === 1 ? "alert" : "alerts"} to review
                  </div>
                </div>
                <div className="text-amber text-sm">&rarr;</div>
              </div>
            </div>
          </Link>
        )}

        {/* Readiness Score */}
        {readiness && <ReadinessCard readiness={readiness} />}

        {/* No assessment prompt */}
        {!readiness && tasks.length === 0 && (
          <Link href="/readiness" className="block mb-5">
            <div className="w-full bg-ocean/5 border-2 border-dashed border-ocean/40 rounded-[14px] px-5 py-5 cursor-pointer hover:border-ocean transition-colors text-center">
              <div className="font-serif text-lg font-semibold text-ocean mb-1">
                Check Your Crisis Readiness
              </div>
              <div className="font-sans text-xs text-slateMid">
                Find out how prepared you are to handle an emergency with {parentProfile?.name || "your parent"} &rarr;
              </div>
            </div>
          </Link>
        )}

        {/* --- Daily Check-ins: Tasks + Briefing --- */}
        <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
          Daily Check-in
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {/* Tasks Card */}
          <Link href="/tasks" className="block">
            <div className="bg-white border-2 border-ocean rounded-[14px] px-4 py-4 cursor-pointer hover:scale-[1.01] transition-transform h-full">
              <div className="w-10 h-10 bg-ocean rounded-xl flex items-center justify-center text-white font-sans text-lg font-bold mb-3">
                {tasks.length}
              </div>
              <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-ocean mb-1">
                Action Items
              </div>
              {tasks.length > 0 ? (
                <div className="font-sans text-[11px] text-slateMid leading-relaxed">
                  {urgentTasks.length > 0 && <span className="text-coral font-semibold">{urgentTasks.length} urgent</span>}
                  {urgentTasks.length > 0 && otherTasks.length > 0 && " · "}
                  {otherTasks.length > 0 && `${otherTasks.length} more`}
                </div>
              ) : (
                <div className="font-sans text-[11px] text-sage">All caught up</div>
              )}
            </div>
          </Link>

          {/* Briefing Card */}
          <Link href="/briefing" className="block">
            <div className="bg-white border-2 border-ocean/50 rounded-[14px] px-4 py-4 cursor-pointer hover:scale-[1.01] transition-transform h-full">
              <div className="w-10 h-10 bg-ocean/80 rounded-xl flex items-center justify-center text-white text-lg mb-3">
                📊
              </div>
              <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-ocean mb-1">
                Briefing
              </div>
              {latestBriefing ? (
                <div className="font-sans text-[11px] text-slateMid leading-relaxed">
                  {latestBriefing.urgentCount > 0 && <span className="text-coral font-semibold">{latestBriefing.urgentCount} urgent</span>}
                  {latestBriefing.urgentCount > 0 && " · "}
                  {latestBriefing.signalCount} signals
                </div>
              ) : (
                <div className="font-sans text-[11px] text-slateMid">This week&apos;s update</div>
              )}
            </div>
          </Link>
        </div>

        {/* Urgent tasks preview */}
        {urgentTasks.length > 0 && (
          <div className="mb-6 bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">
            {urgentTasks.slice(0, 3).map((task, index) => (
              <div key={index} className={`flex items-start gap-2 py-2 ${index > 0 ? "border-t border-coral/10" : ""}`}>
                <div className="w-1.5 h-1.5 bg-coral rounded-full mt-1.5 shrink-0" />
                <div className="font-sans text-sm text-slate leading-snug">{task.title}</div>
              </div>
            ))}
            {urgentTasks.length > 3 && (
              <Link href="/tasks" className="block pt-2 border-t border-coral/10">
                <div className="font-sans text-xs text-coral font-medium">
                  +{urgentTasks.length - 3} more urgent &rarr;
                </div>
              </Link>
            )}
          </div>
        )}

        {/* --- Care Hub --- */}
        <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
          Care Hub
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {/* Information Hub */}
          <Link href="/profile" className="block">
            <div className="bg-white border border-sandDark rounded-[14px] px-4 py-4 cursor-pointer hover:scale-[1.01] transition-transform h-full">
              <div className="w-10 h-10 bg-sage/20 rounded-xl flex items-center justify-center text-sage text-lg mb-3">
                👤
              </div>
              <div className="font-sans text-xs font-semibold text-slate mb-0.5">
                Information Hub
              </div>
              <div className="font-sans text-[11px] text-slateMid">
                Captured details
              </div>
            </div>
          </Link>

          {/* Documents */}
          <Link href="/documents" className="block">
            <div className="bg-white border border-sandDark rounded-[14px] px-4 py-4 cursor-pointer hover:scale-[1.01] transition-transform h-full">
              <div className="w-10 h-10 bg-sand rounded-xl flex items-center justify-center text-lg mb-3">
                📄
              </div>
              <div className="font-sans text-xs font-semibold text-slate mb-0.5">
                Documents
              </div>
              <div className="font-sans text-[11px] text-slateMid">
                Uploaded files
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Conversations */}
        <ConversationHistory />

        {/* Quick Actions */}
        <div className="mt-2">
          <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
            Quick Actions
          </div>
          <div className="space-y-2.5">
            <Link href="/readiness">
              <div className="w-full bg-sand/50 rounded-xl px-4 py-3 cursor-pointer hover:translate-x-1 transition-transform flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-ocean/15 rounded-lg flex items-center justify-center text-ocean text-sm">✓</div>
                  <div className="font-sans text-sm text-slate">{readiness ? "Update readiness assessment" : "Check your readiness"}</div>
                </div>
                <div className="text-slateLight text-sm">&rarr;</div>
              </div>
            </Link>
            <Link href="/crisis?new=1">
              <div className="w-full bg-sand/50 rounded-xl px-4 py-3 cursor-pointer hover:translate-x-1 transition-transform flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-coral/15 rounded-lg flex items-center justify-center text-coral text-sm">+</div>
                  <div className="font-sans text-sm text-slate">Report a new crisis event</div>
                </div>
                <div className="text-slateLight text-sm">&rarr;</div>
              </div>
            </Link>
            <Link href="/monitoring">
              <div className="w-full bg-sand/50 rounded-xl px-4 py-3 cursor-pointer hover:translate-x-1 transition-transform flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sage/15 rounded-lg flex items-center justify-center text-sage text-sm">🤖</div>
                  <div className="font-sans text-sm text-slate">View agent activity</div>
                </div>
                <div className="text-slateLight text-sm">&rarr;</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      )}

    </div>
  );
}

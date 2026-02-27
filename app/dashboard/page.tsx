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
import { deleteTaskDataForParent, getAllTaskData } from "@/lib/utils/taskData";
import { deleteBriefingsForParent } from "@/lib/utils/briefingStorage";
import { calculateReadinessScore, type ReadinessBreakdown } from "@/lib/utils/readinessScore";
import { getBriefingsForParent } from "@/lib/utils/briefingStorage";
import { getAgentActivity } from "@/lib/utils/agentStorage";
import { buildDomainStatuses, type DomainStatus } from "@/lib/utils/careSummary";
import type { WeeklyBriefing } from "@/lib/ai/briefingAgent";
import ParentSwitcher from "@/components/dashboard/ParentSwitcher";
import ReadinessCard from "@/components/dashboard/ReadinessCard";
import DomainStatusTiles from "@/components/dashboard/DomainStatusTiles";
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
  const [domainStatuses, setDomainStatuses] = useState<DomainStatus[]>([]);
  const [latestBriefing, setLatestBriefing] = useState<WeeklyBriefing | null>(null);
  const [unhandledDetections, setUnhandledDetections] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    // Hydrate localStorage from DB (no-op if localStorage already has data)
    await hydrateProfilesFromDb();

    const profile = getParentProfile();
    const profiles = getAllParentProfiles();

    // New user with no profiles — send straight to onboarding
    if (profiles.length === 0) {
      router.push("/get-started");
      return;
    }

    // Assign orphaned tasks (created before intake) to the active parent
    if (profile?.id) {
      assignOrphanedTasks(profile.id);
      await hydrateTasksFromDb(profile.id);
    }

    const storedTasks = getTasks();
    const readinessScore = calculateReadinessScore();

    const taskData = getAllTaskData();
    const domains = buildDomainStatuses(taskData);

    setTasks(storedTasks);
    setParentProfile(profile);
    setAllProfiles(profiles);
    setReadiness(readinessScore);
    setDomainStatuses(domains);

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
            <div className="flex items-center gap-3">
              {parentProfile?.photoUrl ? (
                <Link href="/profile" className="flex-shrink-0">
                  <img
                    src={parentProfile.photoUrl}
                    alt={parentProfile.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                  />
                </Link>
              ) : parentProfile?.name ? (
                <Link href="/profile" className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                    <span className="font-serif text-white text-xl font-semibold">
                      {parentProfile.name.charAt(0)}
                    </span>
                  </div>
                </Link>
              ) : null}
              <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight">
                {parentProfile?.name ? `${parentProfile.name}'s Care Dashboard` : "Your Care Dashboard"}
              </h1>
            </div>

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
      {isLoading || !parentProfile ? (
        <DashboardSkeleton />
      ) : (
      <div className="flex-1 px-5 py-6">
        {/* Weekly Briefing — with alert count folded in */}
        <Link href="/briefing" className="block mb-5">
          <div className="bg-white border-2 border-ocean rounded-[14px] overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform">
            <div className="px-5 py-3 bg-ocean/5 border-b border-sandDark flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean">
                  This Week&apos;s Briefing
                </div>
                {unhandledDetections > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber/15 rounded-full px-2.5 py-0.5">
                    <div className="w-1.5 h-1.5 bg-amber rounded-full" />
                    <span className="font-sans text-[11px] font-semibold text-amber">
                      {unhandledDetections} new
                    </span>
                  </div>
                )}
              </div>
              <div className="text-ocean text-sm">&rarr;</div>
            </div>
            <div className="px-5 py-4">
              {latestBriefing ? (
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    {latestBriefing.urgentCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-coral rounded-full" />
                        <span className="font-sans text-sm text-coral font-semibold">{latestBriefing.urgentCount} urgent</span>
                      </div>
                    )}
                    {latestBriefing.importantCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-amber rounded-full" />
                        <span className="font-sans text-sm text-slateMid">{latestBriefing.importantCount} important</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-ocean rounded-full" />
                      <span className="font-sans text-sm text-slateMid">{latestBriefing.signalCount} signals</span>
                    </div>
                  </div>
                  <div className="font-sans text-xs text-slateMid">
                    Tap to read your personalized care update
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-sans text-sm text-slate mb-1">
                    Your weekly care update will appear here
                  </div>
                  <div className="font-sans text-xs text-slateMid">
                    Briefings are generated based on your parent&apos;s situation and any new developments
                  </div>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Readiness Score + Action Items (consolidated) */}
        {readiness && <ReadinessCard readiness={readiness} hasCompletedIntake={!!parentProfile} tasks={tasks} />}

        {/* Domain Status Tiles */}
        {domainStatuses.length > 0 && <DomainStatusTiles statuses={domainStatuses} />}

        {/* --- Care Hub --- */}
        <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
          Care Hub
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.625rem", marginBottom: "1.25rem" }}>
          {/* Ask Harbor */}
          <Link href="/help" className="block">
            <div className="bg-white border border-sandDark rounded-[14px] px-3.5 py-3.5 cursor-pointer hover:scale-[1.01] transition-transform h-full">
              <div className="w-9 h-9 bg-ocean/15 rounded-xl flex items-center justify-center text-ocean text-base mb-2.5">
                💬
              </div>
              <div className="font-sans text-[11px] font-semibold text-slate mb-0.5">
                Ask Harbor
              </div>
              <div className="font-sans text-[10px] text-slateMid">
                Get help
              </div>
            </div>
          </Link>

          {/* Documents */}
          <Link href="/documents" className="block">
            <div className="bg-white border border-sandDark rounded-[14px] px-3.5 py-3.5 cursor-pointer hover:scale-[1.01] transition-transform h-full">
              <div className="w-9 h-9 bg-sand rounded-xl flex items-center justify-center text-base mb-2.5">
                📄
              </div>
              <div className="font-sans text-[11px] font-semibold text-slate mb-0.5">
                Documents
              </div>
              <div className="font-sans text-[10px] text-slateMid">
                Uploaded files
              </div>
            </div>
          </Link>

          {/* Export & Share */}
          <Link href="/export" className="block">
            <div className="bg-white border border-sandDark rounded-[14px] px-3.5 py-3.5 cursor-pointer hover:scale-[1.01] transition-transform h-full">
              <div className="w-9 h-9 bg-ocean/10 rounded-xl flex items-center justify-center text-ocean text-base mb-2.5">
                📤
              </div>
              <div className="font-sans text-[11px] font-semibold text-slate mb-0.5">
                Export
              </div>
              <div className="font-sans text-[10px] text-slateMid">
                Share info
              </div>
            </div>
          </Link>

          {/* Profile */}
          <Link href="/profile" className="block">
            <div className="bg-white border border-sandDark rounded-[14px] px-3.5 py-3.5 cursor-pointer hover:scale-[1.01] transition-transform h-full">
              <div className="w-9 h-9 bg-sage/15 rounded-xl flex items-center justify-center text-sage text-base mb-2.5">
                👤
              </div>
              <div className="font-sans text-[11px] font-semibold text-slate mb-0.5">
                Profile
              </div>
              <div className="font-sans text-[10px] text-slateMid">
                Parent info
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Conversations */}
        <ConversationHistory />

        {/* Quick Actions — only items not linked elsewhere */}
        <div style={{ marginTop: "1.25rem" }}>
          <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
            Quick Actions
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/crisis?new=1" className="block">
              <div className="w-full bg-sand/50 rounded-xl px-4 py-3 cursor-pointer hover:translate-x-1 transition-transform flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-coral/15 rounded-lg flex items-center justify-center text-coral text-sm">🚨</div>
                  <div className="font-sans text-sm text-slate">Report a new crisis event</div>
                </div>
                <div className="text-slateLight text-sm">&rarr;</div>
              </div>
            </Link>
            <Link href="/crisis/triage" className="block">
              <div className="w-full bg-sand/50 rounded-xl px-4 py-3 cursor-pointer hover:translate-x-1 transition-transform flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-coral/10 rounded-lg flex items-center justify-center text-coral text-sm">🏥</div>
                  <div className="font-sans text-sm text-slate">ER triage sheet &amp; playbooks</div>
                </div>
                <div className="text-slateLight text-sm">&rarr;</div>
              </div>
            </Link>
            <Link href="/readiness" className="block">
              <div className="w-full bg-sand/50 rounded-xl px-4 py-3 cursor-pointer hover:translate-x-1 transition-transform flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-ocean/15 rounded-lg flex items-center justify-center text-ocean text-sm">✓</div>
                  <div className="font-sans text-sm text-slate">{readiness && readiness.overall > 0 ? "Update readiness assessment" : "Check your readiness"}</div>
                </div>
                <div className="text-slateLight text-sm">&rarr;</div>
              </div>
            </Link>
            <Link href="/monitoring" className="block">
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

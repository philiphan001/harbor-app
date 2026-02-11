"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Task } from "@/lib/ai/claude";
import { getTasks } from "@/lib/utils/taskStorage";
import {
  getParentProfile,
  getAllParentProfiles,
  setActiveParentId,
  type ParentProfile
} from "@/lib/utils/parentProfile";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<ParentProfile[]>([]);
  const [showParentSwitcher, setShowParentSwitcher] = useState(false);

  const loadData = () => {
    const storedTasks = getTasks();
    const profile = getParentProfile();
    const profiles = getAllParentProfiles();
    setTasks(storedTasks);
    setParentProfile(profile);
    setAllProfiles(profiles);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSwitchParent = (parentId: string) => {
    setActiveParentId(parentId);
    loadData(); // Reload data for new active parent
    setShowParentSwitcher(false);
  };

  const urgentTasks = tasks.filter((t) => t.priority === "high");
  const otherTasks = tasks.filter((t) => t.priority !== "high");

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8">
        {/* Background circles */}
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />

        <div className="relative">
          <div className="font-sans text-[11px] text-white/60 tracking-[2px] uppercase mb-2">
            Welcome back
          </div>

          {/* Parent Name with Switcher */}
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight">
              {parentProfile?.name ? `${parentProfile.name}'s Care Dashboard` : "Your Care Dashboard"}
            </h1>

            {/* Parent Switcher - Only show if multiple parents */}
            {allProfiles.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowParentSwitcher(!showParentSwitcher)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="font-sans text-xs font-medium text-white">
                    {allProfiles.length} {allProfiles.length === 1 ? "Parent" : "Parents"}
                  </div>
                  <svg
                    className={`w-4 h-4 text-white transition-transform ${showParentSwitcher ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {showParentSwitcher && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowParentSwitcher(false)}
                    />

                    {/* Dropdown menu */}
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-sandDark z-20">
                      <div className="py-1">
                        {allProfiles.map((profile) => (
                          <button
                            key={profile.id}
                            onClick={() => handleSwitchParent(profile.id)}
                            className={`w-full px-4 py-3 text-left hover:bg-sand/50 transition-colors ${
                              profile.id === parentProfile?.id ? "bg-sand/30" : ""
                            }`}
                          >
                            <div className="font-sans text-sm font-semibold text-slate">
                              {profile.name}
                            </div>
                            {profile.age && profile.state && (
                              <div className="font-sans text-xs text-slateMid mt-0.5">
                                Age {profile.age} · {profile.state}
                              </div>
                            )}
                            {profile.id === parentProfile?.id && (
                              <div className="font-sans text-xs text-ocean font-medium mt-1">
                                ✓ Currently Active
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {parentProfile?.age && parentProfile?.state && (
            <div className="font-sans text-sm text-white/80">
              Age {parentProfile.age} · {parentProfile.state}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 py-6">
        {/* Action Items Card */}
        <Link href="/tasks" className="block mb-6">
          <div className="w-full bg-white border-2 border-ocean rounded-[14px] px-5 py-5 cursor-pointer hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-ocean rounded-xl flex items-center justify-center text-white font-sans text-xl font-bold">
                  {tasks.length}
                </div>
                <div>
                  <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-0.5">
                    Your Action Items
                  </div>
                  {tasks.length > 0 ? (
                    <div className="font-sans text-xs text-slateMid">
                      {urgentTasks.length > 0 && `${urgentTasks.length} urgent`}
                      {urgentTasks.length > 0 && otherTasks.length > 0 && " · "}
                      {otherTasks.length > 0 && `${otherTasks.length} to address`}
                    </div>
                  ) : (
                    <div className="font-sans text-xs text-slateMid">
                      All caught up!
                    </div>
                  )}
                </div>
              </div>
              <div className="text-ocean text-lg">→</div>
            </div>

            {/* Show top 2 urgent tasks */}
            {urgentTasks.slice(0, 2).map((task, index) => (
              <div
                key={index}
                className="flex items-start gap-2 py-2 border-t border-sand"
              >
                <div className="w-1.5 h-1.5 bg-coral rounded-full mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-sm font-medium text-slate">
                    {task.title}
                  </div>
                </div>
              </div>
            ))}

            {tasks.length > 2 && (
              <div className="font-sans text-xs text-slateMid mt-2 pt-2 border-t border-sand">
                +{tasks.length - 2} more {tasks.length - 2 === 1 ? "item" : "items"}
              </div>
            )}
          </div>
        </Link>

        {/* Weekly Briefing Card */}
        <Link href="/briefing" className="block mb-6">
          <div className="w-full bg-ocean/20 border-2 border-ocean rounded-[14px] px-5 py-4 cursor-pointer hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-ocean rounded-xl flex items-center justify-center text-white font-serif text-lg font-semibold">
                  📊
                </div>
                <div>
                  <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-0.5">
                    Weekly Briefing
                  </div>
                  <div className="font-sans text-sm text-slate font-medium">
                    What's happening this week
                  </div>
                </div>
              </div>
              <div className="text-ocean text-lg">→</div>
            </div>
          </div>
        </Link>

        {/* Information Hub Card */}
        <Link href="/profile" className="block mb-8">
          <div className="w-full bg-sage/20 border-2 border-sage rounded-[14px] px-5 py-4 cursor-pointer hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sage rounded-xl flex items-center justify-center text-white font-serif text-lg font-semibold">
                  👤
                </div>
                <div>
                  <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-sage mb-0.5">
                    Information Hub
                  </div>
                  <div className="font-sans text-sm text-slate font-medium">
                    View all captured information
                  </div>
                </div>
              </div>
              <div className="text-sage text-lg">→</div>
            </div>
          </div>
        </Link>

        {/* Quick Actions Section */}
        <div>
          <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-4">
            Quick Actions
          </div>

          <div className="space-y-4">
            <Link href="/crisis">
              <div className="w-full bg-sand/50 rounded-xl px-4 py-3.5 cursor-pointer hover:translate-x-1 transition-transform flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-coral/20 rounded-lg flex items-center justify-center text-coral text-base">
                    +
                  </div>
                  <div className="font-sans text-sm font-medium text-slate">
                    {allProfiles.length === 1 ? "Add another parent's profile" : "Update situation or add crisis event"}
                  </div>
                </div>
                <div className="text-slateLight text-sm">→</div>
              </div>
            </Link>

            <Link href="/readiness">
              <div className="w-full bg-sand/50 rounded-xl px-4 py-3.5 cursor-pointer hover:translate-x-1 transition-transform flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-ocean/20 rounded-lg flex items-center justify-center text-ocean text-base">
                    ✓
                  </div>
                  <div className="font-sans text-sm font-medium text-slate">
                    Review readiness assessment
                  </div>
                </div>
                <div className="text-slateLight text-sm">→</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer - Trust Bar */}
      <div className="px-5 py-6 mt-auto border-t border-sandDark">
        <div className="bg-sand rounded-xl p-4 flex gap-3">
          <div className="w-8 h-8 rounded-full bg-ocean text-white flex items-center justify-center font-serif text-sm font-semibold shrink-0">
            H
          </div>
          <div>
            <div className="font-serif text-xs font-medium text-slate mb-1">
              AI-powered care coordination
            </div>
            <div className="font-sans text-[11px] text-slateMid leading-relaxed">
              Your care plan updates automatically as your parent's situation evolves.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

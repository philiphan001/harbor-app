"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { gatherExportData, type ExportData } from "@/lib/utils/exportCareSummary";
import { calculateReadinessScore } from "@/lib/utils/readinessScore";
import {
  getActiveSession,
  getSessionNotes,
  getCompletedDischargeSteps,
  type HospitalNote,
} from "@/lib/utils/hospitalNotes";
import HospitalTabs, { type TabId } from "./components/HospitalTabs";
import OverviewTab from "./components/OverviewTab";
import AskHarborTab from "./components/AskHarborTab";
import NotesTab from "./components/NotesTab";
import DischargeTab from "./components/DischargeTab";
import Disclaimer from "@/components/Disclaimer";

export default function HospitalPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [parentName, setParentName] = useState("");
  const [data, setData] = useState<ExportData | null>(null);
  const [criticalGaps, setCriticalGaps] = useState<string[]>([]);
  const [notes, setNotes] = useState<HospitalNote[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    const profile = getParentProfile();
    if (profile) setParentName(profile.name);

    const exportData = gatherExportData();
    setData(exportData);

    const readiness = calculateReadinessScore();
    setCriticalGaps(readiness.criticalGaps);

    setNotes(getSessionNotes());
    setCompletedSteps(getCompletedDischargeSteps());
  }, []);

  const refreshNotes = useCallback(() => {
    setNotes(getSessionNotes());
  }, []);

  const refreshSteps = useCallback(() => {
    setCompletedSteps(getCompletedDischargeSteps());
  }, []);

  const session = getActiveSession();

  const now = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-coral to-[#B85A4A] px-7 pt-10 pb-6">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="relative">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 font-sans text-xs text-white/70 hover:text-white/90 transition-colors mb-3"
          >
            &larr; Dashboard
          </Link>
          <h1 className="font-serif text-[26px] font-semibold text-white tracking-tight">
            Hospital Companion
          </h1>
          {parentName && (
            <div className="font-sans text-sm text-white/80 mt-1">{parentName}</div>
          )}
          <div className="font-sans text-xs text-white/60 mt-1">{now}</div>
          {session && session.hospitalName && (
            <div className="font-sans text-xs text-white/70 mt-1">
              {session.hospitalName}
              {session.reason ? ` — ${session.reason}` : ""}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4 pb-2">
        <HospitalTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          noteCount={notes.length}
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-5 py-4 pb-8">
        <Disclaimer type="emergency" className="mb-4" />

        {activeTab === "overview" && (
          <OverviewTab data={data} criticalGaps={criticalGaps} />
        )}
        {activeTab === "ask" && <AskHarborTab />}
        {activeTab === "notes" && (
          <NotesTab notes={notes} onNotesChange={refreshNotes} />
        )}
        {activeTab === "discharge" && (
          <DischargeTab
            parentName={parentName}
            completedSteps={completedSteps}
            onStepsChange={refreshSteps}
          />
        )}
      </div>
    </div>
  );
}

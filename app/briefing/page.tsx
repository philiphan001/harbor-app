"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBriefingsForParent, saveBriefing } from "@/lib/utils/briefingStorage";
import { formatWeekOf } from "@/lib/utils/dateUtils";
import { getParentProfile, type ParentProfile } from "@/lib/utils/parentProfile";
import { getAllDetections } from "@/lib/utils/agentStorage";
import type { WeeklyBriefing } from "@/lib/ai/briefingAgent";

export default function BriefingPage() {
  const [briefings, setBriefings] = useState<WeeklyBriefing[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<WeeklyBriefing | null>(null);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadBriefings();
  }, []);

  const loadBriefings = () => {
    const profile = getParentProfile();
    setParentProfile(profile);

    if (profile?.id) {
      const allBriefings = getBriefingsForParent(profile.id);
      setBriefings(allBriefings);

      // Auto-select latest briefing
      if (allBriefings.length > 0) {
        setSelectedBriefing(allBriefings[0]);
      }
    }
  };

  const handleGenerateBriefing = async () => {
    setGenerating(true);
    try {
      // Get all detections from localStorage
      const detections = getAllDetections();

      const response = await fetch("/api/generate-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: parentProfile?.id,
          parentProfile: parentProfile,
          detections: detections,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save briefing to localStorage
        saveBriefing(data.briefing);
        loadBriefings();
      } else {
        alert(`Error: ${data.error || "Failed to generate briefing"}\n${data.message || ""}`);
      }
    } catch (error) {
      console.error("Error generating briefing:", error);
      alert("Failed to generate briefing");
    } finally {
      setGenerating(false);
    }
  };

  if (!parentProfile) {
    return (
      <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
        <div className="flex-1 flex items-center justify-center px-5 py-12">
          <div className="text-center">
            <div className="text-5xl mb-4">📋</div>
            <div className="font-serif text-xl font-semibold text-slate mb-2">
              No Parent Profile Yet
            </div>
            <div className="font-sans text-sm text-slateMid leading-relaxed mb-6">
              Start with the crisis intake or readiness assessment
            </div>
            <Link href="/dashboard">
              <button className="bg-ocean text-white rounded-xl px-6 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors">
                Go to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (briefings.length === 0) {
    return (
      <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
        {/* Header */}
        <div className="bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8 relative">
          <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03]" />

          <div className="relative">
            <Link href="/dashboard" className="font-sans text-sm text-white/80 hover:text-white inline-block mb-4">
              ← Dashboard
            </Link>

            <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight mb-1">
              Weekly Briefings
            </h1>
            <p className="font-sans text-sm text-white/80">For {parentProfile.name}</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center px-5 py-12">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">📊</div>
            <div className="font-serif text-xl font-semibold text-slate mb-2">
              No Briefings Yet
            </div>
            <div className="font-sans text-sm text-slateMid leading-relaxed mb-6">
              Generate your first weekly briefing to see AI-powered care insights based on monitoring signals
            </div>
            <button
              onClick={handleGenerateBriefing}
              disabled={generating}
              className="bg-ocean text-white rounded-xl px-6 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Briefing"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8 relative">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03]" />

        <div className="relative">
          <Link href="/dashboard" className="font-sans text-sm text-white/80 hover:text-white inline-block mb-4">
            ← Dashboard
          </Link>

          <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight mb-1">
            This Week for {parentProfile.name}
          </h1>
          <p className="font-sans text-sm text-white/80">
            {selectedBriefing ? formatWeekOf(selectedBriefing.weekOf) : ""}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        {/* Latest Briefing */}
        {selectedBriefing && (
          <div className="bg-white rounded-xl border border-sandDark px-6 py-6 mb-6">
            <BriefingContent content={selectedBriefing.content} />

            {/* Stats */}
            <div className="mt-6 pt-6 border-t border-sand">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="font-sans text-2xl font-bold text-coral">
                    {selectedBriefing.urgentCount}
                  </div>
                  <div className="font-sans text-xs text-slateMid uppercase tracking-wide">
                    Urgent
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-sans text-2xl font-bold text-amber">
                    {selectedBriefing.importantCount}
                  </div>
                  <div className="font-sans text-xs text-slateMid uppercase tracking-wide">
                    Important
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-sans text-2xl font-bold text-ocean">
                    {selectedBriefing.signalCount}
                  </div>
                  <div className="font-sans text-xs text-slateMid uppercase tracking-wide">
                    Signals
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Previous Briefings */}
        {briefings.length > 1 && (
          <div className="mb-6">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
              Previous Briefings
            </div>

            <div className="space-y-2">
              {briefings.slice(1, 5).map((briefing) => (
                <button
                  key={briefing.briefingId}
                  onClick={() => setSelectedBriefing(briefing)}
                  className="w-full bg-white border border-sandDark rounded-xl px-4 py-3 text-left hover:bg-sand/30 transition-colors"
                >
                  <div className="font-sans text-sm font-semibold text-slate mb-1">
                    {formatWeekOf(briefing.weekOf)}
                  </div>
                  <div className="font-sans text-xs text-slateMid">
                    {briefing.signalCount} signals • {briefing.urgentCount} urgent
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerateBriefing}
          disabled={generating}
          className="w-full bg-ocean text-white rounded-xl px-4 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate New Briefing"}
        </button>
      </div>
    </div>
  );
}

function BriefingContent({ content }: { content: string }) {
  // Simple markdown rendering
  const renderLine = (line: string, index: number) => {
    // H1
    if (line.startsWith("# ")) {
      return (
        <h1 key={index} className="font-serif text-2xl font-semibold text-slate mb-4">
          {line.substring(2)}
        </h1>
      );
    }
    // H2
    if (line.startsWith("## ")) {
      return (
        <h2 key={index} className="font-sans text-base font-semibold text-slate mt-6 mb-3">
          {line.substring(3)}
        </h2>
      );
    }
    // Bullet
    if (line.startsWith("- **") || line.startsWith("  - ")) {
      return (
        <div key={index} className="flex items-start gap-2 mb-2 ml-2">
          <div className="w-1.5 h-1.5 bg-ocean rounded-full mt-2 shrink-0" />
          <div className="font-sans text-sm text-slate leading-relaxed flex-1">
            {line.replace(/^- /, "").replace(/^  - /, "")}
          </div>
        </div>
      );
    }
    // Regular bullet
    if (line.startsWith("- ")) {
      return (
        <div key={index} className="flex items-start gap-2 mb-2">
          <div className="w-1.5 h-1.5 bg-ocean rounded-full mt-2 shrink-0" />
          <div className="font-sans text-sm text-slate leading-relaxed">
            {line.substring(2)}
          </div>
        </div>
      );
    }
    // Empty line
    if (line.trim().length === 0) {
      return <div key={index} className="h-2" />;
    }
    // Regular paragraph
    return (
      <p key={index} className="font-sans text-sm text-slateMid leading-relaxed mb-3">
        {line}
      </p>
    );
  };

  return <div>{content.split("\n").map(renderLine)}</div>;
}

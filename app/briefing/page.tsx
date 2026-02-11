"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBriefingsByParent, markBriefingAsRead } from "@/lib/services/briefingStorage";
import { WeeklyBriefing } from "@/lib/agents/BriefingGenerator";
import { getParentProfile } from "@/lib/utils/parentProfile";

export default function BriefingPage() {
  const [briefings, setBriefings] = useState<WeeklyBriefing[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<WeeklyBriefing | null>(null);
  const [parentProfile, setParentProfile] = useState<any>(null);

  useEffect(() => {
    const profile = getParentProfile();
    setParentProfile(profile);

    if (profile?.id) {
      const allBriefings = getBriefingsByParent(profile.id);
      setBriefings(allBriefings);

      // Auto-select latest briefing
      if (allBriefings.length > 0) {
        setSelectedBriefing(allBriefings[0]);
        if (!allBriefings[0].read) {
          markBriefingAsRead(allBriefings[0].briefingId);
        }
      }
    }
  }, []);

  if (!parentProfile) {
    return (
      <div className="min-h-screen bg-warmWhite">
        <div className="max-w-[420px] mx-auto px-5 py-6">
          <div className="bg-white rounded-xl border border-sandDark px-6 py-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <div className="font-serif text-xl font-semibold text-slate mb-2">
              No Parent Profile Yet
            </div>
            <div className="font-sans text-sm text-slateMid leading-relaxed mb-6">
              Start with the crisis intake or readiness assessment to set up your parent's
              profile.
            </div>
            <Link href="/">
              <button className="bg-ocean text-white rounded-xl px-6 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors">
                Go Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (briefings.length === 0) {
    return (
      <div className="min-h-screen bg-warmWhite">
        <div className="bg-ocean px-5 py-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative max-w-[420px] mx-auto">
            <Link
              href="/"
              className="font-sans text-sm text-white/80 hover:text-white inline-block mb-4"
            >
              ← Home
            </Link>

            <h1 className="font-serif text-3xl font-semibold text-white mb-1">
              Weekly Briefings
            </h1>
            <p className="font-serif text-base text-white/80 leading-relaxed italic">
              For {parentProfile.name}
            </p>
          </div>
        </div>

        <div className="max-w-[420px] mx-auto px-5 py-6">
          <div className="bg-white rounded-xl border border-sandDark px-6 py-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <div className="font-serif text-xl font-semibold text-slate mb-2">
              No Briefings Yet
            </div>
            <div className="font-sans text-sm text-slateMid leading-relaxed mb-6">
              Weekly briefings are generated automatically based on monitoring signals. Your
              first briefing will appear here once the monitoring system detects relevant
              updates.
            </div>
            <Link href="/">
              <button className="bg-ocean text-white rounded-xl px-6 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors">
                Go Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warmWhite">
      {/* Header */}
      <div className="bg-ocean px-5 py-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative max-w-[420px] mx-auto">
          <Link
            href="/"
            className="font-sans text-sm text-white/80 hover:text-white inline-block mb-4"
          >
            ← Home
          </Link>

          <h1 className="font-serif text-3xl font-semibold text-white mb-1">
            This Week for {parentProfile.name}
          </h1>
          <p className="font-serif text-base text-white/80 leading-relaxed italic">
            Week of {selectedBriefing ? formatWeekDate(selectedBriefing.weekOf) : ""}
          </p>
        </div>
      </div>

      <div className="max-w-[420px] mx-auto px-5 py-6">
        {/* Latest Briefing */}
        {selectedBriefing && (
          <div className="bg-white rounded-xl border border-sandDark px-6 py-6 mb-6">
            <BriefingContent content={selectedBriefing.content} />

            {/* Action Progress */}
            {selectedBriefing.actions.total > 0 && (
              <div className="mt-6 pt-6 border-t border-sand">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-sans text-sm font-semibold text-slate">
                    Action Items
                  </div>
                  <div className="font-sans text-sm text-slateMid">
                    {selectedBriefing.actions.completed} of {selectedBriefing.actions.total}{" "}
                    completed
                  </div>
                </div>
                <div className="w-full bg-sand rounded-full h-2">
                  <div
                    className="bg-ocean rounded-full h-2 transition-all"
                    style={{
                      width: `${(selectedBriefing.actions.completed / selectedBriefing.actions.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Previous Briefings */}
        {briefings.length > 1 && (
          <div>
            <div className="font-sans text-sm font-semibold text-slate mb-3">
              Previous Briefings
            </div>

            <div className="space-y-2">
              {briefings.slice(1, 5).map((briefing) => (
                <button
                  key={briefing.briefingId}
                  onClick={() => {
                    setSelectedBriefing(briefing);
                    if (!briefing.read) {
                      markBriefingAsRead(briefing.briefingId);
                    }
                  }}
                  className="w-full bg-white border border-sandDark rounded-xl px-4 py-3 text-left hover:bg-sand/30 transition-colors"
                >
                  <div className="font-sans text-sm font-semibold text-slate mb-1">
                    Week of {formatWeekDate(briefing.weekOf)}
                  </div>
                  <div className="font-sans text-xs text-slateMid">
                    {briefing.signalIds.length} signals • {briefing.actions.total} action items
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generate Test Briefing Button (Dev Only) */}
        <div className="mt-6">
          <Link href="/briefing/demo">
            <button className="w-full bg-amber/20 border border-amber text-slate rounded-xl px-4 py-3 font-sans text-sm font-semibold hover:bg-amber/30 transition-colors">
              🧪 Generate Demo Briefing
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function BriefingContent({ content }: { content: string }) {
  // Simple markdown-to-HTML conversion
  const renderMarkdown = (md: string) => {
    // Split by lines
    const lines = md.split("\n");
    const elements: JSX.Element[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // H1
      if (line.startsWith("# ")) {
        elements.push(
          <h1 key={i} className="font-serif text-2xl font-semibold text-slate mb-4">
            {line.substring(2)}
          </h1>
        );
      }
      // H2
      else if (line.startsWith("## ")) {
        elements.push(
          <h2 key={i} className="font-sans text-lg font-semibold text-slate mt-6 mb-3">
            {line.substring(3)}
          </h2>
        );
      }
      // Bullet points
      else if (line.startsWith("- ")) {
        elements.push(
          <div key={i} className="flex items-start gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-ocean rounded-full mt-2 shrink-0" />
            <div className="font-sans text-sm text-slate leading-relaxed">
              {line.substring(2)}
            </div>
          </div>
        );
      }
      // Paragraph
      else if (line.trim().length > 0) {
        elements.push(
          <p key={i} className="font-sans text-sm text-slateMid leading-relaxed mb-3">
            {line}
          </p>
        );
      }
      // Empty line
      else {
        elements.push(<div key={i} className="h-2" />);
      }
    }

    return elements;
  };

  return <div>{renderMarkdown(content)}</div>;
}

function formatWeekDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

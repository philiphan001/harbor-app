"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile, type ParentProfile } from "@/lib/utils/parentProfile";
import { runAllInternalAgents, type InternalAgentDetection } from "@/lib/ai/internalAgents";
import Disclaimer from "@/components/Disclaimer";

export default function InsightsPage() {
  const [detections, setDetections] = useState<InternalAgentDetection[]>([]);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = () => {
    setLoading(true);
    const profile = getParentProfile();
    setParentProfile(profile);

    // Run internal agents
    const results = runAllInternalAgents();
    setDetections(results);
    setLoading(false);
  };

  const criticalDetections = detections.filter(d => d.severity === "critical");
  const highDetections = detections.filter(d => d.severity === "high");
  const mediumDetections = detections.filter(d => d.severity === "medium");
  const lowDetections = detections.filter(d => d.severity === "low");

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard"
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="font-sans text-[11px] text-white/60 tracking-[2px] uppercase">
              Data Insights
            </div>
            <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight">
              Readiness Gaps
            </h1>
          </div>
        </div>

        {parentProfile && (
          <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
            <div className="font-sans text-xs text-white/80 mb-1">Analyzing data for:</div>
            <div className="font-sans text-sm font-semibold text-white">
              {parentProfile.name}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 py-6">
        <Disclaimer type="general" className="mb-4" />

        {loading ? (
          <div className="text-center py-12">
            <div className="font-sans text-sm text-slateMid">Analyzing your data...</div>
          </div>
        ) : detections.length === 0 ? (
          <div className="bg-sage/10 border-2 border-sage rounded-xl px-5 py-8 text-center">
            <div className="text-5xl mb-3">✓</div>
            <div className="font-serif text-xl font-semibold text-slate mb-2">
              Looking Good!
            </div>
            <div className="font-sans text-sm text-slateMid">
              No critical gaps or issues detected in your data.
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-white border border-sandDark rounded-xl px-5 py-4 mb-6">
              <div className="font-sans text-sm font-semibold text-slate mb-3">
                Found {detections.length} {detections.length === 1 ? "issue" : "issues"} to address
              </div>
              <div className="flex items-center gap-4">
                {criticalDetections.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-coral rounded-full" />
                    <div className="font-sans text-xs font-medium text-coral">
                      {criticalDetections.length} Critical
                    </div>
                  </div>
                )}
                {highDetections.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-amber rounded-full" />
                    <div className="font-sans text-xs font-medium text-amber">
                      {highDetections.length} High
                    </div>
                  </div>
                )}
                {mediumDetections.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-ocean rounded-full" />
                    <div className="font-sans text-xs font-medium text-ocean">
                      {mediumDetections.length} Medium
                    </div>
                  </div>
                )}
                {lowDetections.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-sage rounded-full" />
                    <div className="font-sans text-xs font-medium text-sage">
                      {lowDetections.length} Low
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detections by severity */}
            {criticalDetections.length > 0 && (
              <div className="mb-6">
                <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-coral mb-3">
                  Critical ({criticalDetections.length})
                </div>
                <div className="space-y-3">
                  {criticalDetections.map(detection => (
                    <DetectionCard key={detection.id} detection={detection} />
                  ))}
                </div>
              </div>
            )}

            {highDetections.length > 0 && (
              <div className="mb-6">
                <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-3">
                  High Priority ({highDetections.length})
                </div>
                <div className="space-y-3">
                  {highDetections.map(detection => (
                    <DetectionCard key={detection.id} detection={detection} />
                  ))}
                </div>
              </div>
            )}

            {mediumDetections.length > 0 && (
              <div className="mb-6">
                <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
                  Medium Priority ({mediumDetections.length})
                </div>
                <div className="space-y-3">
                  {mediumDetections.map(detection => (
                    <DetectionCard key={detection.id} detection={detection} />
                  ))}
                </div>
              </div>
            )}

            {lowDetections.length > 0 && (
              <div className="mb-6">
                <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
                  Low Priority ({lowDetections.length})
                </div>
                <div className="space-y-3">
                  {lowDetections.map(detection => (
                    <DetectionCard key={detection.id} detection={detection} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DetectionCard({ detection }: { detection: InternalAgentDetection }) {
  const severityColor =
    detection.severity === "critical"
      ? "coral"
      : detection.severity === "high"
      ? "amber"
      : detection.severity === "medium"
      ? "ocean"
      : "sage";

  return (
    <div className="bg-white border-2 border-sandDark rounded-xl p-4">
      <div className="flex items-start gap-3 mb-2">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
          detection.severity === "critical"
            ? "bg-coral"
            : detection.severity === "high"
            ? "bg-amber"
            : detection.severity === "medium"
            ? "bg-ocean"
            : "bg-sage"
        }`} />
        <div className="flex-1 min-w-0">
          <div className="font-sans text-sm font-semibold text-slate mb-1">
            {detection.title}
          </div>
          <div className="font-sans text-xs text-slateMid leading-relaxed mb-3">
            {detection.description}
          </div>

          {detection.suggestedTask && (
            <div className="bg-sand/50 rounded-lg px-3 py-2 border border-sandDark">
              <div className="font-sans text-xs font-semibold text-slate mb-1">
                Suggested Action:
              </div>
              <div className="font-sans text-xs text-slateMid">
                {detection.suggestedTask.title}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

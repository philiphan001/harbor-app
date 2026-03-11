"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAgentActivity, markDetectionHandled as markLocalHandled, detectionToTask, markDetectionConvertedToTask } from "@/lib/utils/agentStorage";
import { addTask } from "@/lib/utils/taskStorage";
import { AgentActivity, AgentDetection, AGENT_METADATA, EXTERNAL_AGENT_METADATA, type ExternalAgentType } from "@/lib/types/agents";
import { getParentProfile, type ParentProfile } from "@/lib/utils/parentProfile";
import type { ScoredSignalResult } from "@/lib/types/taskCapture";

export default function MonitoringPage() {
  const [activity, setActivity] = useState<AgentActivity | null>(null);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [runningAgents, setRunningAgents] = useState(false);
  const [lastRunResult, setLastRunResult] = useState<string | null>(null);
  const [situationId, setSituationId] = useState<string | null>(null);

  const loadActivity = useCallback(async () => {
    // Start with localStorage data (fast, always available)
    const localData = getAgentActivity();

    // Try to fetch DB detections and merge
    try {
      const response = await fetch("/api/agents/detections");
      if (response.ok) {
        const { detections: dbDetections, situationId: sid } = await response.json();
        if (sid) setSituationId(sid);
        if (dbDetections && dbDetections.length > 0) {
          // Merge: DB detections + localStorage detections (dedup by title)
          const seenTitles = new Set(dbDetections.map((d: AgentDetection) => d.title));
          const localOnly = localData.recentDetections.filter(
            (d) => !seenTitles.has(d.title)
          );
          localData.recentDetections = [...dbDetections, ...localOnly]
            .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
            .slice(0, 50);

          // Derive lastRun for each agent from the most recent detection
          for (const agent of localData.agents) {
            const latestDetection = localData.recentDetections.find(
              (d) => d.agentType === agent.type
            );
            if (latestDetection && (!agent.lastRun || latestDetection.detectedAt > agent.lastRun)) {
              agent.lastRun = latestDetection.detectedAt;
            }
          }
        }
      }
    } catch {
      // DB unavailable — localStorage is the fallback
    }

    setActivity(localData);
  }, []);

  useEffect(() => {
    loadActivity();
    const profile = getParentProfile();
    setParentProfile(profile);
  }, [loadActivity]);

  const handleMarkHandled = async (detectionId: string, handled: boolean) => {
    // Try DB first
    try {
      await fetch("/api/agents/detections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: detectionId, situationId }),
      });
    } catch {
      // Fall back to localStorage
    }

    // Also update localStorage
    markLocalHandled(detectionId, handled);
    loadActivity();
  };

  const handleRunAgents = async () => {
    setRunningAgents(true);
    setLastRunResult(null);
    try {
      const response = await fetch("/api/cron/agents");
      const data = await response.json();
      if (data.success) {
        setLastRunResult(
          `Found ${data.totalNewAlerts} new alerts in ${Math.round(data.duration / 1000)}s`
        );
        // Reload detections
        await loadActivity();
      } else {
        setLastRunResult(`Error: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setLastRunResult("Failed to run agents — check server logs");
    } finally {
      setRunningAgents(false);
    }
  };

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmWhite">
        <div className="font-sans text-slate">Loading agent activity...</div>
      </div>
    );
  }

  const unhandledCount = activity.recentDetections.filter((d) => !d.handled).length;

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
            <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight">
              AI Agents
            </h1>
            <div className="font-sans text-xs text-white/70">
              Working behind the scenes for you
            </div>
          </div>
        </div>

        {/* Context Summary */}
        {activity.context.parentName && (
          <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
            <div className="font-sans text-xs text-white/80 mb-1">Monitoring for:</div>
            <div className="font-sans text-sm font-semibold text-white">
              {activity.context.parentName}
              {activity.context.parentAge && `, age ${activity.context.parentAge}`}
              {activity.context.parentState && ` · ${activity.context.parentState}`}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 py-6">

        {/* ── WATCH Section (active) ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block w-2 h-2 rounded-full bg-sage" />
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slate">
              Watch
            </div>
          </div>

          {/* Compact agent cards */}
          <div className="space-y-2 mb-4">
            {activity.agents
              .filter((a) => a.type in EXTERNAL_AGENT_METADATA)
              .map((agent) => {
                const metadata = AGENT_METADATA[agent.type];
                const lastRunDate = agent.lastRun ? new Date(agent.lastRun) : null;
                const timeAgo = lastRunDate ? getTimeAgo(lastRunDate) : "Never run";

                return (
                  <div
                    key={agent.type}
                    className="bg-white border border-sandDark rounded-xl px-4 py-3 flex items-center gap-3"
                  >
                    <div className="text-xl shrink-0">{metadata.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-sans text-sm font-semibold text-slate truncate">
                        {agent.name}
                      </div>
                      <div className="font-sans text-[11px] text-slateMid">
                        {timeAgo}
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full font-sans text-[10px] font-medium ${
                        agent.status === "running"
                          ? "bg-ocean/10 text-ocean"
                          : "bg-sage/10 text-sage"
                      }`}
                    >
                      {agent.status === "running" ? "Running" : "On"}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Check for Updates */}
          <div className="bg-sand rounded-xl px-5 py-4 mb-4">
            {activity.recentDetections.length === 0 ? (
              <div className="font-sans text-sm text-slate mb-3">
                No agent detections yet. Run agents to scan for policy changes and eldercare news.
              </div>
            ) : (
              <div className="font-sans text-sm text-slate mb-3">
                {activity.recentDetections.filter((d) => !d.handled).length} unhandled detections.
                Run agents again to check for new updates.
              </div>
            )}

            <button
              onClick={handleRunAgents}
              disabled={runningAgents}
              className="w-full bg-ocean text-white rounded-xl px-4 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors disabled:opacity-50"
            >
              {runningAgents ? "Running Agents..." : "Check for Updates"}
            </button>

            {lastRunResult && (
              <div className="mt-3 font-sans text-xs text-slateMid bg-white rounded-lg px-3 py-2">
                {lastRunResult}
              </div>
            )}
          </div>

          {/* Recent Detections */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight">
                Recent Detections
              </div>
              {unhandledCount > 0 && (
                <div className="px-2 py-1 bg-coral/10 text-coral rounded-full font-sans text-xs font-semibold">
                  {unhandledCount} new
                </div>
              )}
            </div>

            {activity.recentDetections.length === 0 ? (
              <div className="bg-sand rounded-xl px-5 py-8 text-center">
                <div className="text-4xl mb-2">🔍</div>
                <div className="font-sans text-sm text-slateMid">
                  No detections yet. Agents will start monitoring soon.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.recentDetections.map((detection) => (
                  <DetectionCard
                    key={detection.id}
                    detection={detection}
                    onMarkHandled={handleMarkHandled}
                    parentProfile={parentProfile}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RESEARCH Section (coming soon) ── */}
        <ComingSoonSection label="Research" agents={RESEARCH_AGENTS} />

        {/* ── COORDINATE Section (coming soon) ── */}
        <ComingSoonSection label="Coordinate" agents={COORDINATE_AGENTS} />

        {/* ── ADVOCATE Section (coming soon, premium) ── */}
        <ComingSoonSection label="Advocate" agents={ADVOCATE_AGENTS} premium />
      </div>
    </div>
  );
}

// ── Coming Soon Agent Data ──

const RESEARCH_AGENTS = [
  { icon: "📊", name: "Plan Comparison", description: "Compare Medicare Advantage plans side by side" },
  { icon: "🔎", name: "Provider Search", description: "Find home health aides, specialists, or facilities nearby" },
  { icon: "📋", name: "Coverage Lookup", description: "Check what your parent's insurance covers" },
];

const COORDINATE_AGENTS = [
  { icon: "👨‍👩‍👧‍👦", name: "Family Updates", description: "Auto-send weekly care summaries to family members" },
  { icon: "📝", name: "Appointment Auto-Prep", description: "Generate prep sheets before each doctor visit" },
  { icon: "🏠", name: "Care Transition Guide", description: "Step-by-step help when care setting changes" },
];

const ADVOCATE_AGENTS = [
  { icon: "⚖️", name: "Claim Dispute Assistant", description: "Draft appeal letters for denied insurance claims" },
  { icon: "🎯", name: "Benefits Optimizer", description: "Find programs your parent qualifies for but hasn't enrolled in" },
  { icon: "💊", name: "Medication Cost Finder", description: "Find lower-cost alternatives and assistance programs" },
];

function ComingSoonSection({
  label,
  agents,
  premium,
}: {
  label: string;
  agents: { icon: string; name: string; description: string }[];
  premium?: boolean;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slate">
          {label}
        </div>
        <div className="px-2 py-0.5 rounded-full bg-sand font-sans text-[10px] font-semibold text-slateMid">
          Coming Soon
        </div>
        {premium && (
          <div className="px-2 py-0.5 rounded-full bg-amber/15 font-sans text-[10px] font-semibold text-amber">
            Premium
          </div>
        )}
      </div>

      <div className="space-y-2">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="bg-white/60 border border-sandDark rounded-xl px-4 py-3 flex items-center gap-3 opacity-55"
          >
            <div className="text-xl shrink-0 grayscale">{agent.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-sans text-sm font-semibold text-slateMid truncate">
                {agent.name}
              </div>
              <div className="font-sans text-[11px] text-slateLight leading-snug">
                {agent.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetectionCard({
  detection,
  onMarkHandled,
  parentProfile,
}: {
  detection: AgentDetection;
  onMarkHandled: (id: string, handled: boolean) => void;
  parentProfile: ParentProfile | null;
}) {
  const [scoring, setScoring] = useState(false);
  const [scored, setScored] = useState<ScoredSignalResult | null>(null);
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [converted, setConverted] = useState(detection.convertedToTask ?? false);

  const metadata = AGENT_METADATA[detection.agentType];
  const detectedDate = new Date(detection.detectedAt);

  const relevanceColor =
    detection.relevanceScore === "high"
      ? "coral"
      : detection.relevanceScore === "medium"
      ? "amber"
      : "sage";

  const handleScore = async () => {
    setScoring(true);
    try {
      const response = await fetch("/api/score-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal: detection, parentProfile }),
      });

      const data = await response.json();
      if (data.success) {
        setScored(data.scored);
        setShowScoreDetails(true);
      }
    } catch (error) {
      console.error("Error scoring signal:", error);
    } finally {
      setScoring(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-coral";
    if (score >= 70) return "text-amber";
    if (score >= 50) return "text-ocean";
    return "text-slateLight";
  };

  return (
    <div
      className={`bg-white border-2 rounded-xl p-4 ${
        detection.handled ? "border-sand opacity-60" : "border-sandDark"
      }`}
    >
      <div className="flex items-start gap-3 mb-2">
        <div className="text-xl shrink-0">{metadata.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-sans text-sm font-semibold text-slate">
              {detection.title}
            </div>
            <div
              className={`px-2 py-0.5 rounded font-sans text-[10px] font-semibold uppercase ${
                detection.relevanceScore === "high"
                  ? "bg-coral/10 text-coral"
                  : detection.relevanceScore === "medium"
                  ? "bg-amber/10 text-amber"
                  : "bg-sage/10 text-sage"
              }`}
            >
              {detection.relevanceScore}
            </div>
          </div>
          <div className="font-sans text-xs text-slateMid leading-relaxed mb-2">
            {detection.description}
          </div>
          {detection.matchReason && (
            <div className="font-sans text-[11px] text-ocean italic leading-relaxed mb-2">
              Why this matters: {detection.matchReason}
            </div>
          )}
          <div className="flex items-center gap-3 font-sans text-[10px] text-slateLight mb-2">
            <span>{metadata.name}</span>
            <span>•</span>
            <span>{getTimeAgo(detectedDate)}</span>
            {detection.sourcePublicationDate && (
              <>
                <span>•</span>
                <span>Published: {new Date(detection.sourcePublicationDate).toLocaleDateString()}</span>
              </>
            )}
            {detection.dueDate && (
              <>
                <span>•</span>
                <span>Due: {new Date(detection.dueDate).toLocaleDateString()}</span>
              </>
            )}
          </div>
          {/* Data Source & Link */}
          {(detection.dataSource || detection.sourceUrl) && (
            <div className="flex items-center gap-2 mb-2">
              {detection.dataSource && (
                <div className="font-sans text-[10px] text-slateLight bg-sand px-2 py-0.5 rounded">
                  {detection.dataSource}
                </div>
              )}
              {detection.sourceUrl && (
                <a
                  href={detection.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-[10px] text-ocean hover:text-oceanMid underline"
                >
                  View source →
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scored Details */}
      {scored && showScoreDetails && (
        <div className="mt-3 p-3 bg-sand/50 rounded-lg border border-sandDark">
          <div className="flex items-center justify-between mb-2">
            <div className="font-sans text-xs font-semibold text-slate">
              AI Relevance Score
            </div>
            <button
              onClick={() => setShowScoreDetails(false)}
              className="text-slateLight hover:text-slate text-xs"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className={`font-sans text-2xl font-bold ${getScoreColor(scored.relevanceScore)}`}>
              {scored.relevanceScore}
            </div>
            <div className="flex-1">
              <div className="font-sans text-xs font-semibold text-slate uppercase">
                {scored.priority} Priority
              </div>
              {scored.estimatedImpact && (
                <div className="font-sans text-[10px] text-slateMid">
                  {scored.estimatedImpact}
                </div>
              )}
            </div>
          </div>

          <div className="font-sans text-xs text-slateMid leading-relaxed mb-2">
            <span className="font-semibold">Why:</span> {scored.reasoning}
          </div>

          {scored.recommendedAction && (
            <div className="font-sans text-xs text-slate bg-white px-3 py-2 rounded">
              <span className="font-semibold">→</span> {scored.recommendedAction}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-sand">
        {!detection.handled ? (
          <button
            onClick={() => onMarkHandled(detection.id, true)}
            className="flex-1 bg-sage text-white rounded-lg px-3 py-2 font-sans text-xs font-semibold hover:bg-sage/80 transition-colors"
          >
            Mark as Read
          </button>
        ) : (
          <button
            onClick={() => onMarkHandled(detection.id, false)}
            className="flex-1 bg-sand text-slateMid rounded-lg px-3 py-2 font-sans text-xs font-medium hover:bg-sandDark transition-colors"
          >
            ✓ Read · Undo
          </button>
        )}

        {/* Score button */}
        <button
          onClick={handleScore}
          disabled={scoring}
          className="flex-1 bg-ocean/10 text-ocean rounded-lg px-3 py-2 font-sans text-xs font-semibold hover:bg-ocean/20 transition-colors disabled:opacity-50"
        >
          {scoring ? "Scoring..." : scored ? "Re-score" : "Score Relevance"}
        </button>

        {detection.actionable && !converted && (
          <button
            onClick={() => {
              const task = detectionToTask(detection);
              addTask(task);
              markDetectionConvertedToTask(detection.id);
              setConverted(true);
            }}
            className="flex-1 bg-ocean text-white rounded-lg px-3 py-2 font-sans text-xs font-semibold hover:bg-oceanMid transition-colors"
          >
            Create Task
          </button>
        )}
        {detection.actionable && converted && (
          <div className="flex-1 bg-sage/10 text-sage rounded-lg px-3 py-2 font-sans text-xs font-semibold text-center">
            Task Created ✓
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

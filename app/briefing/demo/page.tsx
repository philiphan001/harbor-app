"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DemoBriefingPage() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const generateDemoBriefing = async () => {
    setGenerating(true);
    setError(null);

    try {
      // Get parent profile from localStorage
      const profileStr = localStorage.getItem("harbor_parent_profile");
      if (!profileStr) {
        throw new Error("No parent profile found. Please complete crisis intake first.");
      }

      const parentProfile = JSON.parse(profileStr);
      console.log("Using parent profile:", parentProfile);

      const response = await fetch("/api/briefing/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parentProfile }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to generate demo briefing");
      }

      const result = await response.json();
      console.log("Demo briefing generated:", result);

      if (result.briefing) {
        // Save briefing to localStorage
        const existingBriefings = localStorage.getItem("harbor_weekly_briefings");
        const briefings = existingBriefings ? JSON.parse(existingBriefings) : [];
        briefings.unshift(result.briefing);
        localStorage.setItem("harbor_weekly_briefings", JSON.stringify(briefings));
        console.log("Saved briefing to localStorage");

        // Redirect to briefing page
        router.push("/briefing");
      } else {
        setError(result.message || "No briefing generated - no high-relevance signals found");
      }
    } catch (err) {
      console.error("Error generating demo briefing:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-warmWhite">
      <div className="bg-ocean px-5 py-6">
        <div className="max-w-[420px] mx-auto">
          <Link
            href="/briefing"
            className="font-sans text-sm text-white/80 hover:text-white inline-block mb-4"
          >
            ← Back to Briefings
          </Link>

          <h1 className="font-serif text-3xl font-semibold text-white mb-1">
            Demo Briefing Generator
          </h1>
          <p className="font-serif text-base text-white/80 leading-relaxed italic">
            Test the monitoring system
          </p>
        </div>
      </div>

      <div className="max-w-[420px] mx-auto px-5 py-6">
        <div className="bg-white rounded-xl border border-sandDark px-6 py-6">
          <div className="font-sans text-sm text-slateMid leading-relaxed mb-6">
            This will generate a demo weekly briefing using the Calendar Monitor agent. It
            will:
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>Run the Calendar Monitor to detect upcoming dates and deadlines</li>
              <li>Score signals using the Judgment Agent</li>
              <li>Generate a personalized weekly briefing</li>
              <li>Save it to your briefing history</li>
            </ul>
          </div>

          {error && (
            <div className="bg-coral/10 border border-coral rounded-lg px-4 py-3 mb-4">
              <div className="font-sans text-sm text-coral">{error}</div>
            </div>
          )}

          <button
            onClick={generateDemoBriefing}
            disabled={generating}
            className="w-full bg-ocean hover:bg-oceanMid text-white rounded-xl px-6 py-4 font-sans text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span>
                Generating briefing...
              </span>
            ) : (
              "Generate Demo Briefing"
            )}
          </button>
        </div>

        <div className="mt-6 bg-sand rounded-xl px-6 py-5">
          <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-2">
            Note for Development
          </div>
          <div className="font-sans text-sm text-slate leading-relaxed">
            This demo uses your current parent profile. Make sure you've completed the crisis
            intake or set up a parent profile first.
          </div>
        </div>
      </div>
    </div>
  );
}

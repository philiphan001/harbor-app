"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // If user has a parent profile, redirect to dashboard
    const profile = getParentProfile();
    if (profile && profile.name && profile.age) {
      console.log("👤 Profile exists, redirecting to dashboard...");
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-16 pb-12 overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03]" />

        <div className="relative">
          <h1 className="font-serif text-[36px] font-semibold text-white tracking-tight mb-2 leading-tight">
            Harbor
          </h1>
          <div className="font-sans text-[13px] text-white/60 tracking-[2px] uppercase mb-6">
            Elder Care Navigator
          </div>
          <p className="font-serif text-[19px] text-white/90 leading-relaxed font-light">
            A steady hand when your family needs it most.
          </p>
          <p className="font-sans text-[14px] text-white/70 leading-relaxed mt-4">
            AI-powered care coordination for families navigating the unexpected complexity of elder care.
          </p>
        </div>
      </div>

      {/* Video Placeholder */}
      <div className="px-5 pt-8">
        <div className="relative aspect-video bg-gradient-to-br from-ocean to-[#164F5C] rounded-[14px] overflow-hidden flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <div className="text-white text-3xl ml-1">▶</div>
          </div>
          <div className="font-sans text-[13px] text-white/60">
            Video coming soon
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="px-5 pt-8">
        <Link href="/get-started">
          <div className="w-full bg-ocean text-white rounded-[14px] px-6 py-5 cursor-pointer hover:scale-[1.01] transition-transform text-center">
            <div className="font-serif text-[20px] font-semibold mb-1.5">
              Get Started
            </div>
            <div className="font-sans text-[13px] opacity-80">
              Free readiness assessment or crisis support &rarr;
            </div>
          </div>
        </Link>
      </div>

      {/* Visual Value Propositions */}
      <div className="px-5 pt-8 pb-8">
        <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-5">
          What you get with Harbor
        </div>

        <div className="space-y-6">
          <VisualValueProp
            mockup={<ReadinessScoreMockup />}
            title="Know where you stand"
            description="A 5-minute assessment scores your readiness across every domain that matters."
          />
          <VisualValueProp
            mockup={<CrisisMockup />}
            title="ER support in seconds"
            description="When a crisis hits, Harbor builds an action plan from what you already know."
          />
          <VisualValueProp
            mockup={<RoadmapMockup />}
            title="A plan, not a to-do list"
            description="Prioritized next steps so you always know what to tackle first."
          />
          <VisualValueProp
            mockup={<AlertMockup />}
            title="Nothing falls through the cracks"
            description="Deadlines, renewals, and emerging needs — tracked automatically."
          />
        </div>
      </div>

      {/* Trust Bar */}
      <div className="px-5 py-7 mt-auto border-t border-sandDark">
        <div className="bg-sand rounded-xl p-5">
          <div className="font-serif text-[15px] font-semibold text-slate mb-2 leading-snug">
            Most families aren&apos;t ready for what&apos;s coming.
          </div>
          <div className="font-sans text-[12.5px] text-slateMid leading-relaxed mb-3">
            A parent falls. A diagnosis lands. Suddenly you need medical records, legal documents, insurance details, and a plan &mdash; and none of it is in one place. 80% of adult children say they feel unprepared when a caregiving crisis hits.
          </div>
          <div className="font-sans text-[12.5px] text-slate leading-relaxed font-medium">
            Harbor helps you get organized before the emergency &mdash; and guides you through it when it arrives.
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-8">
        <Link href="/get-started">
          <div className="w-full bg-ocean text-white rounded-[14px] px-6 py-5 cursor-pointer hover:scale-[1.01] transition-transform text-center">
            <div className="font-serif text-[20px] font-semibold mb-1.5">
              Get Started
            </div>
            <div className="font-sans text-[13px] opacity-80">
              Free readiness assessment or crisis support &rarr;
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function VisualValueProp({
  mockup,
  title,
  description,
}: {
  mockup: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-[14px] p-5 shadow-sm">
      <div className="mb-4">{mockup}</div>
      <div className="font-serif text-[17px] font-semibold text-slate mb-1">
        {title}
      </div>
      <div className="font-sans text-[13px] text-slateMid leading-relaxed">
        {description}
      </div>
    </div>
  );
}

function ReadinessScoreMockup() {
  const domains = [
    { label: "Medical", pct: 80, color: "bg-sage" },
    { label: "Legal", pct: 30, color: "bg-coral" },
    { label: "Financial", pct: 55, color: "bg-amber" },
    { label: "Housing", pct: 70, color: "bg-ocean" },
  ];

  return (
    <div className="flex items-center gap-5">
      {/* Donut chart */}
      <div className="relative w-[80px] h-[80px] shrink-0">
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "conic-gradient(#1B6B7D 0% 62%, #E8E0D0 62% 100%)",
          }}
        />
        <div className="absolute inset-[10px] rounded-full bg-white flex items-center justify-center">
          <span className="font-serif text-[22px] font-bold text-slate">
            62
          </span>
        </div>
      </div>

      {/* Domain bars */}
      <div className="flex-1 space-y-2">
        {domains.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between mb-0.5">
              <span className="font-sans text-[11px] text-slateMid">
                {d.label}
              </span>
              <span className="font-sans text-[11px] text-slateLight">
                {d.pct}%
              </span>
            </div>
            <div className="h-[5px] bg-sandDark rounded-full overflow-hidden">
              <div
                className={`h-full ${d.color} rounded-full`}
                style={{ width: `${d.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrisisMockup() {
  const items = [
    { text: "Call 911 — confirm ambulance en route", done: true, urgent: true },
    { text: "Grab insurance card from wallet", done: true, urgent: false },
    { text: "List current medications", done: false, urgent: false },
  ];

  return (
    <div className="border-l-[3px] border-coral bg-coralLight/50 rounded-r-lg p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[14px]">🦴</span>
        <span className="font-sans text-[13px] font-semibold text-slate">
          Fall / Fracture
        </span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                item.done
                  ? "bg-ocean border-ocean"
                  : "border-sandDark bg-white"
              }`}
            >
              {item.done && (
                <span className="text-white text-[10px] font-bold">✓</span>
              )}
            </div>
            <span
              className={`font-sans text-[12px] leading-snug ${
                item.done
                  ? "text-slateLight line-through"
                  : "text-slate font-semibold"
              }`}
            >
              {item.text}
            </span>
            {item.urgent && (
              <span className="ml-auto px-1.5 py-0.5 bg-coral/15 text-coral text-[9px] font-bold rounded uppercase">
                Urgent
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapMockup() {
  const tasks = [
    { text: "Confirm POA status", dot: "bg-coral", done: true },
    { text: "Upload insurance card", dot: "bg-amber", done: true },
    { text: "Schedule follow-up", dot: "bg-sage", done: false },
  ];

  return (
    <div className="space-y-2">
      {tasks.map((task, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-sand/60 rounded-lg px-3 py-2.5"
        >
          <div className={`w-2.5 h-2.5 rounded-full ${task.dot} shrink-0`} />
          <span
            className={`font-sans text-[12.5px] flex-1 ${
              task.done ? "text-slateLight line-through" : "text-slate font-medium"
            }`}
          >
            {task.text}
          </span>
          {task.done && (
            <span className="text-ocean text-[13px] font-bold">✓</span>
          )}
        </div>
      ))}
    </div>
  );
}

function AlertMockup() {
  return (
    <div className="border border-amber/30 bg-amber/10 rounded-lg p-3">
      <div className="flex items-start gap-2.5">
        <span className="text-[16px]">🔔</span>
        <div className="flex-1">
          <div className="font-sans text-[12.5px] font-semibold text-slate leading-snug">
            Medicare enrollment window opens in 14 days
          </div>
          <div className="font-sans text-[11px] text-slateLight mt-1.5">
            Snooze · Dismiss
          </div>
        </div>
      </div>
    </div>
  );
}

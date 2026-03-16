"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CRISIS_PLAYBOOKS } from "@/lib/data/crisisPlaybooks";
import { CARE_TRANSITION_PLAYBOOKS } from "@/lib/data/careTransitionPlaybooks";
import { getCascadeForPlaybook } from "@/lib/utils/cascadeStorage";
import type { CascadeInstance } from "@/lib/types/cascade";

interface Guide {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bgClass: string;
  href: string;
  completionKey: string;
}

const GUIDES: Guide[] = [
  {
    id: "advance-directives",
    title: "Advance Directives",
    subtitle: "Healthcare wishes & living will",
    icon: "📋",
    color: "sage",
    bgClass: "bg-sage/15",
    href: "/advance-directives",
    completionKey: "harbor_advance_directive_complete",
  },
  {
    id: "power-of-attorney",
    title: "Power of Attorney",
    subtitle: "Legal & financial authority",
    icon: "⚖️",
    color: "ocean",
    bgClass: "bg-ocean/15",
    href: "/power-of-attorney",
    completionKey: "harbor_poa_complete",
  },
  {
    id: "hipaa-authorization",
    title: "HIPAA Authorization",
    subtitle: "Medical information access",
    icon: "🔒",
    color: "amber",
    bgClass: "bg-amber/15",
    href: "/hipaa-authorization",
    completionKey: "harbor_hipaa_complete",
  },
  {
    id: "home-safety",
    title: "Home Safety",
    subtitle: "Room-by-room safety assessment",
    icon: "🏠",
    color: "amber",
    bgClass: "bg-amber/15",
    href: "/home-safety",
    completionKey: "harbor_home_safety_complete",
  },
  {
    id: "housing-plan",
    title: "Housing & Living",
    subtitle: "Costs, arrangement & transition plan",
    icon: "🏡",
    color: "amber",
    bgClass: "bg-amber/15",
    href: "/housing-plan",
    completionKey: "harbor_housing_plan_complete",
  },
  {
    id: "transportation-plan",
    title: "Transportation Plan",
    subtitle: "Getting to appointments & errands",
    icon: "🚗",
    color: "ocean",
    bgClass: "bg-ocean/15",
    href: "/transportation-plan",
    completionKey: "harbor_transportation_plan_complete",
  },
  {
    id: "social-care",
    title: "Social & Pet Care",
    subtitle: "Connections, check-ins & pet plans",
    icon: "🤝",
    color: "sage",
    bgClass: "bg-sage/15",
    href: "/social-care",
    completionKey: "harbor_social_care_complete",
  },
];

const COMING_SOON = [
  { title: "Medicare Enrollment", icon: "🏥", subtitle: "Navigate enrollment periods" },
  { title: "Medicaid Planning", icon: "📊", subtitle: "Eligibility & applications" },
  { title: "Veterans Benefits", icon: "🇺🇸", subtitle: "VA aid & attendance" },
  { title: "Beneficiary Audit", icon: "📋", subtitle: "Review & update designations" },
];

export default function GuidesPage() {
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [cascades, setCascades] = useState<Record<string, CascadeInstance | null>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    planning: false,
    crisis: false,
    transitions: false,
    comingSoon: false,
  });

  useEffect(() => {
    const completed: Record<string, boolean> = {};
    for (const guide of GUIDES) {
      const val = localStorage.getItem(guide.completionKey);
      completed[guide.id] = val === "true" || (val !== null && val !== "false" && val.startsWith("{"));
    }
    setCompletions(completed);

    const cascadeState: Record<string, CascadeInstance | null> = {};
    for (const pb of CARE_TRANSITION_PLAYBOOKS) {
      cascadeState[pb.id] = getCascadeForPlaybook(pb.id);
    }
    setCascades(cascadeState);
  }, []);

  const toggle = (section: string) =>
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));

  const activeCascades = Object.values(cascades).filter(
    (c): c is CascadeInstance => c !== null && c.status === "active",
  );

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8">
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
            Guides &amp; Playbooks
          </h1>
          <p className="font-sans text-sm text-white/80 mt-1">
            Planning, crisis response, and care transitions
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 py-6">
        {/* Active Transitions Banner */}
        {activeCascades.length > 0 && (
          <div className="bg-amber/10 border border-amber rounded-[14px] px-4 py-3.5 mb-6">
            <div className="font-sans text-sm font-semibold text-slate">
              You have {activeCascades.length} active response{" "}
              {activeCascades.length === 1 ? "plan" : "plans"}
            </div>
            <div className="font-sans text-xs text-slateMid mt-0.5">
              Scroll down to Care Transitions to continue
            </div>
          </div>
        )}

        {/* ── PLANNING ────────────────────────────────────────── */}
        <button
          onClick={() => toggle("planning")}
          className="flex items-center justify-between w-full mb-3"
        >
          <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-sage">
            Planning
          </div>
          <span className="text-slateMid text-sm transition-transform" style={{ transform: expanded.planning ? "rotate(90deg)" : "rotate(0deg)" }}>
            &rsaquo;
          </span>
        </button>
        {expanded.planning && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {GUIDES.map((guide) => (
              <Link key={guide.id} href={guide.href} className="block">
                <div className="bg-white border border-sandDark rounded-[14px] px-4 py-4 cursor-pointer hover:scale-[1.01] transition-transform h-full relative">
                  {completions[guide.id] && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-sage/20 rounded-full flex items-center justify-center">
                      <span className="text-sage text-xs font-bold">{"\u2713"}</span>
                    </div>
                  )}
                  <div className={`w-10 h-10 ${guide.bgClass} rounded-xl flex items-center justify-center text-lg mb-3`}>
                    {guide.icon}
                  </div>
                  <div className="font-sans text-[12px] font-semibold text-slate mb-0.5">
                    {guide.title}
                  </div>
                  <div className="font-sans text-[10px] text-slateMid leading-tight">
                    {guide.subtitle}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {!expanded.planning && <div className="mb-6" />}

        {/* ── CRISIS RESPONSE ─────────────────────────────────── */}
        <button
          onClick={() => toggle("crisis")}
          className="flex items-center justify-between w-full mb-3"
        >
          <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-coral">
            Crisis Response
          </div>
          <span className="text-slateMid text-sm transition-transform" style={{ transform: expanded.crisis ? "rotate(90deg)" : "rotate(0deg)" }}>
            &rsaquo;
          </span>
        </button>
        {expanded.crisis && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {CRISIS_PLAYBOOKS.map((pb) => (
              <Link key={pb.id} href={`/guides/crisis/${pb.id}`} className="block">
                <div className="bg-white border border-sandDark rounded-[14px] px-4 py-4 cursor-pointer hover:scale-[1.01] transition-transform h-full">
                  <div className="w-10 h-10 bg-coral/15 rounded-xl flex items-center justify-center text-lg mb-3">
                    {pb.icon}
                  </div>
                  <div className="font-sans text-[12px] font-semibold text-slate mb-0.5">
                    {pb.label}
                  </div>
                  <div className="font-sans text-[10px] text-slateMid leading-tight">
                    {pb.description.length > 50 ? pb.description.slice(0, 50) + "…" : pb.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {!expanded.crisis && <div className="mb-6" />}

        {/* ── CARE TRANSITIONS ────────────────────────────────── */}
        <button
          onClick={() => toggle("transitions")}
          className="flex items-center justify-between w-full mb-3"
        >
          <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-amber">
            Care Transitions
          </div>
          <span className="text-slateMid text-sm transition-transform" style={{ transform: expanded.transitions ? "rotate(90deg)" : "rotate(0deg)" }}>
            &rsaquo;
          </span>
        </button>
        {expanded.transitions && (
          <div className="flex flex-col gap-3 mb-8">
            {CARE_TRANSITION_PLAYBOOKS.map((pb) => {
              const cascade = cascades[pb.id];
              const isActive = cascade?.status === "active";
              const isResolved = cascade?.status === "resolved";
              const completedSteps = cascade
                ? Object.values(cascade.stepProgress).filter((s) => s === "completed").length
                : 0;
              const totalSteps = pb.steps.length;

              return (
                <Link key={pb.id} href={`/playbooks/${pb.id}`} className="block">
                  <div
                    className={`bg-white rounded-[14px] px-4 py-4 cursor-pointer hover:scale-[1.005] transition-transform ${
                      isActive
                        ? "border-2 border-amber"
                        : "border border-sandDark"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber/15 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {pb.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-sans text-[12px] font-semibold text-slate">
                            {pb.label}
                          </div>
                          {isActive && (
                            <span className="font-sans text-[10px] font-semibold text-amber bg-amber/15 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                          {isResolved && (
                            <div className="w-5 h-5 bg-sage/20 rounded-full flex items-center justify-center">
                              <span className="text-sage text-[10px] font-bold">{"\u2713"}</span>
                            </div>
                          )}
                        </div>
                        <div className="font-sans text-[10px] text-slateMid mt-0.5">
                          {isActive
                            ? `${completedSteps}/${totalSteps} steps completed`
                            : isResolved
                              ? "Completed"
                              : "Reference guide"}
                        </div>
                      </div>
                      <div className="text-slateLight text-sm">&rsaquo;</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {!expanded.transitions && <div className="mb-6" />}

        {/* ── COMING SOON ─────────────────────────────────────── */}
        <button
          onClick={() => toggle("comingSoon")}
          className="flex items-center justify-between w-full mb-3"
        >
          <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight">
            Coming Soon
          </div>
          <span className="text-slateMid text-sm transition-transform" style={{ transform: expanded.comingSoon ? "rotate(90deg)" : "rotate(0deg)" }}>
            &rsaquo;
          </span>
        </button>
        {expanded.comingSoon && (
          <div className="grid grid-cols-2 gap-3">
            {COMING_SOON.map((item) => (
              <div
                key={item.title}
                className="bg-sand/30 border border-sandDark/50 rounded-[14px] px-4 py-4 opacity-60"
              >
                <div className="w-10 h-10 bg-sand/50 rounded-xl flex items-center justify-center text-lg mb-3">
                  {item.icon}
                </div>
                <div className="font-sans text-[12px] font-semibold text-slateMid mb-0.5">
                  {item.title}
                </div>
                <div className="font-sans text-[10px] text-slateLight leading-tight">
                  {item.subtitle}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

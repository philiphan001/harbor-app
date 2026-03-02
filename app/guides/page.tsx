"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
    icon: "\ud83d\udccb",
    color: "sage",
    bgClass: "bg-sage/15",
    href: "/advance-directives",
    completionKey: "harbor_advance_directive_complete",
  },
  {
    id: "power-of-attorney",
    title: "Power of Attorney",
    subtitle: "Legal & financial authority",
    icon: "\u2696\ufe0f",
    color: "ocean",
    bgClass: "bg-ocean/15",
    href: "/power-of-attorney",
    completionKey: "harbor_poa_complete",
  },
  {
    id: "hipaa-authorization",
    title: "HIPAA Authorization",
    subtitle: "Medical information access",
    icon: "\ud83d\udd12",
    color: "amber",
    bgClass: "bg-amber/15",
    href: "/hipaa-authorization",
    completionKey: "harbor_hipaa_complete",
  },
  {
    id: "home-safety",
    title: "Home Safety",
    subtitle: "Room-by-room safety assessment",
    icon: "\ud83c\udfe0",
    color: "amber",
    bgClass: "bg-amber/15",
    href: "/home-safety",
    completionKey: "harbor_home_safety_complete",
  },
  {
    id: "housing-plan",
    title: "Housing & Living",
    subtitle: "Costs, arrangement & transition plan",
    icon: "\ud83c\udfe1",
    color: "amber",
    bgClass: "bg-amber/15",
    href: "/housing-plan",
    completionKey: "harbor_housing_plan_complete",
  },
  {
    id: "transportation-plan",
    title: "Transportation Plan",
    subtitle: "Getting to appointments & errands",
    icon: "\ud83d\ude97",
    color: "ocean",
    bgClass: "bg-ocean/15",
    href: "/transportation-plan",
    completionKey: "harbor_transportation_plan_complete",
  },
  {
    id: "social-care",
    title: "Social & Pet Care",
    subtitle: "Connections, check-ins & pet plans",
    icon: "\ud83e\udd1d",
    color: "sage",
    bgClass: "bg-sage/15",
    href: "/social-care",
    completionKey: "harbor_social_care_complete",
  },
];

const COMING_SOON = [
  { title: "Medicare Enrollment", icon: "\ud83c\udfe5", subtitle: "Navigate enrollment periods" },
  { title: "Medicaid Planning", icon: "\ud83d\udcca", subtitle: "Eligibility & applications" },
  { title: "Veterans Benefits", icon: "\ud83c\uddfa\ud83c\uddf8", subtitle: "VA aid & attendance" },
  { title: "Beneficiary Audit", icon: "\ud83d\udccb", subtitle: "Review & update designations" },
];

export default function GuidesPage() {
  const [completions, setCompletions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const completed: Record<string, boolean> = {};
    for (const guide of GUIDES) {
      const val = localStorage.getItem(guide.completionKey);
      completed[guide.id] = val === "true" || (val !== null && val !== "false" && val.startsWith("{"));
    }
    setCompletions(completed);
  }, []);

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
            Guides & Worksheets
          </h1>
          <p className="font-sans text-sm text-white/80 mt-1">
            Step-by-step guides for caregiving essentials
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 py-6">
        {/* Guide Cards */}
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

        {/* Coming Soon */}
        <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
          Coming Soon
        </div>
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
      </div>
    </div>
  );
}

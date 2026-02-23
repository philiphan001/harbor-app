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

      {/* Value Propositions */}
      <div className="px-5 pt-6 pb-8">
        <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-4">
          What you get with Harbor
        </div>

        <div className="space-y-4">
          <ValueProp
            icon="📋"
            title="Readiness Assessment"
            description="Find out where you stand in 5 minutes. We score your preparedness across medical, legal, financial, and housing — and show you exactly what's missing."
          />
          <ValueProp
            icon="📊"
            title="Personalized Care Roadmap"
            description="Get a step-by-step action plan tailored to your parent's situation. Every task is prioritized so you know what to tackle first."
          />
          <ValueProp
            icon="🔔"
            title="Proactive Monitoring"
            description="Harbor tracks deadlines, insurance changes, and emerging care needs so nothing falls through the cracks — even when life gets busy."
          />
          <ValueProp
            icon="🚨"
            title="Crisis Support When It Hits"
            description="If an emergency happens, our AI helps you triage the situation, organize what you know, and build an action plan in minutes."
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
    </div>
  );
}

function ValueProp({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-sans text-sm font-semibold text-slate mb-0.5">
          {title}
        </div>
        <div className="font-sans text-xs text-slateMid leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
}

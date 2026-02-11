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

      {/* Primary CTAs */}
      <div className="px-5 pt-8">
        <Link href="/crisis">
          <div className="w-full bg-coral text-white rounded-[14px] px-6 py-5 cursor-pointer hover:scale-[1.01] transition-transform relative overflow-hidden">
            <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-black/[0.08]" />
            <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase opacity-85 mb-1.5">
              Need help now?
            </div>
            <div className="font-serif text-[19px] font-medium leading-snug">
              My parent just had a health crisis
            </div>
            <div className="font-sans text-[13px] opacity-80 mt-1.5">
              Start AI-guided intake now — available 24/7 →
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary CTA */}
      <div className="px-5 pt-3">
        <Link href="/readiness">
          <div className="w-full bg-ocean text-white rounded-[14px] px-6 py-5 cursor-pointer hover:scale-[1.01] transition-transform">
            <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase opacity-85 mb-1.5">
              Get prepared
            </div>
            <div className="font-serif text-[19px] font-medium leading-snug">
              Check your Care Readiness Score
            </div>
            <div className="font-sans text-[13px] opacity-80 mt-1.5">
              10-minute assessment — know where you stand →
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
            icon="🎯"
            title="24/7 AI Crisis Intake"
            description="Get organized in minutes, not days. Our AI guides you through the chaos to create an actionable plan."
          />
          <ValueProp
            icon="📊"
            title="Personalized Care Roadmap"
            description="See exactly what needs to happen across medical, financial, legal, and housing domains."
          />
          <ValueProp
            icon="🔔"
            title="Proactive Monitoring"
            description="We track deadlines, insurance changes, and care needs so nothing falls through the cracks."
          />
          <ValueProp
            icon="👥"
            title="Family Coordination"
            description="Keep everyone on the same page with shared updates and clear role assignments."
          />
        </div>
      </div>

      {/* Trust Bar */}
      <div className="px-5 py-7 mt-auto border-t border-sandDark">
        <div className="bg-sand rounded-xl p-5 flex gap-4">
          <div className="w-9 h-9 rounded-full bg-ocean text-white flex items-center justify-center font-serif text-base font-semibold shrink-0">
            H
          </div>
          <div>
            <div className="font-serif text-sm font-medium text-slate mb-1">
              Built for real families in crisis
            </div>
            <div className="font-sans text-[12.5px] text-slateMid leading-relaxed">
              Harbor models your complete situation across all domains and provides guidance tailored to your parent's unique circumstances.
            </div>
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

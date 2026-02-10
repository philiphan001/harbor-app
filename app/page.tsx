"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Task } from "@/lib/ai/claude";
import { getTasks } from "@/lib/utils/taskStorage";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Load tasks from localStorage
    const storedTasks = getTasks();
    console.log("📋 Home page loaded. Tasks from storage:", storedTasks);
    setTasks(storedTasks);
  }, []);

  const urgentTasks = tasks.filter((t) => t.priority === "high");
  const otherTasks = tasks.filter((t) => t.priority !== "high");

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-12 pb-10 overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03]" />

        <div className="relative">
          <h1 className="font-serif text-[32px] font-semibold text-white tracking-tight mb-1">
            Harbor
          </h1>
          <div className="font-sans text-[13px] text-white/60 tracking-[2px] uppercase mb-5">
            Elder Care Navigator
          </div>
          <p className="font-serif text-lg text-white/90 leading-relaxed font-light italic">
            A steady hand when your family needs it most.
          </p>
        </div>
      </div>

      {/* Action Items Card - Shows if there are tasks */}
      {tasks.length > 0 && (
        <div className="px-5 pt-6">
          <Link href="/tasks">
            <div className="w-full bg-white border-2 border-ocean rounded-[14px] px-5 py-5 cursor-pointer hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-ocean rounded-xl flex items-center justify-center text-white font-sans text-xl font-bold">
                    {tasks.length}
                  </div>
                  <div>
                    <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-0.5">
                      Your Action Items
                    </div>
                    <div className="font-sans text-xs text-slateMid">
                      {urgentTasks.length > 0 && `${urgentTasks.length} urgent`}
                      {urgentTasks.length > 0 && otherTasks.length > 0 && " · "}
                      {otherTasks.length > 0 && `${otherTasks.length} to address`}
                    </div>
                  </div>
                </div>
                <div className="text-ocean text-lg">→</div>
              </div>

              {/* Show top 2 urgent tasks */}
              {urgentTasks.slice(0, 2).map((task, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 py-2 border-t border-sand"
                >
                  <div className="w-1.5 h-1.5 bg-coral rounded-full mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-sans text-sm font-medium text-slate">
                      {task.title}
                    </div>
                  </div>
                </div>
              ))}

              {tasks.length > 2 && (
                <div className="font-sans text-xs text-slateMid mt-2 pt-2 border-t border-sand">
                  +{tasks.length - 2} more {tasks.length - 2 === 1 ? "item" : "items"}
                </div>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* Crisis CTA */}
      <div className={`px-5 ${tasks.length > 0 ? "pt-3" : "pt-6"}`}>
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

      {/* Preparedness CTA */}
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

      {/* Care Roadmap CTA */}
      <div className="px-5 pt-3">
        <Link href="/roadmap">
          <div className="w-full bg-amber text-white rounded-[14px] px-6 py-5 cursor-pointer hover:scale-[1.01] transition-transform">
            <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase opacity-85 mb-1.5">
              Not sure where to start?
            </div>
            <div className="font-serif text-[19px] font-medium leading-snug">
              See the complete Care Roadmap
            </div>
            <div className="font-sans text-[13px] opacity-80 mt-1.5">
              138 decision points across 6 domains — and why you need help →
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="px-5 pt-5">
        <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
          Or explore how Harbor works
        </div>

        <div className="flex flex-col gap-2.5">
          <ActionCard
            icon="◉"
            title="See a Sample Situation Brief"
            subtitle="What you'll receive in the first 24 hours"
            href="/demo/brief"
          />
          <ActionCard
            icon="◈"
            title="Explore Care Scenarios"
            subtitle="AI-modeled paths for your parent's care"
            href="/demo/scenarios"
          />
          <ActionCard
            icon="◎"
            title="Your Family Circle"
            subtitle="Coordinate roles and keep everyone aligned"
            href="/demo/family"
          />
        </div>
      </div>

      {/* Trust Bar */}
      <div className="px-5 py-7 mt-auto">
        <div className="bg-sand rounded-xl p-5 flex gap-4">
          <div className="w-9 h-9 rounded-full bg-ocean text-white flex items-center justify-center font-serif text-base font-semibold shrink-0">
            H
          </div>
          <div>
            <div className="font-serif text-sm font-medium text-slate mb-1">
              AI-powered care coordination
            </div>
            <div className="font-sans text-[12.5px] text-slateMid leading-relaxed">
              Every family gets an AI care coordinator that models your complete situation across medical, financial, legal, and housing domains.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: string;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="w-full bg-sand/50 rounded-xl px-4 py-4 cursor-pointer hover:translate-x-1 transition-transform flex items-center gap-3.5">
        <div className="w-9 h-9 bg-white/70 rounded-[10px] flex items-center justify-center text-ocean text-xl shrink-0">
          {icon}
        </div>
        <div>
          <div className="font-sans text-sm font-semibold text-slate">
            {title}
          </div>
          <div className="font-sans text-xs text-slateMid">{subtitle}</div>
        </div>
      </div>
    </Link>
  );
}

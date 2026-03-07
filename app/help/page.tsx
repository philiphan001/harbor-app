"use client";

import Link from "next/link";
import ConversationHistory from "@/components/dashboard/ConversationHistory";

const HELP_TOPICS = [
  {
    icon: "🏠",
    title: "Getting Started",
    description: "How to set up your parent's profile and complete the readiness assessment",
  },
  {
    icon: "📋",
    title: "Action Items",
    description: "Understanding your tasks, priorities, and how to mark them complete",
  },
  {
    icon: "📊",
    title: "Readiness Score",
    description: "What your score means and how to improve it over time",
  },
  {
    icon: "📄",
    title: "Documents & Export",
    description: "Uploading documents and sharing care information with family or providers",
  },
  {
    icon: "🚨",
    title: "Crisis Events",
    description: "How to report and manage emergency situations",
  },
  {
    icon: "🤖",
    title: "Agent Monitoring",
    description: "How Harbor's AI agents work behind the scenes to help you stay prepared",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />

        <div className="relative">
          <Link href="/dashboard" className="font-sans text-xs text-white/60 hover:text-white/80 transition-colors">
            &larr; Dashboard
          </Link>
          <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight mt-3 mb-1">
            Ask Harbor
          </h1>
          <div className="font-sans text-sm text-white/70 leading-relaxed">
            Your conversations, help topics, and support
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 py-6">
        {/* Recent Conversations */}
        <ConversationHistory />

        {/* Help Topics */}
        <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
          Help Topics
        </div>
        <div className="space-y-2.5 mb-6">
          {HELP_TOPICS.map((topic) => (
            <div
              key={topic.title}
              className="bg-white border border-sandDark rounded-xl px-4 py-3.5 flex items-start gap-3"
            >
              <div className="text-xl mt-0.5">{topic.icon}</div>
              <div>
                <div className="font-sans text-sm font-semibold text-slate mb-0.5">
                  {topic.title}
                </div>
                <div className="font-sans text-xs text-slateMid leading-relaxed">
                  {topic.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Harbor */}
        <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
          Contact Us
        </div>
        <div className="bg-white border border-sandDark rounded-xl px-5 py-4">
          <div className="font-sans text-sm font-medium text-slate mb-2">
            Need to talk to a person?
          </div>
          <div className="font-sans text-xs text-slateMid leading-relaxed mb-4">
            Our team is here to help with anything the app can&apos;t answer — account issues, feedback, or just a question about eldercare.
          </div>
          <a
            href="mailto:support@harborcare.app"
            className="block w-full bg-ocean text-white rounded-xl px-5 py-3 font-sans text-sm font-semibold text-center hover:bg-oceanMid transition-colors"
          >
            Email Harbor Support
          </a>
        </div>
      </div>
    </div>
  );
}

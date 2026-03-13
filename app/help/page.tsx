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
        {/* Chat with Harbor — placeholder */}
        <div className="mb-6">
          <div className="bg-white border-2 border-ocean/30 rounded-[14px] px-5 py-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-ocean/10 rounded-xl flex items-center justify-center text-lg">
                💬
              </div>
              <div>
                <div className="font-sans text-sm font-semibold text-slate">Chat with Harbor</div>
                <div className="font-sans text-xs text-slateMid">Ask anything about caregiving</div>
              </div>
            </div>
            <div className="bg-sand/40 rounded-xl px-4 py-3 flex items-center gap-2 cursor-not-allowed">
              <span className="font-sans text-sm text-slateMid flex-1">Type a question&hellip;</span>
              <div className="w-8 h-8 bg-ocean/20 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ocean/40">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
            </div>
            <div className="font-sans text-[10px] text-slateMid mt-2 text-center">
              Coming soon — AI chat for personalized caregiving guidance
            </div>
          </div>
        </div>

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

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ConversationSummary {
  id: string;
  conversationType: string;
  createdAt: string;
  messages: Array<{
    content: string;
    role: string;
  }>;
}

const TYPE_LABELS: Record<string, string> = {
  crisis: "Crisis Intake",
  readiness: "Readiness Assessment",
  intake: "Intake",
  general: "General",
  scenario_exploration: "Scenario Exploration",
  family: "Family Discussion",
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ConversationHistory() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setConversations(data.conversations ?? []);
      } catch {
        // Silently fail — conversations are supplementary
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return null;
  if (conversations.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
        Recent Conversations
      </div>
      <div className="space-y-2">
        {conversations.slice(0, 5).map((conv) => {
          const lastMessage = conv.messages[0];
          const preview = lastMessage
            ? lastMessage.content.slice(0, 80) + (lastMessage.content.length > 80 ? "..." : "")
            : "No messages yet";
          const typeLabel = TYPE_LABELS[conv.conversationType] ?? conv.conversationType;
          const resumeUrl =
            conv.conversationType === "readiness"
              ? `/readiness?conversationId=${conv.id}`
              : `/crisis?conversationId=${conv.id}`;

          return (
            <Link key={conv.id} href={resumeUrl}>
              <div className="w-full bg-white border border-sandDark rounded-xl px-4 py-3 cursor-pointer hover:border-ocean/40 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-sans text-xs font-semibold text-ocean">
                    {typeLabel}
                  </span>
                  <span className="font-sans text-[10px] text-slateLight">
                    {formatRelativeDate(conv.createdAt)}
                  </span>
                </div>
                <div className="font-sans text-sm text-slateMid line-clamp-1">
                  {preview}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

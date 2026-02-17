"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import { useRouter } from "next/navigation";

function CrisisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlConversationId = searchParams.get("conversationId") ?? undefined;
  const forceNew = searchParams.get("new") === "1";
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [resumeConversationId, setResumeConversationId] = useState<string | undefined>(urlConversationId);
  const [isLoading, setIsLoading] = useState(!urlConversationId && !forceNew);

  // Auto-resume most recent crisis conversation if no conversationId in URL
  useEffect(() => {
    if (urlConversationId || forceNew) return;

    async function findRecentConversation() {
      try {
        const response = await fetch("/api/conversations");
        if (!response.ok) return;
        const data = await response.json();
        const conversations = data.conversations || [];

        // Find the most recent crisis conversation that has messages
        const recent = conversations.find(
          (c: { conversationType: string; messages: unknown[] }) =>
            c.conversationType === "crisis" && c.messages && c.messages.length > 0
        );

        if (recent) {
          setResumeConversationId(recent.id);
        }
      } catch {
        // Failed to fetch — start fresh
      } finally {
        setIsLoading(false);
      }
    }

    findRecentConversation();
  }, [urlConversationId, forceNew]);

  const initialMessage = `First — take a breath. You're doing the right thing by reaching out.

I'm Harbor, your AI care coordinator. I'm here to help you navigate this situation with clarity and organization — not panic.

Let's start with the most important question: What happened with your parent?`;

  const handleComplete = (extractedData: Record<string, unknown>) => {
    setIntakeComplete(true);
    console.log("Intake complete. Extracted data:", extractedData);
    // Redirect to dashboard with success message
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmWhite">
        <div className="animate-spin w-6 h-6 border-2 border-ocean border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ChatInterface
      mode="crisis"
      initialMessage={initialMessage}
      onComplete={handleComplete}
      conversationId={resumeConversationId}
    />
  );
}

export default function CrisisPage() {
  return (
    <Suspense>
      <CrisisContent />
    </Suspense>
  );
}

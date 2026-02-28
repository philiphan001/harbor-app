"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ChatInterface from "@/components/ChatInterface";
import ParentInfoForm from "@/components/ParentInfoForm";
import { useRouter } from "next/navigation";
import { gatherExportData, type ExportData } from "@/lib/utils/exportCareSummary";
import { getParentProfile } from "@/lib/utils/parentProfile";

function buildDataSummary(data: ExportData | null): string {
  const lines: string[] = ["HARBOR DATA STATUS:"];

  if (!data) {
    lines.push("- Parent profile: Not set up yet");
    lines.push("- Medications: None recorded");
    lines.push("- Insurance: None recorded");
    lines.push("- Primary doctor: None recorded");
    lines.push("- Legal documents: None recorded");
    lines.push("- Emergency contacts: None recorded");
    return lines.join("\n");
  }

  // Parent profile
  const profileParts: string[] = [data.parentName];
  if (data.parentAge) profileParts.push(`age ${data.parentAge}`);
  if (data.parentState) profileParts.push(data.parentState);
  lines.push(`- Parent profile: ${profileParts.join(", ")}`);

  // Medications
  if (data.medications.length > 0) {
    const medNames = data.medications.map(m => m.name).join(", ");
    lines.push(`- Medications: ${data.medications.length} recorded (${medNames})`);
  } else {
    lines.push("- Medications: None recorded");
  }

  // Insurance
  if (data.insurance) {
    lines.push(`- Insurance: Recorded (${data.insurance.provider})`);
  } else {
    lines.push("- Insurance: None recorded");
  }

  // Primary doctor
  if (data.primaryDoctor) {
    lines.push(`- Primary doctor: Recorded (${data.primaryDoctor.name})`);
  } else {
    lines.push("- Primary doctor: None recorded");
  }

  // Legal documents
  if (data.legalDocuments.length > 0) {
    lines.push(`- Legal documents: ${data.legalDocuments.length} recorded`);
  } else {
    lines.push("- Legal documents: None recorded");
  }

  // Emergency contacts
  if (data.emergencyContacts.length > 0) {
    lines.push(`- Emergency contacts: ${data.emergencyContacts.length} recorded`);
  } else {
    lines.push("- Emergency contacts: None recorded");
  }

  return lines.join("\n");
}

function CrisisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlConversationId = searchParams.get("conversationId") ?? undefined;
  const forceNew = searchParams.get("new") === "1";
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [resumeConversationId, setResumeConversationId] = useState<string | undefined>(urlConversationId);
  const [isLoading, setIsLoading] = useState(!urlConversationId && !forceNew);
  const [dataSummary, setDataSummary] = useState<string>("");
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  // Check profile on mount
  useEffect(() => {
    const profile = getParentProfile();
    setHasProfile(!!profile?.name);
  }, []);

  // Build data summary on mount
  useEffect(() => {
    const exportData = gatherExportData();
    setDataSummary(buildDataSummary(exportData));
  }, []);

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

  if (hasProfile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmWhite">
        <div className="animate-spin w-6 h-6 border-2 border-ocean border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <ParentInfoForm
        onComplete={() => setHasProfile(true)}
        title="First, tell us who we're helping"
        subtitle="This helps us coordinate the right care."
        submitLabel="Continue"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmWhite">
        <div className="animate-spin w-6 h-6 border-2 border-ocean border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-warmWhite border-b border-sandDark px-4 py-2 text-center">
        <Link href="/crisis/triage" className="font-sans text-xs text-ocean hover:underline">
          Need the ER triage sheet? &rarr;
        </Link>
      </div>
      <div className="flex-1 min-h-0">
        <ChatInterface
          mode="crisis"
          initialMessage={initialMessage}
          onComplete={handleComplete}
          conversationId={resumeConversationId}
          dataSummary={dataSummary}
        />
      </div>
    </div>
  );
}

export default function CrisisPage() {
  return (
    <Suspense>
      <CrisisContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ReadinessAssessment from "@/components/ReadinessAssessment";
import ParentInfoForm from "@/components/ParentInfoForm";
import { getParentProfile } from "@/lib/utils/parentProfile";
import type { Domain } from "@/lib/constants/domains";

const VALID_DOMAINS: Domain[] = ["medical", "legal", "financial", "housing", "transportation", "social"];

function ReadinessContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId") ?? undefined;
  const startDomainParam = searchParams.get("startDomain") ?? undefined;
  const startDomain = VALID_DOMAINS.includes(startDomainParam as Domain) ? (startDomainParam as Domain) : undefined;
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    const profile = getParentProfile();
    setHasProfile(!!profile?.name);
  }, []);

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
        title="Before we start, tell us about your parent"
        subtitle="This helps us personalize the assessment and your action plan."
        submitLabel="Start Assessment"
      />
    );
  }

  return <ReadinessAssessment conversationId={conversationId} startDomain={startDomain} />;
}

export default function ReadinessPage() {
  return (
    <Suspense>
      <ReadinessContent />
    </Suspense>
  );
}

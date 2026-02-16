"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReadinessAssessment from "@/components/ReadinessAssessment";

function ReadinessContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId") ?? undefined;

  return <ReadinessAssessment conversationId={conversationId} />;
}

export default function ReadinessPage() {
  return (
    <Suspense>
      <ReadinessContent />
    </Suspense>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import ReadinessAssessment from "@/components/ReadinessAssessment";

export default function ReadinessPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId") ?? undefined;

  return <ReadinessAssessment conversationId={conversationId} />;
}

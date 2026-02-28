"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ReadinessAssessment from "@/components/ReadinessAssessment";
import { getParentProfile } from "@/lib/utils/parentProfile";

function ReadinessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get("conversationId") ?? undefined;

  useEffect(() => {
    const profile = getParentProfile();
    if (!profile?.name) {
      router.replace("/get-started");
    }
  }, [router]);

  return <ReadinessAssessment conversationId={conversationId} />;
}

export default function ReadinessPage() {
  return (
    <Suspense>
      <ReadinessContent />
    </Suspense>
  );
}

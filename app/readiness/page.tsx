"use client";

import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import { useRouter } from "next/navigation";

export default function ReadinessPage() {
  const router = useRouter();
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  const initialMessage = `Welcome! I'm Harbor, and I'm going to help you understand how prepared you are for your parent's care needs.

This takes about 10-15 minutes, and we'll cover five areas: medical, financial, legal, housing, and family readiness. At the end, you'll get a Care Readiness Score (0-100) showing exactly where you stand.

Most families discover gaps they didn't know about — that's exactly why this assessment exists. Ready?

Let's start with the basics. What's your parent's name, and how old are they?`;

  const handleComplete = (extractedData: any) => {
    setAssessmentComplete(true);
    console.log("Assessment complete. Data:", extractedData);
    // TODO: Calculate readiness score and redirect to results
    // router.push('/readiness/results');
  };

  return (
    <ChatInterface
      mode="readiness"
      initialMessage={initialMessage}
      onComplete={handleComplete}
    />
  );
}

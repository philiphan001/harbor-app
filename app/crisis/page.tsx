"use client";

import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import { useRouter } from "next/navigation";

export default function CrisisPage() {
  const router = useRouter();
  const [intakeComplete, setIntakeComplete] = useState(false);

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

  return (
    <ChatInterface
      mode="crisis"
      initialMessage={initialMessage}
      onComplete={handleComplete}
    />
  );
}

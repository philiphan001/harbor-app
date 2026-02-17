"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DomainProgress from "./DomainProgress";
import QuestionnaireForm from "./QuestionnaireForm";
import ChatInterface from "./ChatInterface";
import { Answer, DOMAIN_QUESTIONS } from "@/lib/types/readiness";
import { addTasks } from "@/lib/utils/taskStorage";
import { getParentProfile, saveParentProfile } from "@/lib/utils/parentProfile";
import { DOMAINS as DOMAIN_LIST, type Domain } from "@/lib/constants/domains";

type AssessmentMode = "intro" | "parent-info" | "chat" | "questionnaire";

interface ReadinessAssessmentProps {
  conversationId?: string;
}

export default function ReadinessAssessment({ conversationId }: ReadinessAssessmentProps = {}) {
  const router = useRouter();
  const [mode, setMode] = useState<AssessmentMode>(conversationId ? "chat" : "intro");
  const [currentDomain, setCurrentDomain] = useState<Domain>("medical");
  const [completedDomains, setCompletedDomains] = useState<Domain[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [generatingTasksFor, setGeneratingTasksFor] = useState<Domain[]>([]); // Track background task generation

  const domains = DOMAIN_LIST;

  // Determine which domains are fully answered and find the first incomplete one
  const syncDomainProgress = useCallback((currentAnswers: Answer[]) => {
    const completed: Domain[] = [];
    let firstIncomplete: Domain | null = null;

    for (const domain of domains) {
      const domainQuestions = DOMAIN_QUESTIONS.find((d) => d.domain === domain);
      if (!domainQuestions) continue;

      const allAnswered = domainQuestions.questions.every((q) => {
        const answer = currentAnswers.find((a) => a.questionId === q.id);
        return answer && (answer.selectedOption !== null || answer.isUncertain);
      });

      if (allAnswered) {
        completed.push(domain);
      } else if (!firstIncomplete) {
        firstIncomplete = domain;
      }
    }

    return { completed, firstIncomplete };
  }, []);

  const handleStartChat = () => {
    setMode("chat");
  };

  const handleStartQuestionnaire = () => {
    // Skip parent info if profile already exists
    const existing = getParentProfile();
    if (existing && existing.name && existing.age) {
      setMode("questionnaire");
    } else {
      setMode("parent-info");
    }
  };

  const handleSwitchToChat = () => {
    setMode("chat");
  };

  const handleSwitchToQuestionnaire = () => {
    // Auto-advance past completed domains
    const { completed, firstIncomplete } = syncDomainProgress(answers);
    if (completed.length > 0) {
      setCompletedDomains((prev) => {
        const merged = new Set([...prev, ...completed]);
        return [...merged];
      });
    }

    // If there's a fully incomplete domain, jump to it.
    // Otherwise jump to the first partially-incomplete domain.
    if (firstIncomplete) {
      // Find the first domain with ZERO answers (skip domains that have partial progress)
      const firstUntouched = domains.find((d) => {
        const prefix = { medical: "med-", legal: "legal-", financial: "fin-", housing: "house-" }[d];
        return !answers.some((a) => a.questionId.startsWith(prefix));
      });
      setCurrentDomain(firstUntouched || firstIncomplete);
    }
    setMode("questionnaire");
  };

  const handleAnswer = (questionId: string, selectedOption: string | null, isUncertain: boolean, capturedData?: Record<string, string>) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      const answer = { questionId, selectedOption, isUncertain, capturedData };
      if (existing) {
        return prev.map((a) =>
          a.questionId === questionId ? answer : a
        );
      }
      return [...prev, answer];
    });
  };

  const handleAnswersExtracted = (extractedAnswers: Answer[]) => {
    // Merge extracted answers from conversation with existing answers
    setAnswers(extractedAnswers);
  };

  const handleNextDomain = async () => {
    // Mark current domain as complete
    if (!completedDomains.includes(currentDomain)) {
      setCompletedDomains((prev) => [...prev, currentDomain]);

      // Generate tasks for completed domain in background
      generateTasksForDomain(currentDomain);
    }

    // Move to next domain
    const currentIndex = domains.indexOf(currentDomain);
    if (currentIndex < domains.length - 1) {
      setCurrentDomain(domains[currentIndex + 1]);
    } else {
      // All domains complete - go to results
      router.push("/readiness/results");
    }
  };

  const generateTasksForDomain = async (domain: Domain) => {
    // Don't generate if already generating for this domain
    if (generatingTasksFor.includes(domain)) return;

    setGeneratingTasksFor((prev) => [...prev, domain]);
    console.log(`🚀 Starting background task generation for ${domain} domain`);

    try {
      const parentProfile = getParentProfile();

      // Get answers for this domain based on question ID prefix
      const domainPrefixMap: Record<Domain, string> = {
        medical: "med-",
        legal: "legal-",
        financial: "fin-",
        housing: "house-",
      };

      const domainAnswers = answers.filter((a) =>
        a.questionId.startsWith(domainPrefixMap[domain])
      );

      const domainAnswerCount = domainAnswers.length;
      const capturedCount = domainAnswers.filter(a => a.capturedData && Object.keys(a.capturedData).length > 0).length;
      console.log(`📤 Sending ${domainAnswerCount} answers (${capturedCount} with captured data) for ${domain} to API`);

      const response = await fetch("/api/generate-readiness-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          answers: domainAnswers,
          parentProfile: parentProfile
            ? { name: parentProfile.name, age: parentProfile.age, state: parentProfile.state }
            : undefined,
        }),
      });

      if (!response.ok) {
        console.error(`❌ API returned ${response.status} for ${domain} task generation`);
        const errorText = await response.text();
        console.error(`❌ Response body:`, errorText);
        return;
      }

      const data = await response.json();

      if (data.tasks && data.tasks.length > 0) {
        console.log(`✅ Generated ${data.tasks.length} tasks for ${domain}, adding to storage`);
        addTasks(data.tasks);
      } else {
        console.log(`ℹ️ No tasks generated for ${domain} domain. Response:`, data);
      }
    } catch (error) {
      console.error(`❌ Error generating tasks for ${domain}:`, error);
    } finally {
      setGeneratingTasksFor((prev) => prev.filter((d) => d !== domain));
    }
  };

  const handleBackDomain = () => {
    const currentIndex = domains.indexOf(currentDomain);
    if (currentIndex > 0) {
      setCurrentDomain(domains[currentIndex - 1]);
    }
  };

  const handleDomainSelect = (domain: Domain) => {
    setCurrentDomain(domain);
  };

  const handleChatComplete = () => {
    // When chat completes, redirect to results
    router.push("/readiness/results");
  };

  // Intro screen
  if (mode === "intro") {
    return (
      <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8">
          <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
          <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />

          <div className="relative">
            <div className="font-sans text-[11px] text-white/60 tracking-[2px] uppercase mb-2">
              Care Readiness
            </div>
            <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight mb-3">
              How Prepared Are You?
            </h1>
            <p className="font-sans text-sm text-white/90 leading-relaxed">
              Most families discover gaps they didn't know about. Let's assess your readiness across 4 key areas and create a personalized action plan.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 py-6">
          {/* Assessment Overview */}
          <div className="bg-white border border-sandDark rounded-xl p-5 mb-6">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-4">
              What We'll Cover
            </div>
            <div className="space-y-3">
              {[
                { icon: "🏥", title: "Medical Readiness", desc: "Healthcare providers, medications, insurance" },
                { icon: "⚖️", title: "Legal Readiness", desc: "Powers of attorney, wills, estate planning" },
                { icon: "💰", title: "Financial Readiness", desc: "Income, expenses, long-term care funding" },
                { icon: "🏠", title: "Housing Readiness", desc: "Living situation and future planning" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="text-2xl">{item.icon}</div>
                  <div className="flex-1">
                    <div className="font-sans text-sm font-semibold text-slate">{item.title}</div>
                    <div className="font-sans text-xs text-slateMid">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time estimate */}
          <div className="bg-sand rounded-xl px-5 py-4 mb-6">
            <div className="font-sans text-xs text-slate">
              <span className="font-semibold">Takes 10-15 minutes</span> · You can pause and return anytime
            </div>
          </div>

          {/* Mode selection */}
          <div className="space-y-3">
            <button
              onClick={handleStartChat}
              className="w-full bg-ocean text-white rounded-xl px-6 py-4 hover:bg-oceanMid transition-colors"
            >
              <div className="font-sans text-base font-semibold mb-1">Start Conversational Assessment</div>
              <div className="font-sans text-xs text-white/80">I'll guide you through with questions</div>
            </button>

            <button
              onClick={handleStartQuestionnaire}
              className="w-full bg-white border-2 border-ocean text-ocean rounded-xl px-6 py-4 hover:bg-ocean/5 transition-colors"
            >
              <div className="font-sans text-base font-semibold mb-1">Use Structured Questionnaire</div>
              <div className="font-sans text-xs text-ocean/80">Faster, form-based approach</div>
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="font-sans text-sm text-slateMid hover:text-slate"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Parent info collection (before questionnaire)
  if (mode === "parent-info") {
    return <ParentInfoForm onComplete={() => setMode("questionnaire")} onBack={() => setMode("intro")} />;
  }

  // Chat mode
  if (mode === "chat") {
    return (
      <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
        <DomainProgress currentDomain={currentDomain} completedDomains={completedDomains} />

        {/* Mode switch button */}
        <div className="bg-sand border-b border-sandDark px-5 py-2 flex justify-end">
          <button
            onClick={handleSwitchToQuestionnaire}
            className="font-sans text-xs text-ocean hover:underline font-medium"
          >
            Switch to questionnaire →
          </button>
        </div>

        <ChatInterface
          mode="readiness"
          initialMessage="I'll help you assess your readiness across 4 key areas:

1. **Medical Readiness** - Healthcare providers, medications, insurance, advance directives
2. **Legal Readiness** - Powers of attorney, wills, estate planning
3. **Financial Readiness** - Income, expenses, insurance, long-term care funding
4. **Housing Readiness** - Current living situation and future planning

This usually takes 10-15 minutes. We'll go through each domain together, and I'll identify any gaps we should address.

First, let's start with your parent's basic information. What's their name and age?"
          onComplete={handleChatComplete}
          currentAnswers={answers}
          onAnswersExtracted={handleAnswersExtracted}
          conversationId={conversationId}
        />
      </div>
    );
  }

  // Questionnaire mode
  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      <DomainProgress currentDomain={currentDomain} completedDomains={completedDomains} />

      {/* Background task generation indicator */}
      {generatingTasksFor.length > 0 && (
        <div className="bg-ocean/5 border-b border-ocean/20 px-5 py-2">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div
                className="w-1.5 h-1.5 bg-ocean rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-ocean rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-ocean rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <div className="font-sans text-xs text-ocean">
              Generating action items in background...
            </div>
          </div>
        </div>
      )}

      <QuestionnaireForm
        currentDomain={currentDomain}
        answers={answers}
        completedDomains={completedDomains}
        onAnswer={handleAnswer}
        onNext={handleNextDomain}
        onBack={handleBackDomain}
        onSwitchToChat={handleSwitchToChat}
        onDomainSelect={handleDomainSelect}
        isFirstDomain={currentDomain === "medical"}
        isLastDomain={currentDomain === "housing"}
      />
    </div>
  );
}

// --- Parent Info Form (pre-questionnaire) ---

function ParentInfoForm({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [state, setState] = useState("");

  const canContinue = name.trim().length > 0 && age.trim().length > 0;

  const handleSubmit = () => {
    if (!canContinue) return;

    saveParentProfile({
      name: name.trim(),
      age: parseInt(age, 10) || undefined,
      state: state.trim() || undefined,
    });

    console.log("👤 Parent profile created from questionnaire:", name.trim(), age);
    onComplete();
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8 overflow-hidden">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />

        <div className="relative">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-sans mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight mb-3 leading-tight">
            First, tell us about your parent
          </h1>
          <p className="font-sans text-[14px] text-white/80 leading-relaxed">
            This helps us personalize the assessment and your action plan.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 py-8">
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block font-sans text-sm font-semibold text-slate mb-2">
              Parent&apos;s first name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mary"
              className="w-full px-4 py-3 rounded-xl border-2 border-sandDark bg-white font-sans text-sm text-slate placeholder:text-slateLight focus:outline-none focus:border-ocean transition-colors"
              autoFocus
            />
          </div>

          {/* Age */}
          <div>
            <label className="block font-sans text-sm font-semibold text-slate mb-2">
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 82"
              min="50"
              max="120"
              className="w-full px-4 py-3 rounded-xl border-2 border-sandDark bg-white font-sans text-sm text-slate placeholder:text-slateLight focus:outline-none focus:border-ocean transition-colors"
            />
          </div>

          {/* State (optional) */}
          <div>
            <label className="block font-sans text-sm font-semibold text-slate mb-1">
              State
            </label>
            <div className="font-sans text-xs text-slateMid mb-2">
              Optional — helps with state-specific programs
            </div>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. California"
              className="w-full px-4 py-3 rounded-xl border-2 border-sandDark bg-white font-sans text-sm text-slate placeholder:text-slateLight focus:outline-none focus:border-ocean transition-colors"
            />
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={handleSubmit}
          disabled={!canContinue}
          className={`w-full mt-8 rounded-xl px-6 py-4 font-sans text-base font-semibold transition-colors ${
            canContinue
              ? "bg-ocean text-white hover:bg-oceanMid"
              : "bg-sandDark text-slateLight cursor-not-allowed"
          }`}
        >
          Start Assessment
        </button>

        <div className="mt-4 text-center">
          <div className="font-sans text-xs text-slateMid">
            We never share your information. It stays in your account.
          </div>
        </div>
      </div>
    </div>
  );
}

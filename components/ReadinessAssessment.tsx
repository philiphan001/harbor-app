"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DomainProgress from "./DomainProgress";
import QuestionnaireForm from "./QuestionnaireForm";
import ChatInterface from "./ChatInterface";
import { Answer, DOMAIN_QUESTIONS } from "@/lib/types/readiness";
import { addTasks, getTasks } from "@/lib/utils/taskStorage";
import { saveTaskData } from "@/lib/utils/taskData";
import { getParentProfile, saveParentProfile } from "@/lib/utils/parentProfile";
import { DOMAINS as DOMAIN_LIST, type Domain } from "@/lib/constants/domains";
import ParentInfoForm from "./ParentInfoForm";

type AssessmentMode = "intro" | "parent-info" | "domain-select" | "chat" | "questionnaire";

const CHAT_DOMAINS: Domain[] = ["medical", "legal", "financial"];
const QUESTIONNAIRE_DOMAINS: Domain[] = ["housing", "transportation", "social"];

interface ReadinessAssessmentProps {
  conversationId?: string;
}

export default function ReadinessAssessment({ conversationId }: ReadinessAssessmentProps = {}) {
  const router = useRouter();
  const [mode, setMode] = useState<AssessmentMode>(() => {
    if (conversationId) return "chat";
    // If returning with persisted answers, auto-resume
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("harbor_readiness_answers");
        if (stored) {
          const savedAnswers: Answer[] = JSON.parse(stored);
          if (savedAnswers.length > 0) {
            // Check if all chat domains are complete
            const chatComplete = CHAT_DOMAINS.every(domain => {
              const domainQuestions = DOMAIN_QUESTIONS.find(d => d.domain === domain);
              if (!domainQuestions) return false;
              return domainQuestions.questions.every(q => {
                const answer = savedAnswers.find(a => a.questionId === q.id);
                return answer && (answer.selectedOption !== null || answer.isUncertain);
              });
            });
            if (chatComplete) return "questionnaire";
            // Has some progress — resume chat
            return "chat";
          }
        }
      } catch { /* ignore */ }
    }
    return "intro";
  });
  const [currentDomain, setCurrentDomain] = useState<Domain>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("harbor_readiness_answers");
        if (stored) {
          const savedAnswers: Answer[] = JSON.parse(stored);
          // Find first incomplete domain
          for (const domain of DOMAIN_LIST) {
            const domainQuestions = DOMAIN_QUESTIONS.find(d => d.domain === domain);
            if (!domainQuestions) continue;
            const allAnswered = domainQuestions.questions.every(q => {
              const answer = savedAnswers.find(a => a.questionId === q.id);
              return answer && (answer.selectedOption !== null || answer.isUncertain);
            });
            if (!allAnswered) return domain;
          }
        }
      } catch { /* ignore */ }
    }
    return "medical";
  });
  const [completedDomains, setCompletedDomains] = useState<Domain[]>([]);
  const [answers, setAnswers] = useState<Answer[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("harbor_readiness_answers");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [generatingTasksFor, setGeneratingTasksFor] = useState<Domain[]>([]); // Track background task generation
  const [selectedDomains, setSelectedDomains] = useState<Domain[]>(() => {
    // Load persisted selection, default to all domains
    const profile = getParentProfile();
    return profile?.selectedDomains || DOMAIN_LIST;
  });

  const domains = selectedDomains;

  // Persist answers to localStorage whenever they change
  useEffect(() => {
    if (answers.length > 0) {
      localStorage.setItem("harbor_readiness_answers", JSON.stringify(answers));
    }
  }, [answers]);

  // On mount, sync completed domains from persisted answers
  useEffect(() => {
    if (answers.length === 0) return;
    const { completed } = syncDomainProgress(answers);
    if (completed.length > 0) {
      setCompletedDomains(prev => {
        const merged = new Set([...prev, ...completed]);
        return [...merged];
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Auto-switch from chat to questionnaire when chat domains are complete
  useEffect(() => {
    if (mode !== "chat") return;
    if (answers.length === 0) return;

    const chatDomainsComplete = CHAT_DOMAINS.every(domain => {
      const domainQuestions = DOMAIN_QUESTIONS.find(d => d.domain === domain);
      if (!domainQuestions) return false;
      return domainQuestions.questions.every(q => {
        const answer = answers.find(a => a.questionId === q.id);
        return answer && (answer.selectedOption !== null || answer.isUncertain);
      });
    });

    if (chatDomainsComplete) {
      // Mark chat domains as completed
      setCompletedDomains(prev => {
        const merged = new Set([...prev, ...CHAT_DOMAINS]);
        return [...merged];
      });
      // Generate tasks for completed chat domains
      for (const domain of CHAT_DOMAINS) {
        if (!completedDomains.includes(domain)) {
          generateTasksForDomain(domain);
        }
      }
      // Switch to questionnaire starting at first selected non-chat domain
      const firstQuestionnaireDomain = selectedDomains.find(d => !CHAT_DOMAINS.includes(d));
      if (firstQuestionnaireDomain) {
        setCurrentDomain(firstQuestionnaireDomain);
        setMode("questionnaire");
      } else {
        // All selected domains were chat domains — go to results
        router.push("/readiness/results");
      }
      window.scrollTo(0, 0);
    }
  }, [answers, mode]);

  const handleStartChat = () => {
    setMode("chat");
  };

  const handleStartQuestionnaire = () => {
    // Profile is guaranteed to exist (gate at /get-started)
    setMode("domain-select");
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
        const prefix = { medical: "med-", legal: "legal-", financial: "fin-", housing: "house-", transportation: "trans-", social: "social-" }[d];
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

    // Persist captured data to taskData so it appears on profile / domain status
    if (capturedData && Object.keys(capturedData).length > 0) {
      persistCapturedData(questionId, capturedData);
    }
  };

  const handleAnswersExtracted = (extractedAnswers: Answer[]) => {
    // Merge extracted answers from conversation with existing answers
    setAnswers(extractedAnswers);
  };

  const handleNextDomain = async () => {
    // Mark current domain as complete
    const isLastDomain = domains.indexOf(currentDomain) >= domains.length - 1;

    if (!completedDomains.includes(currentDomain)) {
      setCompletedDomains((prev) => [...prev, currentDomain]);

      if (isLastDomain) {
        // On last domain, wait for task generation before navigating to results
        await generateTasksForDomain(currentDomain);
      } else {
        // Generate tasks in background while user works on next domain
        generateTasksForDomain(currentDomain);
      }
    }

    // Move to next domain
    if (!isLastDomain) {
      setCurrentDomain(domains[domains.indexOf(currentDomain) + 1]);
      window.scrollTo(0, 0);
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
        transportation: "trans-",
        social: "social-",
      };

      const domainAnswers = answers.filter((a) =>
        a.questionId.startsWith(domainPrefixMap[domain])
      );

      const domainAnswerCount = domainAnswers.length;
      const capturedCount = domainAnswers.filter(a => a.capturedData && Object.keys(a.capturedData).length > 0).length;
      console.log(`📤 Sending ${domainAnswerCount} answers (${capturedCount} with captured data) for ${domain} to API`);

      const existingTaskTitles = getTasks().map(t => t.title);

      const response = await fetch("/api/generate-readiness-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          answers: domainAnswers,
          parentProfile: parentProfile
            ? { name: parentProfile.name, age: parentProfile.age, state: parentProfile.state }
            : undefined,
          existingTasks: existingTaskTitles,
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
      window.scrollTo(0, 0);
    }
  };

  const handleDomainSelect = (domain: Domain) => {
    setCurrentDomain(domain);
    window.scrollTo(0, 0);
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
              Most families discover gaps they didn't know about. Let's assess your readiness across 6 key areas and create a personalized action plan.
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
                { icon: "🚗", title: "Transportation Readiness", desc: "Getting to appointments, errands, and daily life" },
                { icon: "👥", title: "Social & Pets", desc: "Friends, neighbors, social connections, and pet care planning" },
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

  // Parent info collection (fallback if profile somehow missing)
  if (mode === "parent-info") {
    return <ParentInfoForm onComplete={() => setMode("domain-select")} onBack={() => setMode("intro")} />;
  }

  // Domain selection screen
  if (mode === "domain-select") {
    const CORE_DOMAINS: Domain[] = ["medical", "legal", "financial"];
    const OPTIONAL_DOMAINS: { id: Domain; icon: string; label: string; desc: string }[] = [
      { id: "housing", icon: "🏠", label: "Housing", desc: "Living situation and future planning" },
      { id: "transportation", icon: "🚗", label: "Transportation", desc: "Getting to appointments, errands, and daily life" },
      { id: "social", icon: "👥", label: "Social & Pets", desc: "Friends, neighbors, social connections, and pet care planning" },
    ];

    const handleToggleDomain = (domain: Domain) => {
      setSelectedDomains(prev =>
        prev.includes(domain)
          ? prev.filter(d => d !== domain)
          : [...prev, domain].sort((a, b) => DOMAIN_LIST.indexOf(a) - DOMAIN_LIST.indexOf(b))
      );
    };

    const handleDomainSelectContinue = () => {
      // Persist selection
      const profile = getParentProfile();
      if (profile) {
        saveParentProfile({ ...profile, selectedDomains });
      }
      // Start at first selected domain
      setCurrentDomain(selectedDomains[0]);
      setMode("questionnaire");
    };

    return (
      <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8 overflow-hidden">
          <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
          <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />

          <div className="relative">
            <button
              onClick={() => setMode("intro")}
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-sans mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight mb-3 leading-tight">
              Choose Your Domains
            </h1>
            <p className="font-sans text-[14px] text-white/80 leading-relaxed">
              Some areas may not apply to your situation. Uncheck any that aren&apos;t relevant.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 py-6">
          {/* Always-included domains */}
          <div className="mb-5">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
              Always Included
            </div>
            <div className="space-y-2">
              {[
                { icon: "🏥", label: "Medical", desc: "Healthcare providers, medications, insurance" },
                { icon: "⚖️", label: "Legal", desc: "Powers of attorney, wills, estate planning" },
                { icon: "💰", label: "Financial", desc: "Income, expenses, long-term care funding" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white border border-sandDark rounded-xl px-4 py-3 opacity-80">
                  <div className="text-lg">{item.icon}</div>
                  <div className="flex-1">
                    <div className="font-sans text-sm font-semibold text-slate">{item.label}</div>
                    <div className="font-sans text-xs text-slateMid">{item.desc}</div>
                  </div>
                  <div className="font-sans text-[10px] text-slateMid uppercase tracking-wider">Required</div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional domains */}
          <div className="mb-5">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
              Optional — Uncheck if Not Applicable
            </div>
            <div className="space-y-2">
              {OPTIONAL_DOMAINS.map((item) => {
                const isSelected = selectedDomains.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleDomain(item.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "bg-white border-2 border-ocean"
                        : "bg-sand border-2 border-sandDark"
                    }`}
                  >
                    <div className="text-lg">{item.icon}</div>
                    <div className="flex-1">
                      <div className={`font-sans text-sm font-semibold ${isSelected ? "text-slate" : "text-slateMid"}`}>
                        {item.label}
                      </div>
                      <div className="font-sans text-xs text-slateMid">{item.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "bg-ocean border-ocean" : "bg-white border-sandDark"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-sand rounded-xl px-4 py-3 mb-6">
            <div className="font-sans text-xs text-slateMid">
              You can always add these domains later from your dashboard.
            </div>
          </div>

          {/* Continue button */}
          <button
            onClick={handleDomainSelectContinue}
            className="w-full bg-ocean text-white rounded-xl px-6 py-4 font-sans text-base font-semibold hover:bg-oceanMid transition-colors"
          >
            Continue with {selectedDomains.length} Domain{selectedDomains.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    );
  }

  // Chat mode
  if (mode === "chat") {
    const profile = getParentProfile();
    const parentName = profile?.name || "your parent";
    const profileParts: string[] = [];
    if (profile?.name) profileParts.push(profile.name);
    if (profile?.age) profileParts.push(`age ${profile.age}`);
    if (profile?.state) profileParts.push(profile.state);
    const dataSummary = profileParts.length > 0
      ? `PARENT PROFILE: ${profileParts.join(", ")}`
      : undefined;

    return (
      <div className="h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
        <DomainProgress currentDomain={currentDomain} completedDomains={completedDomains} activeDomains={selectedDomains} />

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
          initialMessage={`I'll help you assess your readiness across 6 key areas for ${parentName}'s care. The goal: if a crisis happens tomorrow, you'll be ready to handle it.

1. **Medical** — Could you reach their doctor, list their meds, and navigate insurance at 2am?
2. **Legal** — Do you have the authority and documents to make decisions?
3. **Financial** — Could you pay their bills and fund their care?
4. **Housing** — Is their living situation safe and sustainable?
5. **Transportation** — Can they get to appointments, groceries, and pharmacy?
6. **Social** — Do you know their friends, neighbors, and who checks on them?

We'll cover the first three in conversation, then switch to a quick form for the rest. For everything you already have in place, I'll capture the details in Harbor. For gaps, I'll build your action plan.

Let's start with Medical readiness. Does ${parentName} have a primary care doctor — and if so, could you reach them at 2am in an emergency?`}
          onComplete={handleChatComplete}
          currentAnswers={answers}
          onAnswersExtracted={handleAnswersExtracted}
          conversationId={conversationId}
          dataSummary={dataSummary}
        />
      </div>
    );
  }

  // Questionnaire mode
  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      <DomainProgress currentDomain={currentDomain} completedDomains={completedDomains} activeDomains={selectedDomains} />

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
        onDomainSelect={handleDomainSelect}
        isFirstDomain={currentDomain === domains[0]}
        isLastDomain={currentDomain === domains[domains.length - 1]}
        activeDomains={selectedDomains}
      />
    </div>
  );
}

// --- Persist questionnaire follow-up data to taskData ---

function persistCapturedData(questionId: string, data: Record<string, string>) {
  const profile = getParentProfile();
  const parentName = profile?.name || "Parent";

  switch (questionId) {
    case "med-1":
      saveTaskData(`Doctor: ${data.pcpName || "Primary Care"}`, "save_doctor_info", {
        name: data.pcpName || "",
        phone: data.pcpPhone || "",
        address: data.pcpPractice || "",
      });
      break;

    case "med-2":
      if (data.medications) {
        const meds = data.medications.split("\n").filter(Boolean).map((line) => {
          const parts = line.trim().split(/\s+/);
          const name = parts[0] || line.trim();
          const dosage = parts.slice(1).join(" ");
          return { name, dosage, frequency: "", purpose: "" };
        });
        saveTaskData("Medications", "save_medication_list", { medications: meds });
      }
      break;

    case "med-3":
      if (data.conditions) {
        saveTaskData(`${parentName}'s Health Conditions`, "save_task_notes", { notes: data.conditions });
      }
      break;

    case "med-4":
      if (data.portalName) {
        saveTaskData("Patient Portal Access", "save_task_notes", { notes: data.portalName });
      }
      break;

    case "med-5":
      saveTaskData(`Insurance: ${data.insuranceCarrier || "Health Insurance"}`, "save_insurance_info", {
        provider: data.insuranceCarrier || "",
        policyNumber: data.insuranceId || "",
        phone: data.insurancePhone || "",
      });
      break;

    case "med-6":
      saveTaskData("Healthcare Proxy", "save_legal_document_info", {
        documentType: "Healthcare Proxy",
        status: "Active",
        agent: data.proxyName || "",
        location: data.proxyLocation || "",
      });
      break;

    case "legal-1":
      saveTaskData("Will", "save_legal_document_info", {
        documentType: "Will",
        status: "Active",
        agent: data.willAttorney || "",
        location: data.willLocation || "",
      });
      break;

    case "legal-2":
      saveTaskData("Power of Attorney", "save_legal_document_info", {
        documentType: "Durable Power of Attorney",
        status: "Active",
        agent: data.poaAgent || "",
        location: data.poaLocation || "",
      });
      break;

    case "legal-3":
      saveTaskData("Advance Directives", "save_legal_document_info", {
        documentType: "Advance Directives",
        status: "Active",
        location: data.directivesLocation || "",
      });
      if (data.directivesNotes) {
        saveTaskData("Advance Directive Preferences", "save_task_notes", { notes: data.directivesNotes });
      }
      break;

    case "legal-4":
      if (data.docsLocation) {
        saveTaskData("Important Documents Location", "save_task_notes", { notes: data.docsLocation });
      }
      break;

    case "fin-1":
      if (data.incomeSource || data.bankInfo) {
        const notes = [data.incomeSource && `Income: ${data.incomeSource}`, data.bankInfo && `Accounts: ${data.bankInfo}`].filter(Boolean).join("\n");
        saveTaskData(`${parentName}'s Financial Overview`, "save_task_notes", { notes });
      }
      break;

    case "fin-3":
      saveTaskData(`Insurance: ${data.ltcCarrier || "Long-Term Care"}`, "save_insurance_info", {
        provider: data.ltcCarrier || "",
        policyNumber: data.ltcPolicy || "",
        phone: data.ltcPhone || "",
      });
      break;

    case "fin-5":
      if (data.estateAttorney) {
        saveTaskData("Estate Plan", "save_task_notes", { notes: `Attorney: ${data.estateAttorney}` });
      }
      break;

    case "house-1":
      if (data.address) {
        saveTaskData(`${parentName}'s Address`, "save_task_notes", { notes: data.address });
      }
      break;

    case "trans-5":
      if (data.transportService || data.transportPhone) {
        const notes = [data.transportService, data.transportPhone && `Phone: ${data.transportPhone}`].filter(Boolean).join("\n");
        saveTaskData("Transportation Services", "save_task_notes", { notes });
      }
      break;

    case "social-2":
      if (data.friendName || data.friendPhone) {
        const notes = [data.friendName, data.friendPhone && `Phone: ${data.friendPhone}`].filter(Boolean).join("\n");
        saveTaskData("Emergency Contact (Friend/Neighbor)", "save_task_notes", { notes });
      }
      break;

    case "social-5":
      if (data.checkerName || data.checkerFrequency) {
        const notes = [data.checkerName, data.checkerFrequency && `Frequency: ${data.checkerFrequency}`].filter(Boolean).join("\n");
        saveTaskData("Regular Check-in Contact", "save_task_notes", { notes });
      }
      break;

    case "social-6":
      if (data.petType || data.petName) {
        const notes = [data.petType && `Pets: ${data.petType}`, data.petName && `Names: ${data.petName}`].filter(Boolean).join("\n");
        saveTaskData("Pet Information", "save_task_notes", { notes });
      }
      break;

    case "social-7":
      if (data.petCaretaker || data.petCaretakerPhone) {
        const notes = [data.petCaretaker, data.petCaretakerPhone && `Phone: ${data.petCaretakerPhone}`].filter(Boolean).join("\n");
        saveTaskData("Pet Backup Caretaker", "save_task_notes", { notes });
      }
      break;
  }
}


"use client";

import { useState } from "react";
import { DOMAIN_QUESTIONS, Answer, Question } from "@/lib/types/readiness";
import { DOMAINS, DOMAIN_LABELS, type Domain } from "@/lib/constants/domains";

interface QuestionnaireFormProps {
  currentDomain: Domain;
  answers: Answer[];
  completedDomains: Domain[];
  onAnswer: (questionId: string, selectedOption: string | null, isUncertain: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  onSwitchToChat: () => void;
  onDomainSelect: (domain: Domain) => void;
  isFirstDomain: boolean;
  isLastDomain: boolean;
}

export default function QuestionnaireForm({
  currentDomain,
  answers,
  completedDomains,
  onAnswer,
  onNext,
  onBack,
  onSwitchToChat,
  onDomainSelect,
  isFirstDomain,
  isLastDomain,
}: QuestionnaireFormProps) {
  const domainData = DOMAIN_QUESTIONS.find((d) => d.domain === currentDomain);

  if (!domainData) return null;

  const getAnswer = (questionId: string): Answer | undefined => {
    return answers.find((a) => a.questionId === questionId);
  };

  const allQuestionsAnswered = domainData.questions.every((q) => {
    const answer = getAnswer(q.id);
    return answer && (answer.selectedOption !== null || answer.isUncertain);
  });

  // Check if a domain has any answers
  const getDomainProgress = (domain: Domain): number => {
    const domainQuestions = DOMAIN_QUESTIONS.find((d) => d.domain === domain);
    if (!domainQuestions) return 0;

    const answeredCount = domainQuestions.questions.filter((q) => {
      const answer = getAnswer(q.id);
      return answer && (answer.selectedOption !== null || answer.isUncertain);
    }).length;

    return answeredCount;
  };

  const domains: { id: Domain; label: string; icon: string }[] = [
    { id: "medical", label: "Medical", icon: "🏥" },
    { id: "legal", label: "Legal", icon: "⚖️" },
    { id: "financial", label: "Financial", icon: "💰" },
    { id: "housing", label: "Housing", icon: "🏠" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6">
      {/* Domain Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {domains.map((domain) => {
          const isCurrent = domain.id === currentDomain;
          const isCompleted = completedDomains.includes(domain.id);
          const progress = getDomainProgress(domain.id);
          const domainQuestions = DOMAIN_QUESTIONS.find((d) => d.domain === domain.id);
          const totalQuestions = domainQuestions?.questions.length || 0;

          return (
            <button
              key={domain.id}
              onClick={() => onDomainSelect(domain.id)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg border-2 transition-all ${
                isCurrent
                  ? "border-ocean bg-ocean/5"
                  : isCompleted
                  ? "border-sage bg-sage/5"
                  : progress > 0
                  ? "border-amber bg-amber/5"
                  : "border-sandDark bg-white hover:border-ocean/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="text-base">{domain.icon}</div>
                <div className="text-left">
                  <div className={`font-sans text-xs font-semibold ${
                    isCurrent ? "text-ocean" : isCompleted ? "text-sage" : progress > 0 ? "text-amber" : "text-slate"
                  }`}>
                    {domain.label}
                  </div>
                  {progress > 0 && (
                    <div className="font-sans text-[10px] text-slateMid">
                      {progress}/{totalQuestions}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-semibold text-slate mb-2">
          {domainData.title}
        </h2>
        <p className="font-sans text-sm text-slateMid leading-relaxed">
          {domainData.description}
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-6 mb-8">
        {domainData.questions.map((question, index) => {
          const answer = getAnswer(question.id);
          return (
            <QuestionCard
              key={question.id}
              question={question}
              questionNumber={index + 1}
              answer={answer}
              onAnswer={(selectedOption, isUncertain) =>
                onAnswer(question.id, selectedOption, isUncertain)
              }
            />
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-3 pb-6">
        {allQuestionsAnswered ? (
          <button
            onClick={onNext}
            className="w-full bg-ocean text-white rounded-xl px-6 py-4 font-sans text-base font-semibold hover:bg-oceanMid transition-colors"
          >
            {isLastDomain ? "Complete Assessment" : "Next: " + getNextDomainName(currentDomain)}
          </button>
        ) : (
          <div className="bg-sand rounded-xl px-5 py-3 border border-sandDark">
            <div className="font-sans text-xs text-slateMid text-center">
              Answer all questions in this domain to continue, or jump to another domain above
            </div>
          </div>
        )}

        {!isFirstDomain && (
          <button
            onClick={onBack}
            className="w-full bg-white border border-sandDark text-slate rounded-xl px-6 py-3 font-sans text-sm font-medium hover:bg-sand transition-colors"
          >
            ← Back to {getPreviousDomainName(currentDomain)}
          </button>
        )}

        <button
          onClick={onSwitchToChat}
          className="w-full text-ocean font-sans text-sm font-medium py-2 hover:underline"
        >
          Switch to conversational mode
        </button>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  questionNumber,
  answer,
  onAnswer,
}: {
  question: Question;
  questionNumber: number;
  answer?: Answer;
  onAnswer: (selectedOption: string | null, isUncertain: boolean) => void;
}) {
  return (
    <div className="bg-white border border-sandDark rounded-xl p-5">
      <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-2">
        Question {questionNumber}
      </div>
      <div className="font-serif text-base font-medium text-slate mb-4 leading-relaxed">
        {question.text}
      </div>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = answer?.selectedOption === option && !answer.isUncertain;
          return (
            <button
              key={option}
              onClick={() => onAnswer(option, false)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all font-sans text-sm ${
                isSelected
                  ? "border-ocean bg-ocean/5 text-slate font-medium"
                  : "border-sandDark bg-white text-slate hover:border-ocean/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-ocean" : "border-sandDark"
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-ocean" />}
                </div>
                {option}
              </div>
            </button>
          );
        })}
      </div>

      {/* Uncertainty options */}
      {question.allowUncertainty && (
        <div className="mt-3 pt-3 border-t border-sand">
          <div className="flex gap-2">
            <button
              onClick={() => onAnswer(null, true)}
              className={`flex-1 px-3 py-2 rounded-lg border transition-all font-sans text-xs font-medium ${
                answer?.isUncertain
                  ? "border-amber bg-amber/10 text-slate"
                  : "border-sandDark bg-sand/50 text-slateMid hover:border-amber/40"
              }`}
            >
              I don't know
            </button>
            <button
              onClick={() => onAnswer(null, true)}
              className={`flex-1 px-3 py-2 rounded-lg border transition-all font-sans text-xs font-medium ${
                answer?.isUncertain
                  ? "border-amber bg-amber/10 text-slate"
                  : "border-sandDark bg-sand/50 text-slateMid hover:border-amber/40"
              }`}
            >
              I'm not certain
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getNextDomainName(currentDomain: Domain): string {
  const currentIndex = DOMAINS.indexOf(currentDomain);
  const nextDomain = DOMAINS[currentIndex + 1];
  return nextDomain ? DOMAIN_LABELS[nextDomain] : "";
}

function getPreviousDomainName(currentDomain: Domain): string {
  const currentIndex = DOMAINS.indexOf(currentDomain);
  const prevDomain = DOMAINS[currentIndex - 1];
  return prevDomain ? DOMAIN_LABELS[prevDomain] : "";
}

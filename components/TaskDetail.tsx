"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Task } from "@/lib/ai/claude";
import { saveTaskData } from "@/lib/utils/taskData";
import { DOMAIN_COLORS, PRIORITY_LABELS } from "@/lib/constants/domains";
import { getActiveParentId } from "@/lib/utils/parentProfile";
import TaskChat from "@/components/task/TaskChat";
import TaskForm from "@/components/task/TaskForm";
import ExtractionReview from "@/components/ExtractionReview";
import { saveExtractionAsTaskData } from "@/lib/utils/extractionToTaskData";
import type { ExtractionResult, ExtractedData } from "@/lib/ingestion/types";
import type { HealthcareProxyOption } from "@/lib/types/taskCapture";
import { toggleChecklistItem } from "@/lib/utils/taskStorage";
import { getDefaultChecklist } from "@/lib/data/defaultChecklists";

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onMarkComplete: () => void;
  userContext?: {
    parentState?: string;
    parentName?: string;
  };
}

export default function TaskDetail({ task, onClose, onMarkComplete, userContext }: TaskDetailProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [loadingHelp, setLoadingHelp] = useState(false);
  const [enhancedHelp, setEnhancedHelp] = useState<{
    type: string;
    icon: string;
    content: Array<{ heading: string; items: string[] }>;
    detailedOptions?: HealthcareProxyOption[];
  } | null>(null);
  const [showDataCapture, setShowDataCapture] = useState(false);
  const [captureMode, setCaptureMode] = useState<"chat" | "form" | "upload" | null>(null);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "reviewing" | "done" | "error">("idle");
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadExtraction, setUploadExtraction] = useState<{ uploadId: string; fileName: string; extraction: ExtractionResult } | null>(null);

  const domainColors = DOMAIN_COLORS;
  const priorityLabels = PRIORITY_LABELS;

  // Help content generators based on task type
  const getHelpContent = () => {
    // Check task title for keywords to provide contextual help
    const title = task.title.toLowerCase();

    if (title.includes("doctor") || title.includes("physician") || title.includes("pcp")) {
      return {
        type: "Document Hunter",
        icon: "🔍",
        content: [
          {
            heading: "Where to find this information:",
            items: [
              "Insurance card - Most list the PCP on the front or back",
              "Medicare card or insurance portal - Check beneficiary information",
              "Prescription bottles - Doctor's name is usually on the label",
              "Recent medical bills or EOBs (Explanation of Benefits)",
              "Patient portal - If your parent has online access to their records",
            ],
          },
          {
            heading: "If you still can't find it:",
            items: [
              "Call the insurance company's customer service number (on card)",
              "Ask your parent directly if they remember",
              "Check recent appointment reminder texts/emails/calls",
              "Contact the hospital discharge planner if coming from a hospital stay",
            ],
          },
        ],
      };
    } else if (title.includes("hipaa") || title.includes("medical record access")) {
      return {
        type: "Action Guide",
        icon: "📋",
        content: [
          {
            heading: "How to get this done (easier than you think):",
            items: [
              "Use Harbor's HIPAA authorization guide — a universal federal form and walkthrough are ready at /hipaa-authorization",
              "HIPAA is a federal form — it's the same in every state",
              "No notary or witnesses needed, just your parent's signature",
              "Fill out the form with your parent — it takes 5-10 minutes",
              "Make copies for every healthcare provider (doctor, hospital, pharmacy, specialists)",
            ],
          },
          {
            heading: "What to discuss with your parent:",
            items: [
              "Who they want to be able to access their medical records",
              "Which providers they currently see (each needs a copy)",
              "Whether they want to limit what information can be shared",
            ],
          },
        ],
      };
    } else if (title.includes("advance directive") || title.includes("living will") || title.includes("healthcare directive") || title.includes("proxy") || (title.includes("healthcare") && (title.includes("poa") || title.includes("power of attorney")))) {
      return {
        type: "Action Guide",
        icon: "📋",
        content: [
          {
            heading: "How to get this done (easier than you think):",
            items: [
              "Use Harbor's advance directive guide — your state's form and a step-by-step walkthrough are ready at /advance-directives",
              "Most states have simple 1-2 page forms, no lawyer needed",
              "Pick a time to talk with your parent about their wishes",
              "Fill out the form together - it takes 10-15 minutes",
              "Get it witnessed (2 adults, can't be you) or notarized",
              "Make 3 copies: give one to their doctor, one to hospital, keep one at home",
            ],
          },
          {
            heading: "What to discuss with your parent:",
            items: [
              "Who they want making decisions if they can't",
              "General wishes about life-sustaining treatment",
              "Where they want to be cared for if seriously ill",
              "Who should be informed of their medical status",
            ],
          },
        ],
      };
    } else if (title.includes("power of attorney") || title.includes("poa")) {
      return {
        type: "Action Guide",
        icon: "📋",
        content: [
          {
            heading: "How to get this done:",
            items: [
              "Use Harbor's POA guide — your state's form and step-by-step walkthrough are ready at /power-of-attorney",
              "You'll need a notary (required in most states for financial POA)",
              "Decide who will be the agent (the person managing finances)",
              "Choose which powers to grant (banking, real estate, taxes, etc.)",
              "Have the form signed, witnessed if needed, and notarized",
              "Give copies to the agent, banks, and financial advisor",
            ],
          },
          {
            heading: "What to discuss with your parent:",
            items: [
              "Who they trust to manage their finances",
              "Which bank accounts and investments they have",
              "Whether the POA should be effective immediately or only upon incapacity",
              "Any limitations they want to place on the agent's authority",
            ],
          },
        ],
      };
    } else if (title.includes("home safety") || title.includes("fall prevention") || title.includes("grab bar") || title.includes("aging in place")) {
      return {
        type: "Action Guide",
        icon: "🏠",
        content: [
          {
            heading: "Quick wins you can do today:",
            items: [
              "Install grab bars in the bathroom — most falls happen there",
              "Add non-slip mats in the tub/shower and on bathroom floors",
              "Remove throw rugs or secure them with non-slip backing",
              "Ensure good lighting in hallways, stairs, and bathrooms (nightlights help)",
              "Clear walkways of cords, clutter, and low furniture",
            ],
          },
          {
            heading: "Bigger improvements to plan:",
            items: [
              "Consider a walk-in shower or tub if mobility is declining",
              "Install handrails on both sides of stairs",
              "Look into a medical alert system (especially if they live alone)",
              "Use Harbor's Home Safety Assessment for a room-by-room walkthrough",
            ],
          },
        ],
      };
    } else if (title.includes("transportation") || title.includes("medical transport") || title.includes("ride service")) {
      return {
        type: "Action Guide",
        icon: "🚗",
        content: [
          {
            heading: "How to set up reliable transport:",
            items: [
              "Identify a primary way to get to medical appointments",
              "Set up at least one backup option (ride service, family, volunteer driver)",
              "Check if they qualify for Medicaid NEMT (free medical rides)",
              "Try GoGoGrandparent — order rides by phone, no smartphone needed",
              "Use Harbor's Transportation Plan guide to organize everything",
            ],
          },
          {
            heading: "Reduce the need for trips:",
            items: [
              "Set up pharmacy delivery (CVS, Walgreens, Amazon Pharmacy)",
              "Arrange grocery delivery (Instacart, Walmart+)",
              "Ask about telehealth options for routine check-ups",
            ],
          },
        ],
      };
    } else if (title.includes("social") || title.includes("isolation") || title.includes("loneliness") || title.includes("check-in") || title.includes("pet care")) {
      return {
        type: "Action Guide",
        icon: "🤝",
        content: [
          {
            heading: "Build a support network:",
            items: [
              "Identify 2-3 people who can check in regularly (neighbors, friends, family)",
              "Set up a check-in schedule — even a weekly phone call helps",
              "Look into local senior centers for social activities",
              "Consider a friendly caller or volunteer visitor program",
              "Use Harbor's Social & Pet Care Plan to organize contacts and schedules",
            ],
          },
          {
            heading: "Watch for warning signs:",
            items: [
              "Declining interest in activities they used to enjoy",
              "Changes in eating, sleeping, or personal hygiene",
              "Not answering the phone or returning calls",
              "Increased irritability or talking about being a burden",
            ],
          },
        ],
      };
    } else if (title.includes("insurance") || title.includes("medicare") || title.includes("medicaid")) {
      return {
        type: "Script Generator",
        icon: "💬",
        content: [
          {
            heading: "Script for calling insurance:",
            items: [
              '"Hi, I\'m calling on behalf of my mother/father [NAME], DOB [DATE]."',
              '"I have their permission to discuss their coverage. Policy # is [NUMBER]."',
              '"Can you help me understand their current coverage for [specific question]?"',
              '"What\'s covered under their plan for [home care/SNF/hospice/etc]?"',
              '"Are there any prior authorization requirements?"',
            ],
          },
          {
            heading: "Information to have ready:",
            items: [
              "Parent's full name and date of birth",
              "Policy/member ID number",
              "Social Security number (may be needed)",
              "Specific questions about coverage you need answered",
            ],
          },
        ],
      };
    } else {
      // Generic help
      return {
        type: "Next Steps",
        icon: "→",
        content: [
          {
            heading: "Here's how to tackle this:",
            items: task.suggestedActions,
          },
        ],
      };
    }
  };

  const isHipaaTask = (() => {
    const t = task.title.toLowerCase();
    const w = task.why?.toLowerCase() || "";
    const text = t + " " + w;
    return (
      (task.domain === "medical" || task.domain === "legal") &&
      (text.includes("hipaa") || text.includes("medical record access") ||
        text.includes("medical records") || text.includes("patient portal") ||
        text.includes("health record"))
    );
  })();

  const isAdvanceDirectiveTask = (() => {
    const t = task.title.toLowerCase();
    const w = task.why?.toLowerCase() || "";
    const text = t + " " + w;
    return (
      task.domain === "legal" &&
      (text.includes("advance directive") ||
        text.includes("living will") ||
        text.includes("healthcare directive") ||
        text.includes("healthcare proxy") ||
        text.includes("health care proxy") ||
        text.includes("end-of-life") ||
        text.includes("end of life") ||
        text.includes("medical decision") ||
        text.includes("healthcare wishes") ||
        text.includes("dnr") ||
        (text.includes("healthcare") && (text.includes("poa") || text.includes("power of attorney"))))
    );
  })();

  const isHomeSafetyTask = (() => {
    const t = task.title.toLowerCase();
    const w = task.why?.toLowerCase() || "";
    const text = t + " " + w;
    return (
      task.domain === "housing" &&
      (text.includes("home safety") || text.includes("fall prevention") ||
        text.includes("grab bar") || text.includes("aging in place") ||
        text.includes("safety assessment") || text.includes("fall risk") ||
        text.includes("home modification"))
    );
  })();

  const isTransportTask = (() => {
    const t = task.title.toLowerCase();
    const w = task.why?.toLowerCase() || "";
    const text = t + " " + w;
    return (
      task.domain === "transportation" &&
      (text.includes("transportation") || text.includes("medical transport") ||
        text.includes("ride service") || text.includes("getting to appointments") ||
        text.includes("driving") || text.includes("uber") || text.includes("lyft") ||
        text.includes("paratransit"))
    );
  })();

  const isSocialCareTask = (() => {
    const t = task.title.toLowerCase();
    const w = task.why?.toLowerCase() || "";
    const text = t + " " + w;
    return (
      task.domain === "social" &&
      (text.includes("social") || text.includes("isolation") ||
        text.includes("loneliness") || text.includes("check-in") || text.includes("check in") ||
        text.includes("pet care") || text.includes("companion") ||
        text.includes("community"))
    );
  })();

  const isPoaTask = (() => {
    const t = task.title.toLowerCase();
    const w = task.why?.toLowerCase() || "";
    const text = t + " " + w;
    const hasPoaKeyword = text.includes("power of attorney") || text.includes("poa") ||
      text.includes("legal authority") || text.includes("financial authority") ||
      text.includes("manage finances") || text.includes("legal document");
    const isHealthcare =
      text.includes("healthcare power") ||
      text.includes("health care power") ||
      text.includes("medical power") ||
      text.includes("healthcare poa") ||
      text.includes("health care poa") ||
      text.includes("healthcare proxy") ||
      text.includes("health care proxy") ||
      text.includes("advance directive") ||
      text.includes("living will") ||
      text.includes("healthcare directive") ||
      text.includes("end-of-life") ||
      text.includes("end of life") ||
      text.includes("medical decision") ||
      text.includes("dnr");
    return task.domain === "legal" && hasPoaKeyword && !isHealthcare;
  })();

  const helpContent = enhancedHelp || getHelpContent();

  // Fetch enhanced help for healthcare proxy tasks
  const fetchEnhancedHelp = async () => {
    const title = task.title.toLowerCase();

    // Only fetch for healthcare proxy/POA tasks with state info
    if (
      (title.includes("proxy") || title.includes("poa") || title.includes("power of attorney") || title.includes("advance directive") || title.includes("living will") || title.includes("healthcare directive")) &&
      task.domain === "legal" &&
      userContext?.parentState
    ) {
      setLoadingHelp(true);
      try {
        const response = await fetch("/api/task-help", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task,
            helpType: "action_guide",
            userContext
          })
        });

        const data = await response.json();

        if (data.helpType === "healthcare_proxy_detailed") {
          // Format the enhanced help into our component structure
          setEnhancedHelp({
            type: "Healthcare Proxy Guide",
            icon: "📋",
            content: [
              {
                heading: "What is a Healthcare Proxy?",
                items: data.education.split("\n\n").filter((p: string) => p.trim())
              },
              {
                heading: "Your Options",
                items: data.options.map((opt: { name: string; cost: string; time: string; bestFor: string }) =>
                  `**${opt.name}** (${opt.cost}, ${opt.time}): ${opt.bestFor}`
                )
              },
              {
                heading: "Recommendation for " + userContext.parentState,
                items: [data.recommendation]
              }
            ],
            detailedOptions: data.options
          });
        }
      } catch (error) {
        console.error("Failed to fetch enhanced help:", error);
      } finally {
        setLoadingHelp(false);
      }
    }
  };

  useEffect(() => {
    if (showHelp && !enhancedHelp) {
      fetchEnhancedHelp();
    }
  }, [showHelp]);

  return (
    <div className="fixed inset-0 bg-slate/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b-2"
          style={{ borderColor: domainColors[task.domain] }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-1 rounded-md font-sans text-xs font-semibold uppercase"
                style={{
                  backgroundColor: `${domainColors[task.domain]}15`,
                  color: domainColors[task.domain],
                }}
              >
                {task.domain}
              </span>
              <span
                className="px-2 py-1 rounded-md font-sans text-xs font-semibold uppercase"
                style={{
                  backgroundColor: task.priority === "high" ? "#D4725C15" : "#C4943A15",
                  color: task.priority === "high" ? "#D4725C" : "#C4943A",
                }}
              >
                {priorityLabels[task.priority]}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slateMid hover:text-slate text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <h2 className="font-serif text-xl font-semibold text-slate mb-2">
            {task.title}
          </h2>

          <p className="font-sans text-sm text-slateMid leading-relaxed">
            {task.why}
          </p>
        </div>

        {/* Suggested Actions */}
        <div className="px-5 py-4 border-b border-sand">
          <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-3">
            Suggested Next Steps
          </div>
          <div className="space-y-2">
            {(task.suggestedActions || []).map((action, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-ocean text-white flex items-center justify-center font-sans text-xs font-semibold shrink-0">
                  {index + 1}
                </div>
                <div className="font-sans text-sm text-slate leading-relaxed pt-0.5">
                  {action}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checklist Section */}
        {(() => {
          const checklist = task.checklist || getDefaultChecklist(task.title);
          if (!checklist || checklist.length === 0) return null;

          return (
            <div className="px-5 py-4 border-b border-sand">
              <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-3">
                Checklist
              </div>
              <div className="space-y-2">
                {checklist.map((item) => {
                  const isChecked = checklistState[item.id] ?? item.completed;

                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            toggleChecklistItem(task.title, item.id);
                            setChecklistState((prev) => ({
                              ...prev,
                              [item.id]: !isChecked,
                            }));
                          }}
                          className="mt-0.5 w-4 h-4 rounded border-slateLight accent-ocean flex-shrink-0"
                        />
                        <span
                          className={`font-sans text-sm ${
                            isChecked
                              ? "text-slateLight line-through"
                              : "text-slate"
                          }`}
                        >
                          {item.label}
                        </span>
                      </label>
                      {item.linkTo && !isChecked && (
                        <Link
                          href={item.linkTo}
                          className="font-sans text-xs text-ocean font-semibold hover:text-oceanMid transition-colors flex-shrink-0"
                        >
                          Open guide →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Advance Directive CTA */}
        {isAdvanceDirectiveTask && (
          <div className="px-5 py-4 border-b border-sand">
            <Link
              href="/advance-directives"
              className="block border-2 rounded-xl px-4 py-4 transition-colors hover:bg-sage/5"
              style={{ borderColor: "#6B8F71" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <div className="font-sans text-sm font-semibold text-slate">
                    Get Started with Harbor&apos;s Guide
                  </div>
                  <div className="font-sans text-xs text-slateMid mt-0.5">
                    Harbor has your state&apos;s form ready with a guided walkthrough
                  </div>
                </div>
                <span className="ml-auto text-slateMid text-lg">→</span>
              </div>
            </Link>
          </div>
        )}

        {/* POA CTA */}
        {isPoaTask && (
          <div className="px-5 py-4 border-b border-sand">
            <Link
              href="/power-of-attorney"
              className="block border-2 rounded-xl px-4 py-4 transition-colors hover:bg-ocean/5"
              style={{ borderColor: "#1B6B7D" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <div className="font-sans text-sm font-semibold text-slate">
                    Get Started with Harbor&apos;s POA Guide
                  </div>
                  <div className="font-sans text-xs text-slateMid mt-0.5">
                    Your state&apos;s financial POA form with a step-by-step walkthrough
                  </div>
                </div>
                <span className="ml-auto text-slateMid text-lg">→</span>
              </div>
            </Link>
          </div>
        )}

        {/* HIPAA CTA */}
        {isHipaaTask && (
          <div className="px-5 py-4 border-b border-sand">
            <Link
              href="/hipaa-authorization"
              className="block border-2 rounded-xl px-4 py-4 transition-colors hover:bg-amber/5"
              style={{ borderColor: "#C4943A" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏥</span>
                <div>
                  <div className="font-sans text-sm font-semibold text-slate">
                    Get Started with Harbor&apos;s HIPAA Guide
                  </div>
                  <div className="font-sans text-xs text-slateMid mt-0.5">
                    Universal federal form with a guided walkthrough
                  </div>
                </div>
                <span className="ml-auto text-slateMid text-lg">→</span>
              </div>
            </Link>
          </div>
        )}

        {/* Home Safety CTA */}
        {isHomeSafetyTask && (
          <div className="px-5 py-4 border-b border-sand">
            <Link
              href="/home-safety"
              className="block border-2 rounded-xl px-4 py-4 transition-colors hover:bg-amber/5"
              style={{ borderColor: "#C4943A" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏠</span>
                <div>
                  <div className="font-sans text-sm font-semibold text-slate">
                    Open Home Safety Assessment
                  </div>
                  <div className="font-sans text-xs text-slateMid mt-0.5">
                    Room-by-room checklist with emergency contact capture
                  </div>
                </div>
                <span className="ml-auto text-slateMid text-lg">→</span>
              </div>
            </Link>
          </div>
        )}

        {/* Transportation CTA */}
        {isTransportTask && (
          <div className="px-5 py-4 border-b border-sand">
            <Link
              href="/transportation-plan"
              className="block border-2 rounded-xl px-4 py-4 transition-colors hover:bg-ocean/5"
              style={{ borderColor: "#1B6B7D" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚗</span>
                <div>
                  <div className="font-sans text-sm font-semibold text-slate">
                    Open Transportation Plan Guide
                  </div>
                  <div className="font-sans text-xs text-slateMid mt-0.5">
                    Set up primary and backup transport with local resources
                  </div>
                </div>
                <span className="ml-auto text-slateMid text-lg">→</span>
              </div>
            </Link>
          </div>
        )}

        {/* Social Care CTA */}
        {isSocialCareTask && (
          <div className="px-5 py-4 border-b border-sand">
            <Link
              href="/social-care"
              className="block border-2 rounded-xl px-4 py-4 transition-colors hover:bg-sage/5"
              style={{ borderColor: "#6B8F71" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤝</span>
                <div>
                  <div className="font-sans text-sm font-semibold text-slate">
                    Open Social & Pet Care Plan
                  </div>
                  <div className="font-sans text-xs text-slateMid mt-0.5">
                    Emergency contacts, check-ins, community resources & pet care
                  </div>
                </div>
                <span className="ml-auto text-slateMid text-lg">→</span>
              </div>
            </Link>
          </div>
        )}

        {/* AI Help Section */}
        {!showHelp ? (
          <div className="px-5 py-4">
            <button
              onClick={() => setShowHelp(true)}
              disabled={loadingHelp}
              className="w-full bg-oceanLight hover:bg-ocean/20 text-ocean rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="text-lg">{loadingHelp ? "⏳" : "🤖"}</span>
              {loadingHelp ? "Loading Help..." : "Get AI Help with This Task"}
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 bg-oceanLight">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{helpContent.icon}</span>
              <div className="font-sans text-sm font-semibold text-ocean">
                {helpContent.type}
              </div>
            </div>

            <div className="space-y-4">
              {helpContent.content.map((section: { heading: string; items: string[] }, index: number) => (
                <div key={index}>
                  <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-2">
                    {section.heading}
                  </div>
                  <div className="bg-white rounded-lg px-3 py-3 space-y-2">
                    {section.items.map((item, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-ocean mt-0.5 shrink-0">•</span>
                        <span className="font-sans text-sm text-slate leading-relaxed">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Capture Section */}
        {!showDataCapture ? (
          <div className="px-5 py-4 bg-warmWhite border-t border-sand">
            <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-3">
              Add Information
            </div>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => {
                  setShowDataCapture(true);
                  setCaptureMode("chat");
                }}
                className="w-full bg-ocean hover:bg-oceanMid text-white rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">💬</span>
                Tell Harbor
                <span className="ml-auto text-xs font-normal opacity-80">Recommended</span>
              </button>
              <button
                onClick={() => {
                  setShowDataCapture(true);
                  setCaptureMode("form");
                }}
                className="w-full bg-white hover:bg-sand border border-sandDark text-slate rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">✍️</span>
                Type It In
              </button>
              <button
                onClick={() => {
                  setShowDataCapture(true);
                  setCaptureMode("upload");
                }}
                className="w-full bg-white hover:bg-sand border border-sandDark text-slate rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">📎</span>
                Upload Photo / Document
              </button>
            </div>
            <button
              onClick={onMarkComplete}
              className="w-full bg-sand hover:bg-sandDark text-slateMid rounded-xl px-4 py-3 font-sans text-sm font-medium transition-colors"
            >
              Mark Complete Without Adding Info
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 bg-warmWhite border-t border-sand">
            {captureMode === "chat" && (
              <TaskChat
                task={task}
                userContext={userContext}
                onComplete={(data) => {
                  console.log("Captured data:", data);
                  if (data?.toolName && data?.data) {
                    saveTaskData(task.title, data.toolName, data.data);
                  }
                  onMarkComplete();
                }}
                onCancel={() => {
                  setShowDataCapture(false);
                  setCaptureMode(null);
                }}
              />
            )}
            {captureMode === "form" && (
              <TaskForm
                task={task}
                onComplete={(data) => {
                  console.log("Captured data:", data);
                  if ("toolName" in data && data.toolName) {
                    // Structured data from smart form
                    saveTaskData(task.title, data.toolName, data.data);
                  } else if ("notes" in data && data.notes) {
                    // Plain notes fallback
                    saveTaskData(task.title, "manual_notes", data);
                  }
                  onMarkComplete();
                }}
                onCancel={() => {
                  setShowDataCapture(false);
                  setCaptureMode(null);
                }}
              />
            )}
            {captureMode === "upload" && (
              <div className="space-y-3">
                <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-2">
                  Upload Document or Photo
                </div>

                {uploadState === "idle" && (
                  <>
                    <label className="block w-full cursor-pointer">
                      <div className="w-full border-2 border-dashed border-ocean/40 rounded-xl px-5 py-8 text-center hover:border-ocean transition-colors">
                        <div className="text-3xl mb-2">📷</div>
                        <div className="font-sans text-sm font-semibold text-ocean mb-1">
                          Tap to choose a file
                        </div>
                        <div className="font-sans text-xs text-slateMid">
                          Insurance card, medication list, legal document, etc.
                        </div>
                        <div className="font-sans text-[11px] text-slateLight mt-1">
                          JPEG, PNG, WebP, HEIC, PDF — up to 10MB
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const parentId = getActiveParentId();
                          if (!parentId) {
                            setUploadState("error");
                            setUploadResult("No parent profile found. Please set up a profile first.");
                            return;
                          }

                          setUploadState("uploading");
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("parentId", parentId);

                            const response = await fetch("/api/upload", {
                              method: "POST",
                              body: formData,
                            });

                            const result = await response.json();

                            if (!response.ok) {
                              setUploadState("error");
                              setUploadResult(result.error || "Upload failed");
                              return;
                            }

                            if (result.extraction?.data) {
                              // Show review step before saving
                              setUploadExtraction({
                                uploadId: result.uploadId || "inline",
                                fileName: file.name,
                                extraction: result.extraction,
                              });
                              setUploadState("reviewing");
                            } else {
                              // No extraction data — save as generic note
                              saveTaskData(task.title, "manual_notes", { notes: `Uploaded: ${file.name}` });
                              setUploadState("done");
                              setUploadResult(`${file.name} uploaded`);
                              setTimeout(() => onMarkComplete(), 1500);
                            }
                          } catch (err) {
                            console.error("Upload error:", err);
                            setUploadState("error");
                            setUploadResult("Upload failed. Please try again.");
                          }
                        }}
                      />
                    </label>
                    <button
                      onClick={() => {
                        setShowDataCapture(false);
                        setCaptureMode(null);
                      }}
                      className="w-full mt-2 text-slateMid hover:text-slate font-sans text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {uploadState === "uploading" && (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-2 border-ocean border-t-transparent rounded-full animate-spin mb-3" />
                    <div className="font-sans text-sm text-slate font-medium">
                      Uploading and extracting data...
                    </div>
                    <div className="font-sans text-xs text-slateMid mt-1">
                      This may take a moment
                    </div>
                  </div>
                )}

                {uploadState === "reviewing" && uploadExtraction && (
                  <ExtractionReview
                    uploadId={uploadExtraction.uploadId}
                    fileName={uploadExtraction.fileName}
                    extraction={uploadExtraction.extraction}
                    parentId={getActiveParentId() || "default"}
                    onConfirm={(confirmedData: ExtractedData) => {
                      // Save raw extraction
                      saveTaskData(
                        task.title,
                        `upload_${uploadExtraction.extraction.documentType}`,
                        confirmedData
                      );
                      // Normalize into care-summary-compatible entries
                      saveExtractionAsTaskData(confirmedData, uploadExtraction.fileName);

                      setUploadState("done");
                      setUploadResult(`${uploadExtraction.fileName} saved`);
                      setUploadExtraction(null);
                      setTimeout(() => onMarkComplete(), 1500);
                    }}
                    onReject={() => {
                      setUploadState("idle");
                      setUploadExtraction(null);
                    }}
                  />
                )}

                {uploadState === "done" && (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-sage rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="font-sans text-sm font-semibold text-sage">
                      {uploadResult}
                    </div>
                  </div>
                )}

                {uploadState === "error" && (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">❌</div>
                    <div className="font-sans text-sm text-coral font-medium mb-3">
                      {uploadResult}
                    </div>
                    <button
                      onClick={() => {
                        setUploadState("idle");
                        setUploadResult(null);
                      }}
                      className="font-sans text-sm text-ocean font-medium hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Close Button (always visible) */}
        {!showDataCapture && (
          <div className="px-5 pb-4">
            <button
              onClick={onClose}
              className="w-full bg-white hover:bg-sand border border-sandDark text-slate rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// TaskChat and TaskForm are now in components/task/

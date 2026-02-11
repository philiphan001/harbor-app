"use client";

import { useState, useEffect } from "react";
import { Task } from "@/lib/ai/claude";
import { saveTaskData } from "@/lib/utils/taskData";

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
  const [enhancedHelp, setEnhancedHelp] = useState<any>(null);
  const [showDataCapture, setShowDataCapture] = useState(false);
  const [captureMode, setCaptureMode] = useState<"chat" | "form" | null>(null);

  // Domain colors
  const domainColors: Record<string, string> = {
    medical: "#D4725C",
    financial: "#1B6B7D",
    legal: "#6B8F71",
    housing: "#C4943A",
    family: "#4A6274",
    caregiving: "#2A8FA4",
  };

  // Priority labels
  const priorityLabels = {
    high: "Urgent",
    medium: "Important",
    low: "When you can",
  };

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
    } else if (title.includes("proxy") || title.includes("poa") || title.includes("power of attorney")) {
      return {
        type: "Action Guide",
        icon: "📋",
        content: [
          {
            heading: "How to get this done (easier than you think):",
            items: [
              "Download the form for your state - Search '[your state] healthcare proxy form'",
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

  const helpContent = enhancedHelp || getHelpContent();

  // Fetch enhanced help for healthcare proxy tasks
  const fetchEnhancedHelp = async () => {
    const title = task.title.toLowerCase();

    // Only fetch for healthcare proxy/POA tasks with state info
    if (
      (title.includes("proxy") || title.includes("poa") || title.includes("power of attorney")) &&
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
                items: data.options.map((opt: any) =>
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
            {task.suggestedActions.map((action, index) => (
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
              {helpContent.content.map((section, index) => (
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
                  if (data?.notes) {
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

// Mini chat component for conversational data capture
function TaskChat({
  task,
  userContext,
  onComplete,
  onCancel,
}: {
  task: Task;
  userContext?: { parentState?: string; parentName?: string };
  onComplete: (data: any) => void;
  onCancel: () => void;
}) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: `Great! What information did you find out about "${task.title}"? Just tell me naturally and I'll organize it for you.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/task-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          messages: [...messages, userMessage],
          userContext,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      // If data capture is complete, call onComplete with extracted data
      if (data.complete) {
        setTimeout(() => {
          onComplete(data.extractedData);
        }, 1000);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-2">
        Tell Harbor
      </div>

      {/* Messages */}
      <div className="bg-white rounded-xl border border-sandDark p-3 space-y-3 max-h-60 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-lg px-3 py-2 max-w-[85%] ${
                msg.role === "user"
                  ? "bg-ocean text-white"
                  : "bg-sand text-slate"
              }`}
            >
              <div className="font-sans text-sm leading-relaxed">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-sand rounded-lg px-3 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slateMid rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slateMid rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-slateMid rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your response..."
          disabled={isLoading}
          className="flex-1 px-3 py-2 border border-sandDark rounded-lg font-sans text-sm text-slate placeholder:text-slateLight focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-ocean text-white rounded-lg font-sans text-sm font-semibold hover:bg-oceanMid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>

      <button
        onClick={onCancel}
        className="w-full mt-2 text-slateMid hover:text-slate font-sans text-sm font-medium transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

// Simple form component for structured data entry
function TaskForm({
  task,
  onComplete,
  onCancel,
}: {
  task: Task;
  onComplete: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ notes: formData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-2">
        Type It In
      </div>
      <textarea
        value={formData}
        onChange={(e) => setFormData(e.target.value)}
        placeholder="Enter the information you gathered..."
        rows={6}
        className="w-full px-3 py-2 border border-sandDark rounded-lg font-sans text-sm text-slate placeholder:text-slateLight focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-sand hover:bg-sandDark text-slate rounded-lg px-4 py-2 font-sans text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!formData.trim()}
          className="flex-1 bg-ocean hover:bg-oceanMid text-white rounded-lg px-4 py-2 font-sans text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </form>
  );
}

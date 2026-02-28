"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Message } from "@/lib/types/situation";
import { Task } from "@/lib/ai/claude";
import TaskList from "./TaskList";
import TaskDetail from "./TaskDetail";
import { getTasks, addTasks, removeTask } from "@/lib/utils/taskStorage";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { Answer } from "@/lib/types/readiness";

interface ChatInterfaceProps {
  initialMessage?: string;
  mode: "crisis" | "readiness";
  onComplete?: (data: Record<string, unknown>) => void;
  // For readiness mode: shared answer state
  currentAnswers?: Answer[];
  onAnswersExtracted?: (answers: Answer[]) => void;
  // For resuming an existing conversation
  conversationId?: string;
  // Data summary for crisis mode (injected into system prompt)
  dataSummary?: string;
}

// --- Conversation persistence helpers (fire-and-forget) ---

async function createConversationApi(
  conversationType: string,
  situationId?: string
): Promise<string | null> {
  try {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationType, situationId }),
    });
    if (!res.ok) {
      console.warn("Failed to create conversation:", res.status);
      return null;
    }
    const data = await res.json();
    return data.conversation?.id ?? null;
  } catch (err) {
    console.warn("Failed to create conversation:", err);
    return null;
  }
}

async function persistMessages(
  convId: string,
  msgs: Array<{ role: string; content: string; metadata?: Record<string, unknown> }>
): Promise<void> {
  try {
    await fetch(`/api/conversations/${convId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs }),
    });
  } catch (err) {
    console.warn("Failed to persist messages:", err);
  }
}

async function loadConversationMessages(
  convId: string
): Promise<Message[]> {
  try {
    const res = await fetch(`/api/conversations/${convId}/messages`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.messages || []).map((m: { id: string; role: string; content: string; metadata?: unknown; createdAt: string }) => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
      timestamp: new Date(m.createdAt),
      metadata: m.metadata as Record<string, unknown> | undefined,
    }));
  } catch {
    return [];
  }
}

/** Render markdown links [text](url) as clickable elements. Internal routes use Next.js Link. */
function renderMessageContent(content: string): ReactNode {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const [, linkText, url] = match;
    const isInternal = url.startsWith("/");

    if (isInternal) {
      parts.push(
        <Link key={match.index} href={url} className="text-ocean underline hover:text-oceanMid">
          {linkText}
        </Link>
      );
    } else {
      parts.push(
        <a key={match.index} href={url} target="_blank" rel="noopener noreferrer" className="text-ocean underline hover:text-oceanMid">
          {linkText}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

export default function ChatInterface({
  initialMessage,
  mode,
  onComplete,
  currentAnswers,
  onAnswersExtracted,
  conversationId: initialConversationId,
  dataSummary,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);
  const [isExtractingAnswers, setIsExtractingAnswers] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load existing tasks from storage
    const storedTasks = getTasks();
    setTasks(storedTasks);
  }, []);

  // Resume an existing conversation if conversationId is provided
  useEffect(() => {
    if (initialConversationId) {
      loadConversationMessages(initialConversationId).then((loaded) => {
        if (loaded.length > 0) {
          setMessages(loaded);
        }
      });
    }
  }, [initialConversationId]);

  useEffect(() => {
    // Send initial AI message (only for new conversations)
    if (initialMessage && !initialConversationId) {
      const welcomeMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: initialMessage,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [initialMessage, initialConversationId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const conversationHistory = [...messages, userMessage];

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsExtractingTasks(true); // Start background task extraction

    // For readiness mode, also extract structured answers
    if (mode === "readiness" && onAnswersExtracted) {
      setIsExtractingAnswers(true);
    }

    try {
      // --- Ensure we have a conversation ID for persistence ---
      let convId = activeConversationId;
      if (!convId) {
        // Create conversation on first user message (fire-and-forget, non-blocking)
        const createPromise = createConversationApi(mode);
        // We'll await it below alongside the other requests
        convId = await createPromise;
        if (convId) {
          setActiveConversationId(convId);
          // Also persist the initial welcome message if there was one
          if (initialMessage) {
            persistMessages(convId, [
              { role: "assistant", content: initialMessage },
            ]);
          }
        }
      }

      // PARALLEL EXTRACTION: Stream conversation + background task extraction
      console.log(`🚀 Starting parallel requests (streaming conversation + task extraction${mode === "readiness" ? " + answer extraction" : ""})`);

      // Request 1: Streaming conversation response
      const streamPromise = fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory,
          mode,
          ...(dataSummary ? { dataSummary } : {}),
        }),
      });

      // Request 2: Task extraction (runs in parallel)
      const taskExtractionPromise = fetch("/api/extract-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      // Request 3: Answer extraction for readiness mode (runs in parallel)
      const answerExtractionPromise = mode === "readiness" && onAnswersExtracted
        ? fetch("/api/extract-answers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationHistory: conversationHistory.map(m => ({
                role: m.role,
                content: m.content
              })),
            }),
          })
        : null;

      // --- Stream the conversation response token by token ---
      const streamResponse = await streamPromise;

      // Create the assistant message placeholder immediately
      const assistantMsgId = `msg-${Date.now() + 1}`;
      const assistantMessage: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      // Read the SSE stream
      let fullText = "";

      // Only add placeholder and start streaming if response is OK
      if (!streamResponse.ok) {
        console.error("Stream response not OK:", streamResponse.status);
        fullText = "I'm sorry, I encountered an error. Please try again.";
        setMessages((prev) => [...prev, {
          ...assistantMessage,
          content: fullText,
        }]);
        setIsLoading(false);
      } else {
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false); // Hide bouncing dots, show streaming text
        const reader = streamResponse.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE events from buffer
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === "delta") {
                  fullText += event.text;
                  // Update the message in-place with accumulated text
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: fullText } : m
                    )
                  );
                } else if (event.type === "done") {
                  // Stream complete — update metadata
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, metadata: { model: event.model, usage: event.usage } }
                        : m
                    )
                  );
                } else if (event.type === "error") {
                  console.error("Stream error:", event.message);
                  // Show error in message bubble instead of leaving it empty
                  if (!fullText) {
                    fullText = "I'm sorry, something went wrong. Please try again.";
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId ? { ...m, content: fullText } : m
                      )
                    );
                  }
                }
              } catch {
                // Skip malformed SSE lines
              }
            }
          }
        }

        // If stream completed but produced no text, replace with error message
        if (!fullText.trim()) {
          fullText = "I'm sorry, I wasn't able to generate a response. Please try again.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: fullText } : m
            )
          );
        }

        console.log("✅ Streaming response complete");
      }

      // --- Persist user + assistant messages (fire-and-forget) ---
      if (convId) {
        persistMessages(convId, [
          { role: "user", content: userMessage.content },
          {
            role: "assistant",
            content: fullText,
          },
        ]);
      }

      // Wait for task extraction (happens in background, doesn't block UI)
      console.log("⏳ Waiting for task extraction...");
      try {
        const taskResponse = await taskExtractionPromise;
        if (!taskResponse.ok) {
          console.warn(`Task extraction failed: ${taskResponse.status} ${taskResponse.statusText}`);
        } else {
          const taskData = await taskResponse.json();

          // Add extracted tasks
          if (taskData.tasks && taskData.tasks.length > 0) {
            console.log("💾 Saving extracted tasks:", taskData.tasks.length);
            setTasks((prev) => [...prev, ...taskData.tasks]);
            addTasks(taskData.tasks);
            console.log("✅ Task extraction complete");
          } else {
            console.log("ℹ️ No new tasks extracted this turn");
          }
        }
      } catch (taskError) {
        console.warn("Task extraction error:", taskError);
      }

      // Wait for answer extraction (readiness mode only)
      if (answerExtractionPromise && onAnswersExtracted) {
        console.log("⏳ Waiting for answer extraction...");
        const answerResponse = await answerExtractionPromise;
        const answerData = await answerResponse.json();

        if (answerData.answers && answerData.answers.length > 0) {
          console.log(`📝 Extracted ${answerData.answers.length} structured answers`);

          // Merge with existing answers (newer answers override older ones)
          const mergedAnswers = [...(currentAnswers || [])];

          answerData.answers.forEach((newAnswer: Answer) => {
            const existingIndex = mergedAnswers.findIndex(
              (a) => a.questionId === newAnswer.questionId
            );

            if (existingIndex >= 0) {
              // Replace existing answer
              mergedAnswers[existingIndex] = newAnswer;
            } else {
              // Add new answer
              mergedAnswers.push(newAnswer);
            }
          });

          onAnswersExtracted(mergedAnswers);
          console.log("✅ Answer extraction complete");
        } else {
          console.log("ℹ️ No new structured answers extracted");
        }

        setIsExtractingAnswers(false);
      }

      // Note: Completion detection is handled by the conversation flow itself
      // The streaming endpoint doesn't return structured completion signals
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content:
          "I'm sorry, I encountered an error. Please try again or refresh the page.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    } finally {
      setIsExtractingTasks(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleMarkComplete = () => {
    if (selectedTask) {
      // Remove the completed task
      setTasks((prev) => prev.filter((t) => t.title !== selectedTask.title));
      // Remove from localStorage
      removeTask(selectedTask.title);
      setSelectedTask(null);
    }
  };

  // Get parent profile for passing to TaskDetail
  const parentProfile = getParentProfile();

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onMarkComplete={handleMarkComplete}
          userContext={{
            parentState: parentProfile?.state,
            parentName: parentProfile?.name
          }}
        />
      )}

      {/* Header */}
      <div className="bg-ocean px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={tasks.length > 0 ? "/dashboard" : "/"}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="font-serif text-lg font-semibold text-white">
              Harbor
            </div>
            <div className="font-sans text-xs text-white/60">
              {mode === "crisis" ? "Crisis Intake" : "Readiness Assessment"}
            </div>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <span className="font-serif text-white text-sm font-semibold">
            H
          </span>
        </div>
      </div>

      {/* Task extraction happens silently in background - tasks only shown on dashboard */}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-ocean text-white ml-auto"
                  : "bg-white border border-sandDark text-slate"
              }`}
            >
              <div
                className={`font-sans text-[15px] leading-relaxed whitespace-pre-wrap ${
                  message.role === "user" ? "text-white" : "text-slate"
                }`}
              >
                {message.role === "assistant" ? renderMessageContent(message.content) : message.content}
              </div>
              <div
                className={`font-sans text-[10px] mt-1.5 ${
                  message.role === "user" ? "text-white/60" : "text-slateLight"
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-sandDark rounded-2xl px-4 py-3">
              <div className="flex space-x-1.5">
                <div
                  className="w-2 h-2 bg-slateLight rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-slateLight rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-slateLight rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-sandDark bg-white px-4 py-3">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-sandDark rounded-xl font-sans text-sm text-slate placeholder:text-slateLight focus:outline-none focus:ring-2 focus:ring-ocean focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-ocean text-white rounded-xl font-sans text-sm font-semibold hover:bg-oceanMid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

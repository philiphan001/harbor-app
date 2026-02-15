"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Message } from "@/lib/types/situation";
import { Task } from "@/lib/ai/claude";
import TaskList from "./TaskList";
import TaskDetail from "./TaskDetail";
import { getTasks, addTasks, removeTask } from "@/lib/utils/taskStorage";
import { getParentProfile, saveParentProfile } from "@/lib/utils/parentProfile";
import { Answer } from "@/lib/types/readiness";

interface ChatInterfaceProps {
  initialMessage?: string;
  mode: "crisis" | "readiness";
  onComplete?: (data: any) => void;
  // For readiness mode: shared answer state
  currentAnswers?: Answer[];
  onAnswersExtracted?: (answers: Answer[]) => void;
}

export default function ChatInterface({
  initialMessage,
  mode,
  onComplete,
  currentAnswers,
  onAnswersExtracted,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);
  const [isExtractingAnswers, setIsExtractingAnswers] = useState(false); // NEW: Track answer extraction
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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

  useEffect(() => {
    // Send initial AI message
    if (initialMessage) {
      const welcomeMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: initialMessage,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [initialMessage]);

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
      // PARALLEL EXTRACTION: Make 2-3 API calls simultaneously
      console.log(`🚀 Starting parallel requests (conversation + task extraction${mode === "readiness" ? " + answer extraction" : ""})`);

      // Request 1: Main conversation (NO TOOLS - fast response)
      const conversationPromise = fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory,
          mode,
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

      // Wait for conversation response (show immediately to user)
      console.log("⏳ Waiting for conversation response...");
      const conversationResponse = await conversationPromise;
      const conversationData = await conversationResponse.json();

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: conversationData.message,
        timestamp: new Date(),
        metadata: conversationData.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false); // User sees response now!
      console.log("✅ Conversation response displayed");

      // Save parent profile information if captured (from conversation)
      if (conversationData.parentProfile) {
        console.log("👤 Saving parent profile:", conversationData.parentProfile);
        saveParentProfile(conversationData.parentProfile);
      }

      // Wait for task extraction (happens in background, doesn't block UI)
      console.log("⏳ Waiting for task extraction...");
      const taskResponse = await taskExtractionPromise;
      const taskData = await taskResponse.json();

      // Add extracted tasks
      if (taskData.tasks && taskData.tasks.length > 0) {
        console.log("💾 Saving extracted tasks to localStorage:", taskData.tasks);
        setTasks((prev) => [...prev, ...taskData.tasks]);
        addTasks(taskData.tasks);
        console.log("✅ Task extraction complete");
      } else {
        console.log("ℹ️ No new tasks extracted this turn");
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

      // Check if intake is complete
      if (conversationData.complete && onComplete) {
        onComplete(conversationData.extractedData);
      }
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
    <div className="flex flex-col h-screen max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
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
                className={`font-sans text-[15px] leading-relaxed ${
                  message.role === "user" ? "text-white" : "text-slate"
                }`}
              >
                {message.content}
              </div>
              <div
                className={`font-sans text-[10px] mt-1.5 ${
                  message.role === "user" ? "text-white/60" : "text-slateLight"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
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

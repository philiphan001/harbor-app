"use client";

import { useState } from "react";
import { Task } from "@/lib/ai/claude";

interface TaskChatProps {
  task: Task;
  userContext?: { parentState?: string; parentName?: string };
  onComplete: (data: any) => void;
  onCancel: () => void;
}

export default function TaskChat({ task, userContext, onComplete, onCancel }: TaskChatProps) {
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

"use client";

import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  "What does this diagnosis mean?",
  "Questions to ask before discharge",
  "Explain this medication",
];

export default function AskHarborTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: content.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, mode: "hospital" }),
      });

      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      setMessages([...updatedMessages, { role: "assistant", content: data.message }]);
    } catch {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "I'm having trouble connecting. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Quick actions */}
      {messages.length === 0 && (
        <div className="flex flex-col gap-2">
          <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-slateLight mb-1">
            Quick Questions
          </div>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              className="w-full text-left bg-white border border-sandDark rounded-[14px] px-4 py-3 font-sans text-sm text-slate hover:bg-sand/30 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-[14px] px-4 py-3 font-sans text-sm ${
                msg.role === "user"
                  ? "bg-ocean/10 text-slate ml-8"
                  : "bg-white border border-sandDark text-slate mr-4"
              }`}
            >
              {msg.role === "assistant" ? (
                <div
                  className="prose prose-sm max-w-none [&_ul]:mt-1 [&_ul]:mb-1 [&_li]:mt-0.5 [&_p]:mt-1 [&_p]:mb-1"
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n- /g, "\n<br/>• ")
                      .replace(/\n/g, "<br/>"),
                  }}
                />
              ) : (
                msg.content
              )}
            </div>
          ))}
          {isLoading && (
            <div className="bg-white border border-sandDark rounded-[14px] px-4 py-3 mr-4">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-slateMid/40 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slateMid/40 rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 bg-slateMid/40 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      )}

      {/* Input */}
      <div className="bg-white border border-sandDark rounded-[14px] px-4 py-3 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about a diagnosis, medication, or hospital process..."
          rows={1}
          className="flex-1 font-sans text-sm text-slate placeholder:text-slateLight resize-none border-none outline-none bg-transparent"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="font-sans text-xs font-semibold text-white bg-coral px-3 py-1.5 rounded-full disabled:opacity-40 transition-opacity flex-shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  );
}

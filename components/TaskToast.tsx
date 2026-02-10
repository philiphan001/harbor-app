"use client";

import { useEffect, useState } from "react";

interface TaskToastProps {
  taskTitle: string;
  onDismiss: () => void;
}

export default function TaskToast({ taskTitle, onDismiss }: TaskToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for fade out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-40 max-w-[380px] mx-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="bg-ocean text-white rounded-xl px-4 py-3 shadow-lg border border-oceanMid">
        <div className="flex items-start gap-3">
          <div className="text-lg shrink-0">✓</div>
          <div className="flex-1 min-w-0">
            <div className="font-sans text-xs font-semibold text-white/80 uppercase tracking-wide mb-0.5">
              Added to your action items
            </div>
            <div className="font-sans text-sm text-white leading-relaxed">
              {taskTitle}
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="text-white/60 hover:text-white text-lg leading-none shrink-0"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

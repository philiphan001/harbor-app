"use client";

import { useState } from "react";
import { Task } from "@/lib/ai/claude";
import type { TaskFormResult } from "@/lib/types/taskCapture";

interface TaskFormProps {
  task: Task;
  onComplete: (data: TaskFormResult) => void;
  onCancel: () => void;
}

export default function TaskForm({ task, onComplete, onCancel }: TaskFormProps) {
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

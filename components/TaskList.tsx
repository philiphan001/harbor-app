"use client";

import { useState } from "react";
import { Task } from "@/lib/ai/claude";

interface TaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function TaskList({ tasks, onTaskClick }: TaskListProps) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed

  if (tasks.length === 0) {
    return null;
  }

  // Count by priority
  const highPriority = tasks.filter((t) => t.priority === "high").length;
  const mediumPriority = tasks.filter((t) => t.priority === "medium").length;
  const lowPriority = tasks.filter((t) => t.priority === "low").length;

  // Domain colors (matching roadmap)
  const domainColors: Record<string, string> = {
    medical: "#D4725C",
    financial: "#1B6B7D",
    legal: "#6B8F71",
    housing: "#C4943A",
    family: "#4A6274",
    caregiving: "#2A8FA4",
  };

  // Priority colors
  const priorityColors = {
    high: "#D4725C",
    medium: "#C4943A",
    low: "#6B8F71",
  };

  return (
    <div className="bg-white border border-sandDark rounded-xl overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-4 py-3 flex items-center justify-between bg-oceanLight hover:bg-oceanLight/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ocean rounded-lg flex items-center justify-center text-white font-sans text-sm font-bold">
            {tasks.length}
          </div>
          <div className="text-left">
            <div className="font-sans text-sm font-semibold text-slate">
              Action Items
            </div>
            <div className="font-sans text-xs text-slateMid">
              {highPriority > 0 && `${highPriority} urgent`}
              {highPriority > 0 && (mediumPriority > 0 || lowPriority > 0) && " · "}
              {mediumPriority > 0 && `${mediumPriority} medium`}
              {lowPriority > 0 && (highPriority > 0 || mediumPriority > 0) && " · "}
              {lowPriority > 0 && `${lowPriority} low`}
            </div>
          </div>
        </div>
        <div
          className="text-lg transition-transform text-ocean"
          style={{
            transform: isCollapsed ? "rotate(0)" : "rotate(180deg)",
          }}
        >
          ▾
        </div>
      </button>

      {/* Task List - Collapsible */}
      {!isCollapsed && (
        <div className="divide-y divide-sand">
          {tasks.map((task, index) => (
            <button
              key={index}
              onClick={() => onTaskClick(task)}
              className="w-full px-4 py-3 text-left hover:bg-sand/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Priority indicator */}
                <div
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ backgroundColor: priorityColors[task.priority] }}
                />

                <div className="flex-1 min-w-0">
                  {/* Task title */}
                  <div className="font-sans text-sm font-medium text-slate mb-1">
                    {task.title}
                  </div>

                  {/* Why it matters */}
                  <div className="font-sans text-xs text-slateMid leading-relaxed mb-2">
                    {task.why}
                  </div>

                  {/* Domain badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-md font-sans text-xs font-medium"
                      style={{
                        backgroundColor: `${domainColors[task.domain]}15`,
                        color: domainColors[task.domain],
                      }}
                    >
                      {task.domain}
                    </span>
                    <span className="font-sans text-xs text-slateMid">
                      {task.suggestedActions.length} suggested steps →
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

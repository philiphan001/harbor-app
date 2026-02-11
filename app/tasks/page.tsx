"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Task } from "@/lib/ai/claude";
import { getTasks, removeTask } from "@/lib/utils/taskStorage";
import { getParentProfile } from "@/lib/utils/parentProfile";
import TaskDetail from "@/components/TaskDetail";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    // Load tasks from localStorage
    const storedTasks = getTasks();
    setTasks(storedTasks);
  }, []);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleMarkComplete = () => {
    if (selectedTask) {
      // Remove from state
      setTasks((prev) => prev.filter((t) => t.title !== selectedTask.title));
      // Remove from localStorage
      removeTask(selectedTask.title);
      setSelectedTask(null);
    }
  };

  const handleClearAll = () => {
    // Clear all tasks
    localStorage.removeItem("harbor_tasks");
    setTasks([]);
    setShowClearConfirm(false);
  };

  // Group tasks by priority
  const highPriorityTasks = tasks.filter((t) => t.priority === "high");
  const mediumPriorityTasks = tasks.filter((t) => t.priority === "medium");
  const lowPriorityTasks = tasks.filter((t) => t.priority === "low");

  // Domain colors
  const domainColors: Record<string, string> = {
    medical: "#D4725C",
    financial: "#1B6B7D",
    legal: "#6B8F71",
    housing: "#C4943A",
    family: "#4A6274",
    caregiving: "#2A8FA4",
  };

  // Get parent profile for passing to TaskDetail
  const parentProfile = getParentProfile();

  return (
    <div className="min-h-screen bg-warmWhite">
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
      <div className="bg-ocean px-5 py-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative max-w-[420px] mx-auto">
          <Link href="/" className="font-sans text-sm text-white/80 hover:text-white inline-block mb-4">
            ← Home
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="font-serif text-3xl font-semibold text-white mb-2">
                Your Action Items
              </h1>
              <p className="font-serif text-base text-white/80 leading-relaxed italic">
                Everything you need to tackle, organized by priority
              </p>
            </div>
            {tasks.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="ml-4 mt-1 bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-2 font-sans text-xs font-semibold transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <div className="font-serif text-xl font-semibold text-slate mb-2">
              Clear all tasks?
            </div>
            <div className="font-sans text-sm text-slateMid mb-6">
              This will permanently delete all {tasks.length} action items. This cannot be undone.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 bg-sand hover:bg-sandDark text-slate rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 bg-coral hover:bg-coral/90 text-white rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[420px] mx-auto px-5 py-6">
        {tasks.length === 0 ? (
          // Empty state
          <div className="bg-white rounded-xl border border-sandDark px-6 py-12 text-center">
            <div className="text-5xl mb-4">✓</div>
            <div className="font-serif text-xl font-semibold text-slate mb-2">
              All caught up!
            </div>
            <div className="font-sans text-sm text-slateMid leading-relaxed mb-6">
              You don't have any pending action items right now. Start a crisis intake or readiness
              assessment to begin building your care plan.
            </div>
            <div className="flex gap-3">
              <Link href="/crisis" className="flex-1">
                <button className="w-full bg-coral text-white rounded-xl px-4 py-3 font-sans text-sm font-semibold hover:bg-coral/90 transition-colors">
                  Crisis Intake
                </button>
              </Link>
              <Link href="/readiness" className="flex-1">
                <button className="w-full bg-ocean text-white rounded-xl px-4 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors">
                  Readiness Score
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Reassurance Message */}
            {(highPriorityTasks.length > 5 || tasks.length > 10) && (
              <div className="bg-ocean/10 border border-ocean/30 rounded-xl px-5 py-4 mb-6">
                <div className="font-sans text-sm text-slate leading-relaxed">
                  <span className="font-semibold">You don't have to do everything at once.</span> I'm here to help you tackle these one at a time. Many can wait until the immediate situation stabilizes. Let's focus on what matters most right now.
                </div>
              </div>
            )}

            {/* Urgent Tasks */}
            {highPriorityTasks.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-coral rounded-full" />
                    <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide">
                      🎯 Start Here — Next 24-48 Hours
                    </div>
                  </div>
                  <div className="font-sans text-xs font-semibold text-coral">
                    {highPriorityTasks.length}
                  </div>
                </div>
                <div className="space-y-3">
                  {highPriorityTasks.map((task, index) => (
                    <TaskCard
                      key={index}
                      task={task}
                      domainColor={domainColors[task.domain]}
                      onClick={() => handleTaskClick(task)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Medium Priority Tasks */}
            {mediumPriorityTasks.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber rounded-full" />
                    <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide">
                      📋 Important — This Week When You Can
                    </div>
                  </div>
                  <div className="font-sans text-xs font-semibold text-amber">
                    {mediumPriorityTasks.length}
                  </div>
                </div>
                <div className="space-y-3">
                  {mediumPriorityTasks.map((task, index) => (
                    <TaskCard
                      key={index}
                      task={task}
                      domainColor={domainColors[task.domain]}
                      onClick={() => handleTaskClick(task)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Low Priority Tasks */}
            {lowPriorityTasks.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-sage rounded-full" />
                    <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide">
                      📌 When Things Settle — Next 2-4 Weeks
                    </div>
                  </div>
                  <div className="font-sans text-xs font-semibold text-sage">
                    {lowPriorityTasks.length}
                  </div>
                </div>
                <div className="space-y-3">
                  {lowPriorityTasks.map((task, index) => (
                    <TaskCard
                      key={index}
                      task={task}
                      domainColor={domainColors[task.domain]}
                      onClick={() => handleTaskClick(task)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Bottom Padding */}
        <div className="h-8" />
      </div>
    </div>
  );
}

function TaskCard({
  task,
  domainColor,
  onClick,
}: {
  task: Task;
  domainColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl border border-sandDark px-4 py-4 text-left hover:border-ocean hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{
            backgroundColor: `${domainColor}15`,
            color: domainColor,
          }}
        >
          {task.domain === "medical" && "♥"}
          {task.domain === "financial" && "◈"}
          {task.domain === "legal" && "◉"}
          {task.domain === "housing" && "⌂"}
          {task.domain === "family" && "◎"}
          {task.domain === "caregiving" && "▣"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-sans text-base font-semibold text-slate mb-1">
            {task.title}
          </div>
          <div className="font-sans text-sm text-slateMid leading-relaxed mb-2">
            {task.why}
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded-md font-sans text-xs font-medium capitalize"
              style={{
                backgroundColor: `${domainColor}15`,
                color: domainColor,
              }}
            >
              {task.domain}
            </span>
            <span className="font-sans text-xs text-slateMid">
              {task.suggestedActions.length} steps →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Task } from "@/lib/ai/claude";
import { getTasks, completeTask, getCompletedTasks, clearTasksForActiveParent } from "@/lib/utils/taskStorage";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { reprioritizeTasks } from "@/lib/utils/taskPrioritizer";
import { getAllDetections } from "@/lib/utils/agentStorage";
import TaskDetail from "@/components/TaskDetail";
import { DOMAIN_COLORS, DOMAIN_ICONS, type ExtendedDomain } from "@/lib/constants/domains";

type CategoryKey = "high" | "medium" | "low";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<CategoryKey, boolean>>({
    high: true,
    medium: false,
    low: false,
  });

  const loadTasks = () => {
    const rawTasks = getTasks();
    const detections = getAllDetections();
    const storedTasks = reprioritizeTasks(rawTasks, { detections });
    const completed = getCompletedTasks();
    setTasks(storedTasks);
    setCompletedTasks(completed);
    // Auto-expand first non-empty category
    const hasHigh = storedTasks.some(t => t.priority === "high");
    const hasMedium = storedTasks.some(t => t.priority === "medium");
    const hasLow = storedTasks.some(t => t.priority === "low");
    setExpandedCategories({
      high: hasHigh,
      medium: !hasHigh && hasMedium,
      low: !hasHigh && !hasMedium && hasLow,
    });
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const toggleCategory = (key: CategoryKey) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleMarkComplete = () => {
    if (selectedTask) {
      completeTask(selectedTask.title);
      setSelectedTask(null);
      loadTasks();
    }
  };

  const handleClearAll = () => {
    clearTasksForActiveParent();
    setTasks([]);
    setShowClearConfirm(false);
  };

  // Group tasks by priority
  const highPriorityTasks = tasks.filter((t) => t.priority === "high");
  const mediumPriorityTasks = tasks.filter((t) => t.priority === "medium");
  const lowPriorityTasks = tasks.filter((t) => t.priority === "low");

  // Domain colors (from shared constants)
  const domainColors = DOMAIN_COLORS;

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
          <Link href="/dashboard" className="font-sans text-sm text-white/80 hover:text-white inline-block mb-4">
            ← Dashboard
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

            {/* Collapsible Task Categories */}
            {highPriorityTasks.length > 0 && (
              <TaskCategory
                label="High Priority"
                icon="🎯"
                dotColor="bg-coral"
                countColor="text-coral"
                tasks={highPriorityTasks}
                isExpanded={expandedCategories.high}
                onToggle={() => toggleCategory("high")}
                domainColors={domainColors}
                onTaskClick={handleTaskClick}
              />
            )}

            {mediumPriorityTasks.length > 0 && (
              <TaskCategory
                label="Medium Priority"
                icon="📋"
                dotColor="bg-amber"
                countColor="text-amber"
                tasks={mediumPriorityTasks}
                isExpanded={expandedCategories.medium}
                onToggle={() => toggleCategory("medium")}
                domainColors={domainColors}
                onTaskClick={handleTaskClick}
              />
            )}

            {lowPriorityTasks.length > 0 && (
              <TaskCategory
                label="Low Priority"
                icon="📌"
                dotColor="bg-sage"
                countColor="text-sage"
                tasks={lowPriorityTasks}
                isExpanded={expandedCategories.low}
                onToggle={() => toggleCategory("low")}
                domainColors={domainColors}
                onTaskClick={handleTaskClick}
              />
            )}
          </>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full flex items-center justify-between mb-3 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sage rounded-full" />
                <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide">
                  Completed
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-sans text-xs font-semibold text-sage">
                  {completedTasks.length}
                </div>
                <svg
                  className={`w-4 h-4 text-slateMid transition-transform duration-200 ${showCompleted ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {showCompleted ? (
              <div className="space-y-2">
                {completedTasks.map((task, index) => (
                  <div
                    key={index}
                    className="bg-white/60 rounded-xl border border-sandDark px-4 py-3 opacity-70"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-sage rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-sans text-sm text-slateMid line-through">{task.title}</div>
                        {task.completedAt && (
                          <div className="font-sans text-[11px] text-slateLight">
                            Completed {new Date(task.completedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-sage/10 rounded-lg px-4 py-2.5 cursor-pointer" onClick={() => setShowCompleted(true)}>
                <div className="font-sans text-xs text-slateMid">
                  {completedTasks.length} completed — tap to view
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Padding */}
        <div className="h-8" />
      </div>
    </div>
  );
}

function TaskCategory({
  label,
  icon,
  dotColor,
  countColor,
  tasks,
  isExpanded,
  onToggle,
  domainColors,
  onTaskClick,
}: {
  label: string;
  icon: string;
  dotColor: string;
  countColor: string;
  tasks: Task[];
  isExpanded: boolean;
  onToggle: () => void;
  domainColors: Record<string, string>;
  onTaskClick: (task: Task) => void;
}) {
  return (
    <div className="mb-5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-3 group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 ${dotColor} rounded-full`} />
          <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide">
            {icon} {label}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`font-sans text-xs font-semibold ${countColor}`}>
            {tasks.length}
          </div>
          <svg
            className={`w-4 h-4 text-slateMid transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <TaskCard
              key={index}
              task={task}
              domainColor={domainColors[task.domain]}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      )}
      {!isExpanded && (
        <div className="bg-sand/40 rounded-lg px-4 py-2.5 cursor-pointer" onClick={onToggle}>
          <div className="font-sans text-xs text-slateMid">
            {tasks.length} {tasks.length === 1 ? "item" : "items"} — tap to expand
          </div>
        </div>
      )}
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
  // Due date logic for recurring tasks
  const dueDate = task.recurrence?.nextDueDate;
  let dueBadge: { label: string; className: string } | null = null;

  if (dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntil = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) {
      dueBadge = {
        label: "Overdue",
        className: "bg-coral/15 text-coral",
      };
    } else if (daysUntil <= 7) {
      dueBadge = {
        label: `Due in ${daysUntil}d`,
        className: "bg-amber/15 text-amber",
      };
    } else {
      dueBadge = {
        label: `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        className: "bg-sand text-slateMid",
      };
    }
  }

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
          {DOMAIN_ICONS[task.domain as ExtendedDomain] || "●"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-sans text-base font-semibold text-slate truncate">
              {task.title}
            </div>
            {task.recurrence && (
              <span className="text-slateMid text-xs flex-shrink-0" title={`Repeats ${task.recurrence.frequency}`}>
                ↻
              </span>
            )}
          </div>
          <div className="font-sans text-sm text-slateMid leading-relaxed mb-2">
            {task.why}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2 py-0.5 rounded-md font-sans text-xs font-medium capitalize"
              style={{
                backgroundColor: `${domainColor}15`,
                color: domainColor,
              }}
            >
              {task.domain}
            </span>
            {dueBadge && (
              <span
                className={`px-2 py-0.5 rounded-md font-sans text-[10px] font-semibold ${dueBadge.className}`}
              >
                {dueBadge.label}
              </span>
            )}
            <span className="font-sans text-xs text-slateMid">
              {(task.suggestedActions || []).length} steps →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

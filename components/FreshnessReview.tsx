"use client";

import { useState } from "react";
import { reviewTaskData, type TaskData } from "@/lib/utils/taskData";
import { getFreshnessStatus, getFreshnessLabel } from "@/lib/constants/reviewIntervals";

interface FreshnessReviewProps {
  staleItems: TaskData[];
  onReviewed: () => void;
  onUpdate: (taskTitle: string) => void;
}

export default function FreshnessReview({
  staleItems,
  onReviewed,
  onUpdate,
}: FreshnessReviewProps) {
  const [confirmedItems, setConfirmedItems] = useState<Set<string>>(new Set());

  const handleConfirm = (taskTitle: string) => {
    reviewTaskData(taskTitle);
    setConfirmedItems((prev) => {
      const next = new Set(prev);
      next.add(taskTitle);
      return next;
    });
  };

  const allConfirmed = staleItems.every((item) =>
    confirmedItems.has(item.taskTitle)
  );

  if (allConfirmed) {
    return (
      <div className="bg-sage/10 border border-sage/30 rounded-[14px] px-5 py-4 text-center">
        <div className="font-sans text-sm font-semibold text-sage mb-1">
          All items reviewed
        </div>
        <div className="font-sans text-xs text-slateMid">
          Everything is up to date.
        </div>
        <button
          onClick={onReviewed}
          className="mt-3 font-sans text-sm font-semibold text-ocean hover:text-oceanMid transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-coral mb-1">
        Review Stale Information
      </div>
      <p className="font-sans text-xs text-slateMid mb-2">
        Some information may be out of date. Confirm it&apos;s still accurate or
        update it.
      </p>
      {staleItems.map((item) => {
        const isConfirmed = confirmedItems.has(item.taskTitle);
        const freshness = getFreshnessStatus(
          item.toolName,
          item.lastReviewedAt,
          item.capturedAt
        );
        const label = getFreshnessLabel(
          item.toolName,
          item.lastReviewedAt,
          item.capturedAt
        );

        return (
          <div
            key={item.taskTitle}
            className={`bg-white border rounded-[12px] px-4 py-3 ${
              isConfirmed
                ? "border-sage/40 opacity-60"
                : freshness === "stale"
                ? "border-coral/40"
                : "border-amber/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-sans text-sm font-semibold text-slate truncate">
                  {item.taskTitle}
                </div>
                <div className="font-sans text-xs text-slateMid mt-0.5">
                  {label}
                </div>
              </div>
              {!isConfirmed && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleConfirm(item.taskTitle)}
                    className="bg-sage/10 hover:bg-sage/20 text-sage rounded-lg px-3 py-1.5 font-sans text-xs font-semibold transition-colors"
                  >
                    Still accurate
                  </button>
                  <button
                    onClick={() => onUpdate(item.taskTitle)}
                    className="bg-ocean/10 hover:bg-ocean/20 text-ocean rounded-lg px-3 py-1.5 font-sans text-xs font-semibold transition-colors"
                  >
                    Update
                  </button>
                </div>
              )}
              {isConfirmed && (
                <span className="font-sans text-xs text-sage font-semibold flex-shrink-0">
                  Confirmed
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

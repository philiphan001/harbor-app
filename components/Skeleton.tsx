// Reusable skeleton loading components for Harbor

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-sandDark/60 rounded ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/** Skeleton for a dashboard card (action items, briefing, etc.) */
export function CardSkeleton() {
  return (
    <div className="w-full bg-white border-2 border-sandDark rounded-[14px] px-5 py-5 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

/** Skeleton for the readiness score card */
export function ReadinessSkeleton() {
  return (
    <div className="w-full bg-white border-2 border-sandDark rounded-[14px] px-5 py-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for a task list item */
export function TaskSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-sandDark px-4 py-4 mb-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-2 h-2 rounded-full mt-2" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="w-6 h-6 rounded" />
      </div>
    </div>
  );
}

/** Full dashboard skeleton */
export function DashboardSkeleton() {
  return (
    <div className="px-5 py-6">
      <ReadinessSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

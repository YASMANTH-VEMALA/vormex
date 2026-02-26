'use client';

export function WeeklyGoalsSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden animate-pulse">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-neutral-700" />
          <div className="space-y-1">
            <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
      </div>
      <div className="px-4 py-3 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <div className="h-3 w-20 bg-gray-200 dark:bg-neutral-700 rounded" />
              <div className="h-3 w-12 bg-gray-200 dark:bg-neutral-700 rounded" />
            </div>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-neutral-700 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

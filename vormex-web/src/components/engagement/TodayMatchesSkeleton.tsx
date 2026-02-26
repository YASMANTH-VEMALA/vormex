'use client';

export function TodayMatchesSkeleton() {
  return (
    <div className="relative mb-4">
      <div className="flex items-center justify-between px-4 lg:px-0 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200 dark:bg-neutral-700 animate-pulse" />
          <div className="h-4 w-28 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden px-4 lg:px-0">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[200px] bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden animate-pulse"
          >
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-neutral-700" />
            </div>
            <div className="px-3 pb-3 space-y-2">
              <div className="h-4 w-24 mx-auto bg-gray-200 dark:bg-neutral-700 rounded" />
              <div className="h-3 w-16 mx-auto bg-gray-200 dark:bg-neutral-700 rounded" />
              <div className="h-8 w-full bg-gray-200 dark:bg-neutral-700 rounded-full mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

export function PeopleYouMayKnowSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden animate-pulse">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <div className="h-4 w-36 bg-gray-200 dark:bg-neutral-700 rounded" />
      </div>
      <div className="divide-y divide-gray-100 dark:divide-neutral-800">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
              <div className="h-3 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
            </div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-neutral-700 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
      <div className="h-10 bg-gray-100 dark:bg-neutral-800/50" />
    </div>
  );
}

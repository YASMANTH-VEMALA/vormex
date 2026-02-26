'use client';

export function PersonCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden animate-pulse">
      <div className="h-24 bg-gray-200 dark:bg-neutral-800" />
      <div className="relative px-4 pb-4">
        <div className="absolute -top-10 left-4 w-20 h-20 rounded-full border-4 border-white dark:border-neutral-900 bg-gray-200 dark:bg-neutral-700" />
        <div className="pt-12 space-y-2">
          <div className="h-5 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="h-4 w-full bg-gray-200 dark:bg-neutral-700 rounded mt-3" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="flex gap-2 mt-3">
            <div className="h-6 w-16 bg-gray-200 dark:bg-neutral-700 rounded-full shrink-0" />
            <div className="h-6 w-20 bg-gray-200 dark:bg-neutral-700 rounded-full shrink-0" />
            <div className="h-6 w-14 bg-gray-200 dark:bg-neutral-700 rounded-full shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

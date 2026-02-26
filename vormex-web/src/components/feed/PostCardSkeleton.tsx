'use client';

export function PostCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden animate-pulse">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
        <div className="mt-4 h-48 bg-gray-200 dark:bg-neutral-700 rounded-lg" />
        <div className="mt-4 flex gap-6">
          <div className="h-4 w-16 bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-neutral-700 rounded" />
          <div className="h-4 w-14 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>
    </div>
  );
}

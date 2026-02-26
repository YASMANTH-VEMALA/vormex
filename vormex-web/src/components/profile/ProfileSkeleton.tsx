'use client';

import { motion } from 'framer-motion';

// Skeleton component for loading states
function Skeleton({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`bg-gray-100 dark:bg-neutral-800 rounded ${className}`}
    />
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Banner Skeleton */}
      <Skeleton className="h-48 md:h-64 w-full rounded-b-2xl" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 pb-20">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-8">
          <Skeleton className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white dark:border-neutral-900" />
          <div className="flex-1 mt-2 sm:mt-8 space-y-3 w-full">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-72" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-3 mt-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* About Skeleton */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Activity Calendar Skeleton */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex gap-1">
              {[...Array(52)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {[...Array(7)].map((_, j) => (
                    <Skeleton key={j} className="w-3 h-3 rounded-sm" />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Skills Skeleton */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="flex flex-wrap gap-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Projects Skeleton */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-neutral-800/50 rounded-lg border border-gray-300 dark:border-neutral-700/50 overflow-hidden">
                  <Skeleton className="aspect-video" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Skeleton */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


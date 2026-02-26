'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-neutral-950 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md dark:shadow-neutral-800 p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Upload
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Share posts, reels, and articles with your network.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


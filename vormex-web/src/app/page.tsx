'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Feed } from '@/components/feed';

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <Feed />
      </div>
    </ProtectedRoute>
  );
}

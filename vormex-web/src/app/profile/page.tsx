'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProfilePage, ProfileSkeleton } from '@/components/profile';

export default function OwnProfilePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfilePage />
      </Suspense>
    </ProtectedRoute>
  );
}

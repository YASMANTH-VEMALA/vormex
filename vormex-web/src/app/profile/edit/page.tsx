'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProfilePage, ProfileSkeleton } from '@/components/profile';

/**
 * Profile edit page - shows own profile with edit modal open.
 * Used by "Add Bio", "Add Photo" and similar prompts from the feed.
 * Must be a separate route so /profile/edit doesn't get caught by /profile/[id].
 */
export default function ProfileEditPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfilePage openEditModalOnMount />
      </Suspense>
    </ProtectedRoute>
  );
}

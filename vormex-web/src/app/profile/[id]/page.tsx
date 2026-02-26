'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ProfilePage, ProfileSkeleton } from '@/components/profile';

function ProfileContent() {
  const params = useParams();
  const userId = params.id as string;

  return <ProfilePage userId={userId} />;
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}


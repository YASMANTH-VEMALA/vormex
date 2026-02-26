'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { FindPeople } from '@/components/find-people';

export default function FindPeoplePage() {
  return (
    <ProtectedRoute>
      <FindPeople />
    </ProtectedRoute>
  );
}


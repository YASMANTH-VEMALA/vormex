'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Notifications } from '@/components/notifications';

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <Notifications />
    </ProtectedRoute>
  );
}

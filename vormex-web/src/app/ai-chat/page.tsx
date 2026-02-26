'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AIChatPage } from '@/components/ai-chat';

export default function AIAssistantPage() {
  return (
    <ProtectedRoute>
      <AIChatPage />
    </ProtectedRoute>
  );
}

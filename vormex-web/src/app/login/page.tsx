'use client';

import { AuthPage } from '@/components/auth/AuthPage';
import { AuthRedirect } from '@/components/auth/AuthRedirect';

export default function LoginPage() {
  return (
    <AuthRedirect>
      <AuthPage />
    </AuthRedirect>
  );
}

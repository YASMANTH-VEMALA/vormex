'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api/auth';
import { handleApiError } from '@/lib/utils/errorHandler';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';
import '../login/login.css';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Verification token is missing');
        setIsLoading(false);
        return;
      }

      try {
        await authAPI.verifyEmail(token);
        setSuccess('Email verified successfully! You can now login.');
        setTimeout(() => router.push('/login'), 2000);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="auth-page-wrapper">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="main" style={{ maxWidth: '500px', width: '100%', minWidth: 'auto' }}>
        <div className="form">
          <h2 className="form_title title">Email Verification</h2>
          {isLoading && <p className="description">Verifying your email...</p>}
          {error && (
            <>
              <div className="error-message">{error}</div>
              <Link href="/login" className="form__link" style={{ marginTop: '20px' }}>
                Back to Login
              </Link>
            </>
          )}
          {success && (
            <>
              <div className="success-message">{success}</div>
              <p className="description">Redirecting to login...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="auth-page-wrapper">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="main" style={{ maxWidth: '500px', width: '100%', minWidth: 'auto' }}>
          <div className="form">
            <h2 className="form_title title">Email Verification</h2>
            <p className="description">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

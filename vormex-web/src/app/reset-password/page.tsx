'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api/auth';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { handleApiError } from '@/lib/utils/errorHandler';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';
import '../login/login.css';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Reset token is missing');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate passwords
      const validationResult = resetPasswordSchema.safeParse({
        newPassword,
        confirmPassword,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        setError(firstError.message);
        setIsLoading(false);
        return;
      }

      await authAPI.resetPassword(token, newPassword);
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page-wrapper">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="main" style={{ maxWidth: '500px', width: '100%', minWidth: 'auto' }}>
          <div className="form">
            <h2 className="form_title title">Reset Password</h2>
            <div className="error-message">Reset token is missing. Please use the link from your email.</div>
            <Link href="/forgot-password" className="form__link" style={{ marginTop: '20px' }}>
              Request New Reset Link
            </Link>
            <Link href="/login" className="form__link" style={{ marginTop: '10px' }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-wrapper">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="main" style={{ maxWidth: '500px', width: '100%', minWidth: 'auto' }}>
        <form className="form" onSubmit={handleResetPassword}>
          <h2 className="form_title title">Reset Password</h2>
          <input
            className="form__input"
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <input
            className="form__input"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <button type="submit" className="button" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
          <Link href="/login" className="form__link" style={{ marginTop: '20px' }}>
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="auth-page-wrapper">
        <div className="main" style={{ maxWidth: '500px', width: '100%', minWidth: 'auto' }}>
          <div className="form">
            <h2 className="form_title title">Reset Password</h2>
            <p className="description">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}


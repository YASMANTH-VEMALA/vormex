'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api/auth';
import { useAuthContext } from '@/lib/auth/authContext';
import { setPendingUser } from '@/lib/auth/authHelpers';
import { handleApiError } from '@/lib/utils/errorHandler';
import '../../../login/login.css';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        // Check for OAuth errors
        if (errorParam) {
          setError(`Google OAuth error: ${errorParam}`);
          setIsLoading(false);
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        // Validate state (CSRF protection)
        const storedState = sessionStorage.getItem('oauth_state');
        if (!state || state !== storedState) {
        setError('Invalid state parameter. Please try again.');
        setIsLoading(false);
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_code_verifier');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!code) {
        setError('Authorization code not found. Please try again.');
        setIsLoading(false);
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_code_verifier');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

        // Exchange authorization code for tokens using PKCE via our API route
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
        
        if (!codeVerifier) {
          throw new Error('Code verifier not found. Please try signing in again.');
        }

        // Use our API route to exchange code for tokens (server-side, secure)
        const tokenResponse = await fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            codeVerifier: codeVerifier,
            redirectUri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.error_description || 'Failed to exchange authorization code');
        }

        const tokenData = await tokenResponse.json();

        // Extract id_token from the response
        const idToken = tokenData.idToken;

        if (!idToken) {
          throw new Error('ID token not found in token response');
        }

        // Send id_token to backend
        const authResponse = await authAPI.googleSignIn(idToken);

        setAuth(authResponse);
        setPendingUser(authResponse.user);

        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_code_verifier');

        window.location.replace('/');
      } catch (err) {
        console.error('Google OAuth callback error:', err);
        setError(handleApiError(err));
        setIsLoading(false);
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_code_verifier');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, setAuth]);

  return (
    <div className="auth-page-wrapper">
      <div className="main" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="form">
          <h2 className="form_title title">Signing in with Google...</h2>
          {isLoading && (
            <p className="description" style={{ marginTop: '20px' }}>
              Please wait while we complete your sign-in.
            </p>
          )}
          {error && (
            <>
              <div className="error-message" style={{ marginTop: '20px' }}>
                {error}
              </div>
              <p className="description" style={{ marginTop: '10px' }}>
                Redirecting to login page...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="auth-page-wrapper">
        <div className="main" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="form">
            <h2 className="form_title title">Signing in with Google...</h2>
            <p className="description" style={{ marginTop: '20px' }}>
              Loading...
            </p>
          </div>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}


'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { authAPI } from '@/lib/api/auth';
import { registerSchema, loginSchema } from '@/lib/validations/auth';
import { handleApiError } from '@/lib/utils/errorHandler';
import { GOOGLE_CLIENT_ID } from '@/lib/utils/constants';
import { LoginSection } from './LoginSection';
import { SignupSection } from './SignupSection';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import '@/app/login/login.css';

export function AuthPage() {
  const router = useRouter();
  const { login: loginUser, register: registerUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');

  // Helper function to reset swipe buttons by ID
  const resetSwipeButtonById = (buttonId: string) => {
    const container = document.getElementById(buttonId);
    if (!container) return;
    
    const slider = container.querySelector('.swipe-button-slider') as HTMLElement;
    const text = container.querySelector('.swipe-button-text') as HTMLElement;
    
    if (slider && text) {
      // Reset immediately for better UX
      container.classList.remove('submitted', 'active');
      slider.style.left = '2px';
      text.style.opacity = '1';
    }
  };

  // Generate PKCE code verifier
  const generateCodeVerifier = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  // Generate PKCE code challenge from verifier
  const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  // Google OAuth2.0 redirect login with PKCE
  const handleGoogleLogin = async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID is not configured. Please check your environment variables.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate state for CSRF protection
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('oauth_state', state);

      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      sessionStorage.setItem('oauth_code_verifier', codeVerifier);

      // Build Google OAuth URL with PKCE
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const scope = 'openid email profile';
      const responseType = 'code';
      
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: responseType,
        scope: scope,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'consent',
      });

      // Redirect to Google OAuth consent page
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } catch (err) {
      setError('Failed to initiate Google sign-in. Please try again.');
      setIsLoading(false);
    }
  };


  // Handle form switch animation
  const handleSwitch = () => {
    const switchCtn = document.getElementById('switch-cnt');
    const switchC1 = document.getElementById('switch-c1');
    const switchC2 = document.getElementById('switch-c2');
    const switchCircle = document.querySelectorAll('.switch__circle');
    const aContainer = document.getElementById('a-container');
    const bContainer = document.getElementById('b-container');

    if (!switchCtn || !switchC1 || !switchC2 || !aContainer || !bContainer) return;

    // Reset swipe buttons when switching
    resetSwipeButtonById('swipe-btn-signup');
    resetSwipeButtonById('swipe-btn-signin');

    switchCtn.classList.add('is-gx');
    setTimeout(() => {
      switchCtn.classList.remove('is-gx');
    }, 1500);

    switchCtn.classList.toggle('is-txr');
    switchCircle.forEach((circle) => circle.classList.toggle('is-txr'));

    switchC1.classList.toggle('is-hidden');
    switchC2.classList.toggle('is-hidden');
    aContainer.classList.toggle('is-txl');
    bContainer.classList.toggle('is-txl');
    bContainer.classList.toggle('is-z200');

    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
    // Reset form fields when switching
    setPassword('');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formId = (e.currentTarget as HTMLFormElement).id;
    const isSignUpForm = formId === 'a-form';

    try {
      if (isSignUpForm) {
        // Validate signup form
        const validationResult = registerSchema.safeParse({
          name,
          email,
          password,
          college: college || undefined,
          branch: branch || undefined,
        });

        if (!validationResult.success) {
          const firstError = validationResult.error.issues[0];
          setError(firstError.message);
          setIsLoading(false);
          resetSwipeButtonById('swipe-btn-signup');
          return;
        }

        const authResponse = await registerUser({
          email,
          password,
          name,
          college: college || undefined,
          branch: branch || undefined,
        });

        // Show success message about email verification
        setSuccess('Registration successful! Please check your email to verify your account.');
        
        // Reset swipe button after successful signup
        setTimeout(() => {
          resetSwipeButtonById('swipe-btn-signup');
        }, 1000);
        
        // Don't redirect immediately - user needs to verify email
        if (authResponse.user.isVerified) {
          setTimeout(() => router.push('/'), 2000);
        }
      } else {
        // Validate login form
        const validationResult = loginSchema.safeParse({ email, password });

        if (!validationResult.success) {
          const firstError = validationResult.error.issues[0];
          setError(firstError.message);
          setIsLoading(false);
          resetSwipeButtonById('swipe-btn-signin');
          return;
        }

        try {
          await loginUser({ email, password });

          // Check if email verification is required (this should be handled by the API)
          // But we'll check the user state after login
          // Redirect to home
          router.push('/');
        } catch (loginErr) {
          const errorMessage = handleApiError(loginErr);
          setError(errorMessage);
          setIsLoading(false);
          resetSwipeButtonById('swipe-btn-signin');
          return;
        }
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setIsLoading(false);
      
      // Always reset swipe button on any error
      if (isSignUpForm) {
        resetSwipeButtonById('swipe-btn-signup');
      } else {
        resetSwipeButtonById('swipe-btn-signin');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="main">
        {/* Sign Up Container */}
        <SignupSection
          name={name}
          email={email}
          password={password}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
          onGoogleLogin={handleGoogleLogin}
          isLoading={isLoading}
          error={error}
          success={success}
        />

        {/* Sign In Container */}
        <LoginSection
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
          onGoogleLogin={handleGoogleLogin}
          isLoading={isLoading}
          error={error}
          success={success}
        />

        {/* Switch Container */}
        <div className="switch" id="switch-cnt">
          <div className="switch__circle"></div>
          <div className="switch__circle switch__circle--t"></div>
          <div className="switch__container" id="switch-c1">
            <h2 className="switch__title title">Hello Friend !</h2>
            <p className="switch__description description">
              Enter your personal details and start journey with us
            </p>
            <button className="switch__button button switch-btn" onClick={handleSwitch}>
              SIGN IN
            </button>
          </div>
          <div className="switch__container is-hidden" id="switch-c2">
            <h2 className="switch__title title">Welcome Back !</h2>
            <p className="switch__description description">
              To keep connected with us please login with your personal info
            </p>
            <button className="switch__button button switch-btn" onClick={handleSwitch}>
              SIGN UP
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="page-footer">
        <a href="#" className="play-store-btn">
          <svg className="play-store-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="m21.762,9.942L4.67.378c-.721-.466-1.635-.504-2.393-.099-.768.411-1.246,1.208-1.246,2.08v19.282c0,.872.477,1.668,1.246,2.079.755.404,1.668.37,2.393-.098l17.092-9.564c.756-.423,1.207-1.192,1.207-2.058s-.451-1.635-1.207-2.058Zm-5.746-1.413l-2.36,2.36L5.302,2.534l10.714,5.995ZM2.604,21.906V2.094l9.941,9.906L2.604,21.906Zm2.698-.439l8.355-8.355,2.36,2.36-10.714,5.995Zm15.692-8.78l-3.552,1.987-2.674-2.674,2.674-2.674,3.552,1.987c.363.203.402.548.402.686s-.039.483-.402.686Z" />
          </svg>
          <div className="play-store-btn-content">
            <span className="play-store-btn-small">GET IT ON</span>
            <span className="play-store-btn-large">Google Play</span>
          </div>
        </a>
        <a href="#" className="play-store-btn">
          <svg className="play-store-icon" viewBox="0 0 24 24" fill="currentColor">
            <g>
              <path d="M18.546,12.763c0.024-1.87,1.004-3.597,2.597-4.576c-1.009-1.442-2.64-2.323-4.399-2.378    c-1.851-0.194-3.645,1.107-4.588,1.107c-0.961,0-2.413-1.088-3.977-1.056C6.122,5.927,4.25,7.068,3.249,8.867    c-2.131,3.69-0.542,9.114,1.5,12.097c1.022,1.461,2.215,3.092,3.778,3.035c1.529-0.063,2.1-0.975,3.945-0.975    c1.828,0,2.364,0.975,3.958,0.938c1.64-0.027,2.674-1.467,3.66-2.942c0.734-1.041,1.299-2.191,1.673-3.408    C19.815,16.788,18.548,14.879,18.546,12.763z" />
              <path d="M15.535,3.847C16.429,2.773,16.87,1.393,16.763,0c-1.366,0.144-2.629,0.797-3.535,1.829    c-0.895,1.019-1.349,2.351-1.261,3.705C13.352,5.548,14.667,4.926,15.535,3.847z" />
            </g>
          </svg>
          <div className="play-store-btn-content">
            <span className="play-store-btn-small">Download on the</span>
            <span className="play-store-btn-large">App Store</span>
          </div>
        </a>
      </div>
    </div>
  );
}


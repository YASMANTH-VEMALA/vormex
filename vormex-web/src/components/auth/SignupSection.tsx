'use client';

import React, { useRef, useEffect } from 'react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { OnboardingSocialProof } from './OnboardingSocialProof';

interface SignupSectionProps {
  name: string;
  email: string;
  password: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onGoogleLogin: () => void;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  onSwipeToLogin?: () => void;
}

export function SignupSection({
  name,
  email,
  password,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleLogin,
  isLoading,
  error,
  success,
}: SignupSectionProps) {
  const swipeButtonRef = useRef<HTMLDivElement>(null);

  // Setup swipe button functionality
  useEffect(() => {
    const setupSwipeButton = (container: HTMLDivElement) => {
      const slider = container.querySelector('.swipe-button-slider') as HTMLElement;
      const text = container.querySelector('.swipe-button-text') as HTMLElement;
      if (!slider || !text) return;

      let isDragging = false;
      let startX = 0;

      const onMouseDown = (e: MouseEvent | TouchEvent) => {
        if (container.classList.contains('submitted')) return;
        isDragging = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        startX = clientX - slider.offsetLeft;
        container.classList.add('active');
      };

      const onMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const x = clientX - startX;
        const maxMove = container.offsetWidth - slider.offsetWidth - 4;

        if (x >= 0 && x <= maxMove) {
          slider.style.left = `${x + 2}px`;
          text.style.opacity = (1 - x / maxMove).toString();
        } else if (x > maxMove) {
          slider.style.left = `${maxMove + 2}px`;
          text.style.opacity = '0';
        }
      };

      const onMouseUp = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        isDragging = false;
        container.classList.remove('active');

        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
        const x = clientX - startX;
        const maxMove = container.offsetWidth - slider.offsetWidth - 4;

        if (x >= maxMove - 10) {
          container.classList.add('submitted');
          slider.style.left = '';
          const form = document.getElementById('a-form') as HTMLFormElement;
          if (form) {
            // Check if form is valid before submitting
            if (!form.checkValidity()) {
              // Form has validation errors, reset button immediately
              container.classList.remove('submitted');
              slider.style.left = '2px';
              text.style.opacity = '1';
              form.reportValidity();
            } else {
              // Form is valid, submit it
              form.requestSubmit();
            }
          }
        } else {
          slider.style.left = '2px';
          text.style.opacity = '1';
        }
      };

      slider.addEventListener('mousedown', onMouseDown);
      slider.addEventListener('touchstart', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('touchmove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('touchend', onMouseUp);

      return () => {
        slider.removeEventListener('mousedown', onMouseDown);
        slider.removeEventListener('touchstart', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('touchend', onMouseUp);
      };
    };

    if (swipeButtonRef.current) {
      const cleanup = setupSwipeButton(swipeButtonRef.current);
      return cleanup;
    }
  }, []);

  const resetSwipeButton = () => {
    if (!swipeButtonRef.current) return;
    const container = swipeButtonRef.current;
    const slider = container.querySelector('.swipe-button-slider') as HTMLElement;
    const text = container.querySelector('.swipe-button-text') as HTMLElement;
    
    if (slider && text) {
      // Reset immediately without setTimeout for better UX
      container.classList.remove('submitted', 'active');
      slider.style.left = '2px';
      text.style.opacity = '1';
    }
  };

  // Reset swipe button on error or when form validation fails
  useEffect(() => {
    if (error) {
      resetSwipeButton();
    }
  }, [error]);

  return (
    <div className="container a-container" id="a-container">
      <form id="a-form" className="form" onSubmit={onSubmit}>
        <h2 className="form_title title">Create Account</h2>
        <OnboardingSocialProof />
        <GoogleSignInButton onClick={onGoogleLogin} disabled={isLoading} text="Sign up with Google" />
        <span className="form__span">or use email for registration</span>
        <input
          className="form__input"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const form = document.getElementById('a-form') as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            }
          }}
          required
        />
        <input
          className="form__input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const form = document.getElementById('a-form') as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            }
          }}
          required
        />
        <input
          className="form__input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const form = document.getElementById('a-form') as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            }
          }}
          required
          minLength={8}
        />
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <div className="swipe-button-container" id="swipe-btn-signup" ref={swipeButtonRef}>
          <div className="swipe-button-text">SWIPE TO SIGN UP</div>
          <div className="swipe-button-slider">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="none" d="M0 0h24v24H0z" />
              <path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </form>
    </div>
  );
}


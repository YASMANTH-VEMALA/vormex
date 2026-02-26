'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { onboardingAPI } from '@/lib/api/onboarding';
import { useAuthContext } from '@/lib/auth/authContext';
import StepProfile from './steps/StepProfile';
import StepInterests from './steps/StepInterests';
import StepMatches from './steps/StepMatches';

const STEPS = [
  { id: 'profile', title: 'About You', subtitle: 'Help us find your people' },
  { id: 'interests', title: 'Your Interests', subtitle: 'What are you into?' },
  { id: 'matches', title: 'Your Circle', subtitle: 'People matched for you' },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const { updateUser, user } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [stepData, setStepData] = useState<Record<number, Record<string, unknown>>>({});

  const handleStepComplete = useCallback(async (step: number, data: Record<string, unknown>) => {
    setSaving(true);
    try {
      setStepData(prev => ({ ...prev, [step]: data }));
      await onboardingAPI.updateStep(step, data);

      if (step < STEPS.length - 2) {
        setDirection(1);
        setCurrentStep(step + 1);
      } else if (step === STEPS.length - 2) {
        await onboardingAPI.completeOnboarding();
        setDirection(1);
        setCurrentStep(step + 1);
      }
    } catch (error) {
      console.error('Failed to save step:', error);
    } finally {
      setSaving(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleFinish = useCallback(() => {
    if (user) {
      updateUser({ ...user, onboardingCompleted: true } as any);
    }
    router.replace('/');
  }, [router, user, updateUser]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="px-5 pt-5 pb-2 flex items-center justify-between max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-black font-bold text-xs">V</span>
          </div>
          <span className="text-xs text-neutral-400 font-medium tracking-wide uppercase">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
        {currentStep > 0 && currentStep < STEPS.length - 1 && (
          <button onClick={handleBack} className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">
            Back
          </button>
        )}
      </header>

      {/* Progress bar */}
      <div className="px-5 max-w-lg mx-auto w-full">
        <div className="h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-black dark:bg-white rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step content - pb-24 ensures button stays above any safe area / future footer */}
      <div className="flex-1 flex flex-col px-5 py-6 pb-24 max-w-lg mx-auto w-full overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full flex-1 flex flex-col"
          >
            {/* Step header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {STEPS[currentStep].title}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                {STEPS[currentStep].subtitle}
              </p>
            </div>

            {currentStep === 0 && (
              <StepProfile
                initialData={stepData[0]}
                onComplete={(data) => handleStepComplete(0, data)}
                saving={saving}
                userName={user?.name || ''}
                userCollege={user?.college || ''}
              />
            )}
            {currentStep === 1 && (
              <StepInterests
                initialData={stepData[1]}
                onComplete={(data) => handleStepComplete(1, data)}
                saving={saving}
              />
            )}
            {currentStep === 2 && (
              <StepMatches onFinish={handleFinish} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

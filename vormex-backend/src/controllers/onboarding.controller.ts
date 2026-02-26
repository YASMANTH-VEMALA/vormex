import { Response } from 'express';
import { AuthenticatedRequest, ErrorResponse } from '../types/auth.types';
import { prisma } from '../config/prisma';

type OnboardingData = {
  primaryGoal?: string | null;
  secondaryGoals?: string[];
  wantToLearn?: string[];
  canTeach?: string[];
  lookingFor?: string[];
  availability?: string | null;
  hoursPerWeek?: number | null;
  communicationPref?: string | null;
  college?: string | null;
  interests?: string[];
};

/**
 * GET /api/onboarding
 * Get current user's onboarding data
 */
export const getOnboarding = async (
  req: AuthenticatedRequest,
  res: Response<{ onboarding: OnboardingData & { id: string; userId: string; currentStep: number } } | ErrorResponse>
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = String(req.user.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        college: true,
        interests: true,
        onboardingData: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const od = (user.onboardingData as OnboardingData) || {};
    const currentStep = user.onboardingCompleted ? 2 : 0;

    res.status(200).json({
      onboarding: {
        id: user.id,
        userId: user.id,
        isCompleted: user.onboardingCompleted,
        completedAt: null,
        currentStep,
        primaryGoal: od.primaryGoal ?? null,
        secondaryGoals: od.secondaryGoals ?? [],
        wantToLearn: od.wantToLearn ?? [],
        canTeach: od.canTeach ?? [],
        lookingFor: od.lookingFor ?? [],
        availability: od.availability ?? null,
        hoursPerWeek: od.hoursPerWeek ?? null,
        communicationPref: od.communicationPref ?? null,
      },
    });
  } catch (error) {
    console.error('Get onboarding error:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding data' });
  }
};

/**
 * POST /api/onboarding/step
 * Update onboarding step data
 */
export const updateStep = async (
  req: AuthenticatedRequest,
  res: Response<{ onboarding: OnboardingData & { id: string; userId: string; currentStep: number }; nextStep: number } | ErrorResponse>
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = String(req.user.userId);
    const { step, data } = req.body as { step: number; data: Record<string, unknown> };

    if (typeof step !== 'number' || !data || typeof data !== 'object') {
      res.status(400).json({ error: 'Step and data are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        college: true,
        interests: true,
        onboardingData: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const existingOd = (user.onboardingData as OnboardingData) || {};

    // Step 0: profile - college, primaryGoal, lookingFor, secondaryGoals
    if (step === 0) {
      if (data.college != null) existingOd.college = data.college as string;
      existingOd.primaryGoal = (data.primaryGoal as string) ?? existingOd.primaryGoal;
      existingOd.lookingFor = (data.lookingFor as string[]) ?? existingOd.lookingFor ?? [];
      existingOd.secondaryGoals = (data.secondaryGoals as string[]) ?? existingOd.secondaryGoals ?? [];
    }

    // Step 1: interests - interests, canTeach, wantToLearn
    if (step === 1) {
      existingOd.canTeach = (data.canTeach as string[]) ?? existingOd.canTeach ?? [];
      existingOd.wantToLearn = (data.wantToLearn as string[]) ?? existingOd.wantToLearn ?? [];
    }

    const userUpdate: { onboardingData: OnboardingData; college?: string; interests?: string[] } = {
      onboardingData: existingOd,
    };
    if (step === 0 && data.college != null) userUpdate.college = String(data.college);
    if (step === 1 && Array.isArray(data.interests)) userUpdate.interests = data.interests as string[];

    await prisma.user.update({
      where: { id: userId },
      data: userUpdate,
    });

    const nextStep = step + 1;
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        college: true,
        interests: true,
        onboardingData: true,
        onboardingCompleted: true,
      },
    });

    if (!updatedUser) {
      res.status(500).json({ error: 'Failed to fetch updated data' });
      return;
    }

    const od = (updatedUser.onboardingData as OnboardingData) || {};
    res.status(200).json({
      onboarding: {
        id: updatedUser.id,
        userId: updatedUser.id,
        isCompleted: updatedUser.onboardingCompleted,
        completedAt: null,
        currentStep: nextStep,
        primaryGoal: od.primaryGoal ?? null,
        secondaryGoals: od.secondaryGoals ?? [],
        wantToLearn: od.wantToLearn ?? [],
        canTeach: od.canTeach ?? [],
        lookingFor: od.lookingFor ?? [],
        availability: od.availability ?? null,
        hoursPerWeek: od.hoursPerWeek ?? null,
        communicationPref: od.communicationPref ?? null,
      },
      nextStep,
    });
  } catch (error) {
    console.error('Update onboarding step error:', error);
    res.status(500).json({ error: 'Failed to update onboarding step' });
  }
};

/**
 * POST /api/onboarding/complete
 * Mark onboarding as completed
 */
export const completeOnboarding = async (
  req: AuthenticatedRequest,
  res: Response<{ onboarding: OnboardingData & { id: string; userId: string; currentStep: number }; message: string } | ErrorResponse>
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = String(req.user.userId);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
      select: {
        id: true,
        college: true,
        interests: true,
        onboardingData: true,
        onboardingCompleted: true,
      },
    });

    const od = (user.onboardingData as OnboardingData) || {};
    res.status(200).json({
      onboarding: {
        id: user.id,
        userId: user.id,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        currentStep: 2,
        primaryGoal: od.primaryGoal ?? null,
        secondaryGoals: od.secondaryGoals ?? [],
        wantToLearn: od.wantToLearn ?? [],
        canTeach: od.canTeach ?? [],
        lookingFor: od.lookingFor ?? [],
        availability: od.availability ?? null,
        hoursPerWeek: od.hoursPerWeek ?? null,
        communicationPref: od.communicationPref ?? null,
      },
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
};

/**
 * GET /api/onboarding/matches
 * Get initial matches for the user (simplified - returns empty or uses people discovery)
 */
export const getOnboardingMatches = async (
  req: AuthenticatedRequest,
  res: Response<{ matches: unknown[]; totalCandidates: number } | ErrorResponse>
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = String(req.user.userId);

    // Return empty matches for now - the frontend StepMatches handles this
    res.status(200).json({
      matches: [],
      totalCandidates: 0,
    });
  } catch (error) {
    console.error('Get onboarding matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
};

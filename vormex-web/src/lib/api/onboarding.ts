import apiClient from './client';

export interface OnboardingData {
  id: string;
  userId: string;
  isCompleted: boolean;
  completedAt: string | null;
  currentStep: number;
  primaryGoal: string | null;
  secondaryGoals: string[];
  wantToLearn: string[];
  canTeach: string[];
  lookingFor: string[];
  availability: string | null;
  hoursPerWeek: number | null;
  communicationPref: string | null;
}

export interface MatchResult {
  user: {
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
    headline: string | null;
    college: string | null;
    branch: string | null;
    graduationYear: number | null;
    interests: string[];
    bio: string | null;
    githubConnected: boolean;
    xpBalance: number;
    onboarding: {
      primaryGoal: string | null;
      lookingFor: string[];
      wantToLearn: string[];
      canTeach: string[];
    } | null;
    stats: {
      connectionsCount: number;
      xp: number;
      level: number;
    } | null;
  };
  score: number;
  maxScore: number;
  matchPercentage: number;
  reasons: string[];
}

export const onboardingAPI = {
  getOnboarding: async (): Promise<{ onboarding: OnboardingData }> => {
    return apiClient.get('/onboarding') as Promise<{ onboarding: OnboardingData }>;
  },

  updateStep: async (step: number, data: Record<string, unknown>): Promise<{ onboarding: OnboardingData; nextStep: number }> => {
    return apiClient.post('/onboarding/step', { step, data }) as Promise<{ onboarding: OnboardingData; nextStep: number }>;
  },

  completeOnboarding: async (): Promise<{ onboarding: OnboardingData; message: string }> => {
    return apiClient.post('/onboarding/complete') as Promise<{ onboarding: OnboardingData; message: string }>;
  },

  getInitialMatches: async (): Promise<{ matches: MatchResult[]; totalCandidates: number }> => {
    return apiClient.get('/onboarding/matches') as Promise<{ matches: MatchResult[]; totalCandidates: number }>;
  },
};

import apiClient from './client';

export interface CodingChallenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  points: number;
  timeLimit: number;
  memoryLimit: number;
  starterCode: Record<string, string>;
  testCases: {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }[];
  hints: string[];
  tags: string[];
  solveCount: number;
  attemptCount: number;
  createdAt: string;
  userSubmission?: ChallengeSubmission;
}

export interface ChallengeSubmission {
  id: string;
  userId: string;
  challengeId: string;
  code: string;
  language: string;
  status: string;
  score: number;
  executionTime?: number;
  memoryUsed?: number;
  testResults?: Record<string, unknown>;
  submittedAt: string;
}

export interface ChallengeLeaderboard {
  rank: number;
  user: {
    id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
  totalPoints: number;
  solvedCount: number;
}

export interface ChallengeStats {
  totalSolved: number;
  totalPoints: number;
  streak: number;
  byDifficulty: Record<string, number>;
  byCategory: Record<string, number>;
}

// Get all challenges
export const getChallenges = async (filters?: {
  category?: string;
  difficulty?: string;
  search?: string;
}): Promise<CodingChallenge[]> => {
  const response = await apiClient.get('/challenges', { params: filters });
  return response.data;
};

// Get challenge by slug
export const getChallenge = async (slug: string): Promise<CodingChallenge> => {
  const response = await apiClient.get(`/challenges/${slug}`);
  return response.data;
};

// Get daily challenge
export const getDailyChallenge = async (): Promise<CodingChallenge> => {
  const response = await apiClient.get('/challenges/daily');
  return response.data;
};

// Get challenge categories
export const getChallengeCategories = async (): Promise<string[]> => {
  const response = await apiClient.get('/challenges/categories');
  return response.data;
};

// Submit solution
export const submitSolution = async (challengeId: string, data: {
  code: string;
  language: string;
}): Promise<ChallengeSubmission> => {
  const response = await apiClient.post(`/challenges/${challengeId}/submit`, data);
  return response.data;
};

// Get my submissions
export const getMySubmissions = async (challengeId?: string): Promise<ChallengeSubmission[]> => {
  const response = await apiClient.get('/challenges/submissions/me', { params: { challengeId } });
  return response.data;
};

// Get leaderboard
export const getChallengeLeaderboard = async (filters?: {
  category?: string;
  period?: string;
  limit?: number;
}): Promise<ChallengeLeaderboard[]> => {
  const response = await apiClient.get('/challenges/leaderboard', { params: filters });
  return response.data;
};

// Get my stats
export const getMyChallengeStats = async (): Promise<ChallengeStats> => {
  const response = await apiClient.get('/challenges/stats/me');
  return response.data;
};

// Run code (test without submitting)
export const runCode = async (challengeId: string, data: {
  code: string;
  language: string;
}) => {
  const response = await apiClient.post(`/challenges/${challengeId}/run`, data);
  return response.data;
};

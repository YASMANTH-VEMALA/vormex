import apiClient from './client';

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalXpEarned: number;
  milestones: {
    signups: number;
    profileCompleted: number;
    firstPosts: number;
    connections: number;
  };
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referred: {
    id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
  signupXpClaimed: boolean;
  profileCompleted: boolean;
  firstPostCompleted: boolean;
  connectionsCompleted: boolean;
  createdAt: string;
}

export interface ReferralLeaderboard {
  rank: number;
  user: {
    id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
  referralCount: number;
}

// Get my referral code
export const getMyReferralCode = async (): Promise<string> => {
  const response = await apiClient.get('/referrals/code');
  return response.data;
};

// Apply a referral code
export const applyReferralCode = async (code: string) => {
  const response = await apiClient.post('/referrals/apply', { code });
  return response;
};

// Get my referral stats
export const getReferralStats = async (): Promise<ReferralStats> => {
  const response = await apiClient.get('/referrals/stats');
  return response.data;
};

// Get my referrals list
export const getMyReferrals = async (): Promise<Referral[]> => {
  const response = await apiClient.get('/referrals/list');
  return response.data;
};

// Get referral leaderboard
export const getReferralLeaderboard = async (limit?: number): Promise<ReferralLeaderboard[]> => {
  const response = await apiClient.get('/referrals/leaderboard', { params: { limit } });
  return response.data;
};

// Get share links
export const getShareLinks = async () => {
  const response = await apiClient.get('/referrals/share');
  return response.data;
};

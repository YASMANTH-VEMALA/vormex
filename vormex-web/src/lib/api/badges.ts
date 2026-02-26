import apiClient from './client';

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  xpReward: number;
  isSecret: boolean;
  criteria: Record<string, unknown>;
  order: number;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  unlockedAt: string;
  notified: boolean;
}

export interface BadgeProgress {
  badge: Badge;
  unlocked: boolean;
  unlockedAt?: string;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
  badgeCount: number;
}

// Get all available badges
export const getAllBadges = async (): Promise<Badge[]> => {
  const response = await apiClient.get('/badges');
  return response.data;
};

// Get user's badges
export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  const response = await apiClient.get(`/badges/user/${userId}`);
  return response.data;
};

// Get my badges
export const getMyBadges = async (): Promise<UserBadge[]> => {
  const response = await apiClient.get('/badges/me');
  return response.data;
};

// Get badge categories
export const getBadgeCategories = async (): Promise<string[]> => {
  const response = await apiClient.get('/badges/categories');
  return response.data;
};

// Get my badge progress
export const getBadgeProgress = async (): Promise<BadgeProgress[]> => {
  const response = await apiClient.get('/badges/progress');
  return response.data;
};

// Check for new badges
export const checkBadges = async (): Promise<Badge[]> => {
  const response = await apiClient.post('/badges/check');
  return response.data;
};

// Get unnotified badges
export const getUnnotifiedBadges = async (): Promise<UserBadge[]> => {
  const response = await apiClient.get('/badges/unnotified');
  return response.data;
};

// Get badge leaderboard
export const getBadgeLeaderboard = async (limit?: number): Promise<LeaderboardEntry[]> => {
  const response = await apiClient.get('/badges/leaderboard', { params: { limit } });
  return response.data;
};

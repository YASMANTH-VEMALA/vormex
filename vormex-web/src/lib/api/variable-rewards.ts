import apiClient from './client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VARIABLE REWARDS TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type RewardCardType =
  | 'MATCH_BURST'
  | 'TRENDING'
  | 'HIDDEN_GEM'
  | 'MILESTONE'
  | 'OPPORTUNITY'
  | 'SOCIAL_PROOF'
  | 'SURPRISE_BOOST'
  | 'CONNECTION_UPDATE';

export interface MatchUser {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
  college: string | null;
  branch: string | null;
  headline: string | null;
  interests: string[];
}

export interface TrendingData {
  hasSpike: boolean;
  recentViews: number;
  previousViews: number;
  increasePercent: number;
}

export interface MilestoneData {
  id: string;
  type: string;
  value: number;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface OpportunityData {
  id: string;
  title: string;
  type: string;
  company: string;
  location: string;
  createdAt: string;
}

export interface ViewerData {
  id: string;
  viewId: string;
  name: string;
  username: string;
  profileImage: string | null;
  college: string | null;
  viewedAt: string;
}

export interface SurpriseBoostData {
  eligible: boolean;
  activeDays: number;
  xpAmount: number;
  reason: string;
}

export interface ConnectionUpdateData {
  hasUpdates: boolean;
  recentAccepts: Array<{
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
    acceptedAt: string;
  }>;
  newRequests: Array<{
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
    sentAt: string;
  }>;
}

export interface RewardDataResponse {
  hasNewMatches: boolean;
  matches: MatchUser[];
  hasTrendingSpike: boolean;
  trendingData: TrendingData | null;
  hasHiddenGems: boolean;
  hiddenGems: MatchUser[];
  hasNewMilestones: boolean;
  milestones: MilestoneData[];
  hasNewOpportunities: boolean;
  opportunities: OpportunityData[];
  hasNewViewers: boolean;
  viewers: ViewerData[];
  canGetSurpriseBoost: boolean;
  surpriseBoostData: SurpriseBoostData | null;
  hasConnectionUpdates: boolean;
  connectionUpdates: ConnectionUpdateData | null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getRewardData(): Promise<RewardDataResponse> {
  const res = await apiClient.get('/feed/reward-data');
  return res.data.data;
}

export async function markRewardShown(cardType: RewardCardType, itemIds: string[]): Promise<void> {
  await apiClient.post('/feed/mark-shown', { cardType, itemIds });
}

import apiClient from './client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface StreakData {
  connectionStreak: number;
  longestConnectionStreak: number;
  loginStreak: number;
  longestLoginStreak: number;
  postingStreak: number;
  longestPostingStreak: number;
  messagingStreak: number;
  longestMessagingStreak: number;
  overallBestStreak: number;
  weeklyConnectionsMade: number;
  weeklyConnectionsGoal: number;
  streakFreezes: number;
  streakShieldActive: boolean;
  totalFreezesUsed: number;
  isAtRisk: Record<string, boolean>;
  engagementScore: number;
  showOnProfile: boolean;
}

export interface PublicStreakData {
  visible: boolean;
  bestCurrentStreak: number | null;
  overallBestStreak: number | null;
  streaks: {
    connection: { current: number; longest: number };
    login: { current: number; longest: number };
    posting: { current: number; longest: number };
    messaging: { current: number; longest: number };
  } | null;
  engagementScore: number | null;
}

export interface StreakHistoryItem {
  id: string;
  streakId: string;
  userId: string;
  streakType: string;
  event: string;
  streakBefore: number;
  streakAfter: number;
  milestoneDay: number | null;
  badgeSlug: string | null;
  xpEarned: number;
  createdAt: string;
}

export type StreakType = 'connection' | 'login' | 'posting' | 'messaging';

export interface StreakLeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    name: string;
    profileImage: string | null;
    college: string | null;
    bio: string | null;
  };
  currentStreak: number;
  longestStreak: number;
}

export interface StreakLeaderboardResponse {
  streakType: string;
  leaderboard: StreakLeaderboardEntry[];
  updatedAt: string | null;
}

export interface StreakFreezeResponse {
  message: string;
  freezesRemaining: number;
  xpSpent: number;
}

export interface StreakShieldResponse {
  message: string;
  shieldActive: boolean;
}

export interface StreakVisibilityResponse {
  message: string;
  showOnProfile: boolean;
}

export interface ConnectionReward {
  animationType: string;
  showConfetti: boolean;
  celebrationMessage: string;
  receiverReplyRate: number;
  replyRateMessage: string;
}

export interface DailyMatch {
  id: string;
  username: string;
  name: string;
  profileImage: string | null;
  headline: string | null;
  college: string | null;
  interests: string[];
  isOnline: boolean;
  replyRate: number;
}

export interface DailyMatchesResponse {
  matches: DailyMatch[];
  matchCount: number;
  surpriseMessage?: string;
}

export type HiddenGemResponse = {
  match: DailyMatch;
  message: string;
} | null;

export interface LiveActivity {
  activeUsersNow: number;
  connectionsToday: number;
  newUsersToday: number;
  locationLabel: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  name: string;
  profileImage: string | null;
  college: string | null;
  connectionCount: number;
}

export interface LeaderboardResponse {
  period: string;
  leaderboard: LeaderboardEntry[];
  updatedAt: string;
}

export interface ProgressNudge {
  type: string;
  message: string;
  progress: number;
  target: number;
  icon: string;
}

export interface WeeklyGoals {
  id: string;
  weekStart: string;
  connectionsTarget: number;
  postsTarget: number;
  messagesTarget: number;
  connectionsMade: number;
  postsMade: number;
  messagesSent: number;
  isCompleted: boolean;
  xpEarned: number;
  connectionsProgress: number;
  postsProgress: number;
  messagesProgress: number;
}

export interface ConnectionLimit {
  canSend: boolean;
  remaining: number;
  limit: number;
  resetsAt: string;
}

export interface SessionSummary {
  connectionsAccepted: number;
  newPosts: number;
  messagesCount: number;
  message: string;
  emoji: string;
}

export interface CelebrationData {
  otherUser: {
    name: string;
    profileImage: string | null;
    username: string;
  };
  mutualConnections: number;
  celebrationMessage: string;
  showConfetti: boolean;
}

export interface EngagementDashboard {
  streaks: StreakData;
  weeklyGoals: WeeklyGoals;
  nudges: ProgressNudge[];
  connectionLimit: ConnectionLimit;
  liveActivity: LiveActivity;
  trending: {
    isActive: boolean;
    message?: string;
    viewCount?: number;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API CALLS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getEngagementDashboard = async (): Promise<EngagementDashboard> => {
  const res = await apiClient.get('/engagement/dashboard');
  return res.data;
};

export const getStreaks = async (): Promise<StreakData> => {
  const res = await apiClient.get('/engagement/streaks');
  return res.data;
};

export const recordLogin = async (): Promise<void> => {
  await apiClient.post('/engagement/login');
};

export const getDailyMatches = async (): Promise<DailyMatchesResponse> => {
  const res = await apiClient.get('/engagement/daily-matches');
  return res.data;
};

export const getHiddenGem = async (): Promise<HiddenGemResponse> => {
  const res = await apiClient.get('/engagement/hidden-gem');
  return res.data;
};

export const getLiveActivity = async (location?: string): Promise<LiveActivity> => {
  const res = await apiClient.get('/engagement/live-activity', {
    params: location ? { location } : {},
  });
  return res.data;
};

export const getLeaderboard = async (
  period: 'weekly' | 'monthly' = 'weekly',
  limit: number = 10
): Promise<LeaderboardResponse> => {
  const res = await apiClient.get('/engagement/leaderboard', {
    params: { period, limit },
  });
  // Backend returns { data: { period, leaderboard, updatedAt } }; apiClient returns response.data
  const payload = (res as { data?: LeaderboardResponse }).data ?? res;
  return payload as LeaderboardResponse;
};

export const getNudges = async (): Promise<ProgressNudge[]> => {
  const res = await apiClient.get('/engagement/nudges');
  return res.data;
};

export const getWeeklyGoals = async (): Promise<WeeklyGoals> => {
  const res = await apiClient.get('/engagement/weekly-goals');
  return res.data;
};

export const getConnectionLimit = async (): Promise<ConnectionLimit> => {
  const res = await apiClient.get('/engagement/connection-limit');
  return res.data;
};

export const getSessionSummary = async (): Promise<SessionSummary> => {
  const res = await apiClient.get('/engagement/session-summary');
  return res.data;
};

export const getConnectionCelebration = async (connectionId: string): Promise<CelebrationData | null> => {
  const res = await apiClient.get(`/engagement/celebration/${connectionId}`);
  return res.data;
};

export const getRecentJoins = async (groupId?: string): Promise<{ count: number; label: string }> => {
  const res = await apiClient.get('/engagement/recent-joins', {
    params: groupId ? { groupId } : {},
  });
  return res.data;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STREAK API CALLS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getPublicStreaks = async (userId: string): Promise<PublicStreakData> => {
  const res = await apiClient.get(`/engagement/streaks/${userId}`);
  return res.data;
};

export const purchaseStreakFreeze = async (): Promise<StreakFreezeResponse> => {
  const res = await apiClient.post('/engagement/streaks/freeze');
  return res.data;
};

export const toggleStreakShield = async (): Promise<StreakShieldResponse> => {
  const res = await apiClient.post('/engagement/streaks/shield');
  return res.data;
};

export const getStreakHistory = async (limit: number = 20): Promise<StreakHistoryItem[]> => {
  const res = await apiClient.get('/engagement/streaks/history', {
    params: { limit },
  });
  return res.data;
};

export const getStreakLeaderboard = async (
  type: StreakType = 'connection',
  limit: number = 20
): Promise<StreakLeaderboardResponse> => {
  const res = await apiClient.get('/engagement/streaks/leaderboard', {
    params: { type, limit },
  });
  return res.data;
};

export const toggleStreakVisibility = async (): Promise<StreakVisibilityResponse> => {
  const res = await apiClient.post('/engagement/streaks/visibility');
  return res.data;
};

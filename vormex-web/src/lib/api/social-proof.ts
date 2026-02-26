import apiClient from './client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOCIAL PROOF & FOMO TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface LiveStats {
  activeNow: number;
  activeLastHour: number;
  connectionsToday: number;
  newUsersToday: number;
  postsToday: number;
  profileBrowsersNow: number;
  locationLabel: string;
  scope: string;
  timestamp: string;
}

export interface ProfileViewStats {
  viewsLastHour: number;
  viewsToday: number;
  viewsThisWeek: number;
  trendPercent: number;
  trendDirection: 'up' | 'down';
  totalViews: number;
  recentViewers: ProfileViewer[];
  viewerCount: number;
}

export interface ProfileViewer {
  id: string;
  viewedAt: string;
  source: string | null;
  viewer: {
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
    college: string | null;
    headline: string | null;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  name: string;
  profileImage: string | null;
  college: string | null;
  currentCity: string | null;
  score: number;
  connectionCount: number;
  postCount: number;
  commentCount: number;
}

export interface LeaderboardResponse {
  period: string;
  scope: string;
  entries: LeaderboardEntry[];
  updatedAt: string;
  userRank: {
    rank: number;
    score: number;
    inTopList: boolean;
  } | null;
}

export interface GroupStats {
  groupId: string;
  groupName: string;
  totalMembers: number;
  recentJoins24h: number;
  recentJoinsWeek: number;
  onlineNow: number;
  mutualConnections: number;
  growthVelocity: number;
  isTrending: boolean;
}

export interface EventStats {
  eventId: string;
  rsvpCount: number;
  rsvpsLastHour: number;
  viewsToday: number;
  viewsLastHour: number;
  totalViews: number;
  mutualConnectionsAttending: number;
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  label: string;
  timestamp: string;
  secondsAgo: number;
}

export interface TrendingItem {
  id: string;
  itemType: string;
  itemId: string;
  score: number;
  velocity: number;
  reason: string | null;
  city: string | null;
  college: string | null;
  isTrending: boolean;
  trendingAt: string;
}

export interface OnboardingStats {
  totalUsers: number;
  totalColleges: number;
  totalConnections: number;
  activeToday: number;
  scope: string;
  updatedAt: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API CALLS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Get live activity stats (Bandwagon: "23 students networking now") */
export const getSocialProofLiveStats = async (
  city?: string,
  college?: string
): Promise<LiveStats> => {
  const res = await apiClient.get('/social-proof/live-stats', {
    params: { ...(city && { city }), ...(college && { college }) },
  });
  return res.data.data;
};

/** Track a profile view */
export const trackProfileView = async (
  viewedId: string,
  source?: string
): Promise<void> => {
  await apiClient.post('/social-proof/track-view', { viewedId, source });
};

/** Get profile view analytics ("47 views this week +32%") */
export const getProfileViewStats = async (
  userId: string
): Promise<ProfileViewStats> => {
  const res = await apiClient.get(`/social-proof/profile-views/${userId}`);
  return res.data.data;
};

/** Get leaderboard ("Top 10 Most Connected Students") */
export const getSocialProofLeaderboard = async (
  period: 'daily' | 'weekly' | 'all_time' = 'weekly',
  scope: string = 'global',
  limit: number = 10
): Promise<LeaderboardResponse> => {
  const res = await apiClient.get('/social-proof/leaderboard', {
    params: { period, scope, limit },
  });
  return res.data.data;
};

/** Get group/circle stats ("48 joined in last 24 hours") */
export const getGroupSocialStats = async (
  groupId: string
): Promise<GroupStats> => {
  const res = await apiClient.get(`/social-proof/group-stats/${groupId}`);
  return res.data.data;
};

/** Get event stats ("89 going • 23 RSVPed in last hour") */
export const getEventSocialStats = async (
  eventId: string
): Promise<EventStats> => {
  const res = await apiClient.get(`/social-proof/event-stats/${eventId}`);
  return res.data.data;
};

/** Track an event page view */
export const trackEventView = async (eventId: string): Promise<void> => {
  await apiClient.post('/social-proof/track-event-view', { eventId });
};

/** Get real-time activity feed */
export const getActivityFeed = async (
  limit: number = 20,
  minutes: number = 10
): Promise<ActivityFeedItem[]> => {
  const res = await apiClient.get('/social-proof/activity-feed', {
    params: { limit, minutes },
  });
  return res.data.data;
};

/** Get trending items */
export const getTrendingItems = async (
  type?: string,
  city?: string,
  limit: number = 10
): Promise<TrendingItem[]> => {
  const res = await apiClient.get('/social-proof/trending', {
    params: { ...(type && { type }), ...(city && { city }), limit },
  });
  return res.data.data;
};

/** Get onboarding social proof stats ("12,453 students networking") */
export const getOnboardingStats = async (
  college?: string
): Promise<OnboardingStats> => {
  const res = await apiClient.get('/social-proof/onboarding-stats', {
    params: { ...(college && { college }) },
  });
  return res.data.data;
};

/** Send heartbeat to update online presence */
export const sendHeartbeat = async (currentPage?: string): Promise<void> => {
  await apiClient.post('/social-proof/heartbeat', { currentPage });
};

/** Record a social activity event */
export const recordSocialActivity = async (
  activityType: string,
  metadata?: Record<string, any>
): Promise<void> => {
  await apiClient.post('/social-proof/record-activity', { activityType, metadata });
};

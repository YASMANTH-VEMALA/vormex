import apiClient from './client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface FollowUser {
  id: string;
  username: string;
  name: string;
  profileImage: string | null;
  headline: string | null;
  college: string | null;
  isOnline: boolean;
}

export interface FollowWithUser {
  id: string;
  createdAt: string;
  user: FollowUser;
}

export interface FollowersResponse {
  followers: FollowWithUser[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface FollowingResponse {
  following: FollowWithUser[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface FollowStatusResponse {
  isFollowing: boolean;
  isFollowedBy: boolean;
}

export interface MutualInfo {
  mutualConnections: FollowUser[];
  mutualFollowers: FollowUser[];
  mutualConnectionsCount: number;
  mutualFollowersCount: number;
}

export interface FollowCountsResponse {
  followersCount: number;
  followingCount: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Follow a user (instant, one-way)
 */
export async function followUser(userId: string): Promise<{ message: string; follow: any }> {
  return apiClient.post(`/follow/${userId}`);
}

/**
 * Unfollow a user
 */
export async function unfollowUser(userId: string): Promise<{ message: string }> {
  return apiClient.delete(`/follow/${userId}`);
}

/**
 * Get follow status between current user and target user
 */
export async function getFollowStatus(userId: string): Promise<FollowStatusResponse> {
  return apiClient.get(`/follow/status/${userId}`);
}

/**
 * Get followers of a user
 */
export async function getFollowers(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<FollowersResponse> {
  return apiClient.get(`/follow/followers/${userId}?page=${page}&limit=${limit}`);
}

/**
 * Get who a user is following
 */
export async function getFollowing(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<FollowingResponse> {
  return apiClient.get(`/follow/following/${userId}?page=${page}&limit=${limit}`);
}

/**
 * Get mutual connections and followers with a user
 */
export async function getMutualInfo(userId: string): Promise<MutualInfo> {
  return apiClient.get(`/follow/mutual/${userId}`);
}

/**
 * Get follower/following counts for a user
 */
export async function getFollowCounts(userId: string): Promise<FollowCountsResponse> {
  return apiClient.get(`/follow/counts/${userId}`);
}

// Mentions API - Track and manage @mentions with accept/reject workflow

import apiClient from './client';

// ============================================
// Types
// ============================================

export interface MentionUser {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
  profileImage?: string | null;
  headline: string | null;
}

export interface MentionPost {
  id: string;
  content: string;
  mediaUrls: string[];
  type: string;
  authorId: string;
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  author?: MentionUser;
}

export interface Mention {
  id: string;
  postId: string;
  status: 'pending' | 'accepted' | 'rejected';
  showOnProfile: boolean;
  createdAt: string;
  respondedAt: string | null;
  post: MentionPost;
  mentioner: MentionUser | null;
  /** True if not yet responded (status === 'pending') */
  isRead?: boolean;
}

export interface MentionsResponse {
  mentions: Mention[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ProfileMentionPost extends MentionPost {
  mentionId: string;
  mentionedAt: string;
}

export interface ProfileMentionsResponse {
  posts: ProfileMentionPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ============================================
// API Functions - Search
// ============================================

/**
 * Search users for @mention autocomplete
 */
export async function searchUsersForMention(
  query: string,
  limit: number = 10
): Promise<{ users: MentionUser[] }> {
  return apiClient.get('/mentions/search', {
    params: { q: query, limit },
  });
}

// ============================================
// API Functions - Create & Manage Mentions
// ============================================

/**
 * Create mentions for a post
 */
export async function createMentions(
  postId: string,
  userIds: string[]
): Promise<{ message: string; count: number }> {
  return apiClient.post('/mentions', { postId, userIds });
}

/**
 * Get pending mentions (for notifications)
 */
export async function getPendingMentions(
  limit: number = 20,
  cursor?: string
): Promise<MentionsResponse> {
  return apiClient.get('/mentions/pending', {
    params: { limit, ...(cursor && { cursor }) },
  });
}

/**
 * Get all mentions for current user
 */
export async function getMyMentions(
  options?: {
    status?: 'pending' | 'accepted' | 'rejected';
    limit?: number;
    cursor?: string;
  }
): Promise<MentionsResponse> {
  return apiClient.get('/mentions', {
    params: {
      ...(options?.status && { status: options.status }),
      limit: options?.limit || 20,
      ...(options?.cursor && { cursor: options.cursor }),
    },
  });
}

/**
 * Get pending mention count for notification badge
 */
export async function getMentionCount(): Promise<{ count: number }> {
  return apiClient.get('/mentions/count');
}

// ============================================
// API Functions - Respond to Mentions
// ============================================

/**
 * Accept or reject a mention
 */
export async function respondToMention(
  mentionId: string,
  action: 'accept' | 'reject',
  showOnProfile: boolean = true
): Promise<{ message: string; mention: Mention }> {
  return apiClient.post(`/mentions/${mentionId}/respond`, {
    action,
    showOnProfile,
  });
}

/**
 * Toggle whether an accepted mention shows on profile
 */
export async function toggleMentionOnProfile(
  mentionId: string,
  showOnProfile: boolean
): Promise<{ message: string; mention: Mention }> {
  return apiClient.patch(`/mentions/${mentionId}/profile`, { showOnProfile });
}

// ============================================
// API Functions - Profile Mentions
// ============================================

/**
 * Get posts shown on a user's profile from accepted mentions
 */
export async function getProfileMentions(
  userId: string,
  limit: number = 20,
  cursor?: string
): Promise<ProfileMentionsResponse> {
  return apiClient.get(`/mentions/profile/${userId}`, {
    params: { limit, ...(cursor && { cursor }) },
  });
}

// ============================================
// Legacy Functions (for backward compatibility)
// ============================================

/**
 * @deprecated Use getPendingMentions instead
 */
export async function getUnreadMentions(): Promise<Mention[]> {
  const response = await getPendingMentions();
  return response.mentions.map((m) => ({ ...m, isRead: m.status !== 'pending' }));
}

/**
 * @deprecated Use getMentionCount instead
 */
export async function getUnreadMentionCount(): Promise<{ count: number }> {
  return getMentionCount();
}

/**
 * @deprecated Mentions are now marked as read by responding (accept/reject)
 */
export async function markMentionsAsRead(
  _mentionIds: string[]
): Promise<{ message: string }> {
  return { message: 'ok' };
}

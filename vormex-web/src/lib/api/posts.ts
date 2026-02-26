// Posts API - Complete API client for Posts & Feed endpoints

import apiClient from './client';
import type {
  Post,
  FeedResponse,
  Comment,
  CommentsResponse,
  MentionUser,
  MentionNotification,
} from '@/types/post';

// ============================================
// Feed Endpoints
// ============================================

/**
 * Get home feed with cursor-based pagination
 * @param cursor - Optional cursor for pagination
 * @param limit - Number of posts per page (default: 20)
 */
export async function getFeed(cursor?: string, limit: number = 20): Promise<FeedResponse> {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  return apiClient.get('/posts/feed', { params });
}

/**
 * Get a single post by ID
 * @param postId - Post ID
 */
export async function getPost(postId: string): Promise<Post> {
  return apiClient.get(`/posts/${postId}`);
}

// ============================================
// Post CRUD Endpoints
// ============================================

/**
 * Create a new post (supports all post types)
 * Uses FormData for file uploads
 */
export async function createPost(formData: FormData): Promise<Post> {
  // Content-Type is automatically handled by the request interceptor for FormData
  return apiClient.post('/posts', formData);
}

/**
 * Delete a post
 * @param postId - Post ID to delete
 */
export async function deletePost(postId: string): Promise<{ success: boolean }> {
  return apiClient.delete(`/posts/${postId}`);
}

/**
 * Update a post (content and visibility only)
 * @param postId - Post ID to update
 * @param data - Updated content and/or visibility
 */
export async function updatePost(
  postId: string,
  data: { content?: string; visibility?: string }
): Promise<Post> {
  return apiClient.put(`/posts/${postId}`, data);
}

// ============================================
// Engagement Endpoints
// ============================================

/**
 * Toggle like on a post
 * @param postId - Post ID
 */
export async function toggleLike(postId: string): Promise<{ liked: boolean; likesCount: number }> {
  return apiClient.post(`/posts/${postId}/like`);
}

/**
 * Vote on a poll
 * @param postId - Post ID
 * @param optionId - Poll option ID
 */
export async function votePoll(postId: string, optionId: string): Promise<{ success: boolean; pollOptions: any[] }> {
  return apiClient.post(`/posts/${postId}/poll/vote`, { optionId });
}

/**
 * Share post to user(s)
 * @param postId - Post ID
 * @param userId - Target user ID to share with
 */
export async function sharePostToUser(postId: string, userId: string): Promise<{ message: string }> {
  return apiClient.post(`/posts/${postId}/share`, { userId });
}

/**
 * Track post impression (view)
 * @param postId - Post ID
 * @param locationData - Optional location data
 */
export async function trackImpression(
  postId: string,
  locationData?: { lat: number; lng: number; city?: string; country?: string }
): Promise<{ success: boolean }> {
  return apiClient.post(`/posts/${postId}/impression`, locationData);
}

// ============================================
// Comments Endpoints
// ============================================

/**
 * Get comments for a post
 * @param postId - Post ID
 * @param parentId - Optional parent comment ID for replies
 * @param page - Page number
 * @param limit - Comments per page
 */
export async function getComments(
  postId: string,
  parentId?: string,
  page: number = 1,
  limit: number = 20
): Promise<CommentsResponse> {
  const params: Record<string, any> = { page, limit };
  if (parentId) params.parentId = parentId;
  return apiClient.get(`/posts/${postId}/comments`, { params });
}

/**
 * Create a comment on a post
 * Note: This is handled via WebSocket for real-time updates
 * This is a fallback HTTP endpoint
 */
export async function createComment(
  postId: string,
  content: string,
  parentId?: string,
  mentions?: string[]
): Promise<Comment> {
  return apiClient.post(`/posts/${postId}/comments`, {
    content,
    parentId,
    mentions,
  });
}

/**
 * Toggle like on a comment
 * Note: This is handled via WebSocket for real-time updates
 */
export async function toggleCommentLike(
  postId: string,
  commentId: string
): Promise<{ liked: boolean; likesCount: number }> {
  return apiClient.post(`/posts/${postId}/comments/${commentId}/like`);
}

// ============================================
// Mention Endpoints
// ============================================

/**
 * Search users for @mention autocomplete
 * @param query - Search query
 */
export async function searchUsersForMention(query: string): Promise<MentionUser[]> {
  const res = await apiClient.get('/mentions/search', { params: { q: query } });
  return (res as { users?: MentionUser[] }).users ?? [];
}

/**
 * Get unread mentions
 */
export async function getUnreadMentions(): Promise<MentionNotification[]> {
  return apiClient.get('/mentions/unread');
}

/**
 * Get unread mention count
 */
export async function getUnreadMentionCount(): Promise<{ count: number }> {
  return apiClient.get('/mentions/count');
}

/**
 * Mark mentions as read
 * @param mentionIds - Array of mention IDs to mark as read
 */
export async function markMentionsAsRead(mentionIds: string[]): Promise<{ success: boolean }> {
  return apiClient.post('/mentions/read', { mentionIds });
}

// ============================================
// Upload Endpoints
// ============================================

/**
 * Upload avatar image
 * @param file - Image file
 */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return apiClient.post('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * Upload banner image
 * @param file - Image file
 */
export async function uploadBanner(file: File): Promise<{ bannerUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return apiClient.post('/upload/banner', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * Upload certificate/document image
 * @param file - Image file
 */
export async function uploadCertificate(file: File): Promise<{ certificateUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return apiClient.post('/upload/certificate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * Upload project image
 * @param file - Image file
 */
export async function uploadProjectImage(file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return apiClient.post('/upload/project', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * Delete an uploaded file
 * @param fileUrl - URL of file to delete
 * @param type - Type of file (avatar, banner, post)
 */
export async function deleteUpload(fileUrl: string, type: 'avatar' | 'banner' | 'post'): Promise<{ success: boolean }> {
  return apiClient.delete('/upload', { data: { fileUrl, type } });
}

// ============================================
// Location Endpoints
// ============================================

/**
 * Update user location
 */
export async function updateLocation(
  lat: number,
  lng: number,
  accuracy?: number,
  activity?: string
): Promise<any> {
  return apiClient.post('/location/update', { lat, lng, accuracy, activity });
}

/**
 * Get current user's location
 */
export async function getMyLocation(): Promise<any> {
  return apiClient.get('/location/me');
}

/**
 * Get nearby users
 * @param radius - Search radius in km (default: 50)
 * @param limit - Max users to return (default: 20)
 */
export async function getNearbyUsers(radius?: number, limit?: number): Promise<any[]> {
  const params: Record<string, any> = {};
  if (radius) params.radius = radius;
  if (limit) params.limit = limit;
  return apiClient.get('/location/nearby', { params });
}

/**
 * Update location settings
 */
export async function updateLocationSettings(settings: {
  locationPermission?: boolean;
  shareLocationPublic?: boolean;
}): Promise<{ message: string }> {
  return apiClient.put('/location/settings', settings);
}

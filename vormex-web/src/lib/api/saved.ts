import apiClient from './client';
import type { Post } from '@/types/post';

export interface SavedPostsResponse {
  posts: (Post & { savedAt?: string })[];
  nextCursor: string | null;
  hasMore: boolean;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ToggleSaveResponse {
  message: string;
  saved: boolean;
  savesCount: number;
}

// Get all saved posts (cursor-based pagination)
export const getSavedPosts = async (
  cursor?: string | null,
  limit = 20
): Promise<SavedPostsResponse> => {
  const params: Record<string, string | number> = { limit };
  if (cursor) params.cursor = cursor;
  const res = (await apiClient.get('/saved', { params })) as unknown as SavedPostsResponse;
  return {
    posts: res.posts || [],
    nextCursor: res.nextCursor ?? null,
    hasMore: res.hasMore ?? false,
    pagination: {
      page: 1,
      limit,
      totalCount: res.posts?.length ?? 0,
      totalPages: res.hasMore ? 2 : 1,
      hasMore: res.hasMore ?? false,
    },
  };
};

// Toggle save status
export const toggleSavePost = async (postId: string): Promise<ToggleSaveResponse> => {
  return apiClient.post(`/saved/${postId}/toggle`);
};

// Save a post
export const savePost = async (postId: string): Promise<{ message: string }> => {
  return apiClient.post(`/saved/${postId}`);
};

// Unsave a post
export const unsavePost = async (postId: string): Promise<{ message: string }> => {
  return apiClient.delete(`/saved/${postId}`);
};

// Check if post is saved
export const checkPostSaved = async (postId: string): Promise<{ saved: boolean }> => {
  return apiClient.get(`/saved/${postId}/check`);
};

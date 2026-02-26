import apiClient from './client';

// ============================================
// Types
// ============================================

export type StoryMediaType = 'IMAGE' | 'VIDEO' | 'TEXT';
export type StoryCategory = 'GENERAL' | 'DAY_AT_WORK' | 'LEARNING' | 'ACHIEVEMENT' | 'PROJECT' | 'EVENT' | 'BEHIND_SCENES' | 'TIPS' | 'QNA';
export type StoryVisibility = 'PUBLIC' | 'CONNECTIONS' | 'CLOSE_FRIENDS';

export interface StoryAuthor {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
  headline?: string | null;
  isVerified?: boolean;
}

export interface Story {
  id: string;
  mediaUrl: string;
  mediaType: StoryMediaType;
  thumbnailUrl?: string | null;
  duration: number;
  category: StoryCategory;
  backgroundColor?: string | null;
  textContent?: string | null;
  textPosition?: { x: number; y: number } | null;
  textStyle?: { fontSize?: number; fontWeight?: string; color?: string } | null;
  stickers?: any[] | null;
  filters?: string | null;
  musicUrl?: string | null;
  musicTitle?: string | null;
  musicArtist?: string | null;
  linkUrl?: string | null;
  linkTitle?: string | null;
  visibility: StoryVisibility;
  viewsCount: number;
  reactionsCount: number;
  repliesCount?: number;
  isViewed: boolean;
  userReaction?: string | null;
  isOwn?: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface StoryGroup {
  user: StoryAuthor;
  stories: Story[];
  hasUnviewed: boolean;
  lastStoryAt: string;
  isOwnStory: boolean;
}

export interface StoryHighlight {
  id: string;
  title: string;
  coverImage: string | null;
  emoji?: string | null;
  storiesCount: number;
  isPublic: boolean;
  createdAt: string;
}

export interface StoryViewer {
  id: string;
  user: StoryAuthor;
  viewedAt: string;
  duration?: number | null;
}

export interface StoryReply {
  id: string;
  content: string;
  mediaUrl?: string | null;
  author: StoryAuthor;
  createdAt: string;
}

// ============================================
// Story CRUD
// ============================================

export interface CreateStoryInput {
  mediaUrl?: string;
  mediaType?: StoryMediaType;
  thumbnailUrl?: string;
  duration?: number;
  category?: StoryCategory;
  backgroundColor?: string;
  textContent?: string;
  textPosition?: { x: number; y: number };
  textStyle?: { fontSize?: number; fontWeight?: string; color?: string };
  stickers?: any[];
  filters?: string;
  musicUrl?: string;
  musicTitle?: string;
  musicArtist?: string;
  linkUrl?: string;
  linkTitle?: string;
  visibility?: StoryVisibility;
  mentions?: string[];
}

export const createStory = async (data: CreateStoryInput): Promise<{ message: string; story: Story }> => {
  // apiClient interceptor already returns response.data
  return apiClient.post('/stories', data);
};

// Create story with file upload
export const createStoryWithMedia = async (formData: FormData): Promise<{ message: string; story: Story }> => {
  // apiClient interceptor already returns response.data
  return apiClient.post('/stories', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getStoriesFeed = async (): Promise<{ storyGroups: StoryGroup[] }> => {
  try {
    // apiClient interceptor already returns response.data, so this IS the data
    const response = await apiClient.get('/stories/feed');
    const data = response.data || response;
    console.log('📖 Stories API raw response:', data);
    
    // Ensure we always return the expected structure
    if (data && Array.isArray(data.storyGroups)) {
      return { storyGroups: data.storyGroups };
    }
    
    // If response is already an array, wrap it
    if (Array.isArray(data)) {
      return { storyGroups: data };
    }
    
    // Default empty array
    return { storyGroups: [] };
  } catch (error) {
    console.error('📖 Stories API error:', error);
    throw error;
  }
};

export const getStory = async (storyId: string): Promise<{ story: Story & { isOwn: boolean } }> => {
  return apiClient.get(`/stories/${storyId}`);
};

export const getMyStories = async (includeExpired = false): Promise<{ stories: Story[] }> => {
  return apiClient.get('/stories/me', {
    params: { includeExpired },
  });
};

export const deleteStory = async (storyId: string): Promise<{ message: string }> => {
  return apiClient.delete(`/stories/${storyId}`);
};

export const getUserStories = async (userId: string): Promise<{
  hasStories: boolean;
  user?: StoryAuthor;
  hasUnviewed?: boolean;
  stories?: Story[];
}> => {
  return apiClient.get(`/stories/user/${userId}`);
};

// ============================================
// Story Viewing
// ============================================

export const viewStory = async (storyId: string, duration?: number): Promise<{ message: string; viewsCount: number }> => {
  return apiClient.post(`/stories/${storyId}/view`, { duration });
};

export const getStoryViewers = async (
  storyId: string,
  cursor?: string,
  limit = 20
): Promise<{
  viewers: StoryViewer[];
  nextCursor: string | null;
  hasMore: boolean;
}> => {
  return apiClient.get(`/stories/${storyId}/viewers`, {
    params: { cursor, limit },
  });
};

// ============================================
// Story Reactions
// ============================================

export const reactToStory = async (
  storyId: string,
  reactionType: string
): Promise<{ message: string; reactionType: string; reactionsCount: number }> => {
  return apiClient.post(`/stories/${storyId}/react`, { reactionType });
};

export const removeReaction = async (storyId: string): Promise<{ message: string; reactionsCount: number }> => {
  return apiClient.delete(`/stories/${storyId}/react`);
};

// ============================================
// Story Replies
// ============================================

export const replyToStory = async (
  storyId: string,
  content: string,
  mediaUrl?: string
): Promise<{ message: string; reply: StoryReply }> => {
  return apiClient.post(`/stories/${storyId}/reply`, { content, mediaUrl });
};

export const getStoryReplies = async (storyId: string): Promise<{ replies: StoryReply[] }> => {
  return apiClient.get(`/stories/${storyId}/replies`);
};

// ============================================
// Highlights
// ============================================

export interface CreateHighlightInput {
  title: string;
  coverImage?: string;
  emoji?: string;
  storyIds?: string[];
}

export const createHighlight = async (data: CreateHighlightInput): Promise<{ message: string; highlight: StoryHighlight }> => {
  return apiClient.post('/stories/highlights', data);
};

export const getUserHighlights = async (userId: string): Promise<{ highlights: StoryHighlight[] }> => {
  return apiClient.get(`/stories/highlights/user/${userId}`);
};

export const getHighlightStories = async (highlightId: string): Promise<{
  highlight: StoryHighlight & { user: StoryAuthor; stories: Story[] };
}> => {
  return apiClient.get(`/stories/highlights/${highlightId}`);
};

export const updateHighlight = async (
  highlightId: string,
  data: Partial<CreateHighlightInput>
): Promise<{ message: string; highlight: StoryHighlight }> => {
  return apiClient.patch(`/stories/highlights/${highlightId}`, data);
};

export const deleteHighlight = async (highlightId: string): Promise<{ message: string }> => {
  return apiClient.delete(`/stories/highlights/${highlightId}`);
};

export const addStoryToHighlight = async (highlightId: string, storyId: string): Promise<{ message: string }> => {
  return apiClient.post(`/stories/highlights/${highlightId}/stories/${storyId}`);
};

export const removeStoryFromHighlight = async (highlightId: string, storyId: string): Promise<{ message: string }> => {
  return apiClient.delete(`/stories/highlights/${highlightId}/stories/${storyId}`);
};

// ============================================
// Archive
// ============================================

export const archiveStory = async (storyId: string): Promise<{ message: string }> => {
  return apiClient.post(`/stories/${storyId}/archive`);
};

export const getArchivedStories = async (): Promise<{ stories: Story[] }> => {
  return apiClient.get('/stories/archive');
};

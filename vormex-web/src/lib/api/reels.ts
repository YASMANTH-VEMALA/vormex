import apiClient from './client';

export interface ReelAuthor {
  id: string;
  username: string;
  name: string;
  profileImage: string | null;
  headline?: string | null;
  isFollowing?: boolean;
}

export interface ReelAudio {
  id: string;
  title: string;
  artist: string | null;
  albumArt: string | null;
}

export interface Reel {
  id: string;
  author: ReelAuthor;
  videoId: string;
  videoUrl: string;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  previewGifUrl: string | null;
  title: string | null;
  caption: string | null;
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: string;
  audio: ReelAudio | null;
  hashtags: string[];
  mentions: string[];
  skills: string[];
  topics: string[];
  category: string | null;
  locationName: string | null;
  isResponse: boolean;
  responseType: string | null;
  originalReelId: string | null;
  pollQuestion: string | null;
  pollOptions: { id: number; text: string; votes: number }[] | null;
  pollEndsAt: string | null;
  userVotedOption: number | null;
  quizQuestion: string | null;
  quizOptions: { id: number; text: string }[] | null;
  codeSnippet: string | null;
  codeLanguage: string | null;
  codeFileName: string | null;
  repoUrl: string | null;
  ctaType: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  visibility: string;
  allowComments: boolean;
  allowDuets: boolean;
  allowStitch: boolean;
  allowDownload: boolean;
  allowSharing: boolean;
  status: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReelsFeedResponse {
  reels: Reel[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ReelComment {
  id: string;
  reelId: string;
  parentId: string | null;
  author: ReelAuthor;
  content: string;
  mentions: string[];
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
  isPinned: boolean;
  isAuthorHeart: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsResponse {
  comments: ReelComment[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UploadUrlResponse {
  videoId: string;
  uploadUrl: string;
  tusUrl: string;
}

export interface PreloadDataResponse {
  hlsUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

export const reelsApi = {
  getFeed: (params?: { cursor?: string; limit?: number; mode?: 'foryou' | 'following' }) =>
    apiClient.get<ReelsFeedResponse>('/reels/feed', { params }),

  getFollowingFeed: (params?: { cursor?: string; limit?: number }) =>
    apiClient.get<ReelsFeedResponse>('/reels/feed/following', { params }),

  getTrending: (params?: { hours?: number; limit?: number }) =>
    apiClient.get<ReelsFeedResponse>('/reels/trending', { params }),

  getReel: (reelId: string) =>
    apiClient.get<Reel>(`/reels/${reelId}`),

  getDrafts: (params?: { cursor?: string; limit?: number }) =>
    apiClient.get<ReelsFeedResponse>('/reels/drafts', { params }),

  getReelAudio: (reelId: string) =>
    apiClient.get<{
      hasAudio: boolean;
      audio?: {
        id: string;
        title: string;
        artist: string | null;
        albumArt: string | null;
        audioUrl: string;
        durationMs: number;
        genre: string | null;
        usageCount: number;
        sourceReelId: string;
        originalCreator: { id: string; username: string; name: string } | null;
      };
      message?: string;
    }>(`/reels/${reelId}/audio`),

  publishDraft: (reelId: string, data?: { scheduledAt?: string }) =>
    apiClient.post<Reel>(`/reels/${reelId}/publish`, data || {}),

  getPreloadData: (reelId: string) =>
    apiClient.get<PreloadDataResponse>(`/reels/${reelId}/preload`),

  getUploadUrl: () =>
    apiClient.post<UploadUrlResponse>('/reels/upload-url'),

  createReel: (data: FormData) =>
    apiClient.post<Reel>('/reels', data),

  onUploadComplete: (videoId: string, metadata: Record<string, unknown>) =>
    apiClient.post<Reel>('/reels/upload-complete', { videoId, ...metadata }),

  updateReel: (reelId: string, data: Partial<Reel>) =>
    apiClient.put<Reel>(`/reels/${reelId}`, data),

  deleteReel: (reelId: string) =>
    apiClient.delete(`/reels/${reelId}`),

  toggleLike: (reelId: string) =>
    apiClient.post<{ liked: boolean; likesCount: number }>(`/reels/${reelId}/like`),

  toggleSave: (reelId: string) =>
    apiClient.post<{ saved: boolean; savesCount: number }>(`/reels/${reelId}/save`),

  share: (reelId: string, data: { shareType: string; platform?: string; recipientId?: string }) =>
    apiClient.post<{ success: boolean; sharesCount: number }>(`/reels/${reelId}/share`, data),

  shareInChat: (reelId: string, data: { recipientId: string; message?: string }) =>
    apiClient.post<{ success: boolean; message: { id: string; conversationId: string }; sharesCount: number }>(
      `/reels/${reelId}/share/chat`,
      data
    ),

  trackView: (reelId: string, data: { watchTimeMs: number; completed: boolean; source: string }) =>
    apiClient.post(`/reels/${reelId}/view`, data),

  getComments: (reelId: string, params?: { cursor?: string; limit?: number; parentId?: string }) =>
    apiClient.get<CommentsResponse>(`/reels/${reelId}/comments`, { params }),

  createComment: (reelId: string, data: { content: string; parentId?: string; mentions?: string[] }) =>
    apiClient.post<ReelComment>(`/reels/${reelId}/comments`, data),

  toggleCommentLike: (reelId: string, commentId: string) =>
    apiClient.post<{ liked: boolean; likesCount: number }>(`/reels/${reelId}/comments/${commentId}/like`),

  deleteComment: (reelId: string, commentId: string) =>
    apiClient.delete(`/reels/${reelId}/comments/${commentId}`),

  heartComment: (reelId: string, commentId: string) =>
    apiClient.post<{ isAuthorHeart: boolean }>(`/reels/${reelId}/comments/${commentId}/heart`),

  votePoll: (reelId: string, optionId: number) =>
    apiClient.post<{ success: boolean; pollOptions: { id: number; text: string; votes: number }[]; userVotedOption: number }>(
      `/reels/${reelId}/poll/vote`,
      { optionId }
    ),

  answerQuiz: (reelId: string, optionId: number) =>
    apiClient.post<{ correct: boolean; correctAnswer: number }>(`/reels/${reelId}/quiz/answer`, { optionId }),

  getByHashtag: (hashtag: string, params?: { cursor?: string; limit?: number }) =>
    apiClient.get<ReelsFeedResponse & { hashtag: string }>(`/reels/hashtag/${hashtag}`, { params }),

  getByAudio: (audioId: string, params?: { cursor?: string; limit?: number }) =>
    apiClient.get<ReelsFeedResponse & { audioId: string }>(`/reels/audio/${audioId}`, { params }),

  getUserReels: (userId: string, params?: { cursor?: string; limit?: number }) =>
    apiClient.get<ReelsFeedResponse>(`/reels/user/${userId}`, { params }),

  getUserLikedReels: (userId: string, params?: { cursor?: string; limit?: number }) =>
    apiClient.get<ReelsFeedResponse>(`/reels/user/${userId}/liked`, { params }),

  getUserSavedReels: (userId: string, params?: { cursor?: string; limit?: number }) =>
    apiClient.get<ReelsFeedResponse>(`/reels/user/${userId}/saved`, { params }),

  getResponses: (reelId: string, params?: { cursor?: string; limit?: number }) =>
    apiClient.get<ReelsFeedResponse>(`/reels/${reelId}/responses`, { params }),

  getCreatorAnalytics: (params?: { days?: number }) =>
    apiClient.get('/reels/analytics/creator', { params }),

  getReelAnalytics: (reelId: string) =>
    apiClient.get(`/reels/analytics/reel/${reelId}`),

  report: (reelId: string, data: { reason: string; description?: string }) =>
    apiClient.post(`/reels/${reelId}/report`, data),
};

export interface Audio {
  id: string;
  title: string;
  artist: string | null;
  albumName: string | null;
  albumArt: string | null;
  audioUrl: string;
  durationMs: number;
  genre: string | null;
  mood: string | null;
  tempo: number | null;
  isRoyaltyFree: boolean;
  source: string | null;
  usageCount: number;
  savesCount: number;
  isSaved: boolean;
  createdAt: string;
}

export interface AudioResponse {
  audio: Audio[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

export const audioApi = {
  getTrending: (params?: { limit?: number }) =>
    apiClient.get<AudioResponse>('/audio/trending', { params }),

  search: (query: string, params?: { limit?: number; cursor?: string }) =>
    apiClient.get<AudioResponse>('/audio/search', { params: { q: query, ...params } }),

  getCategories: () =>
    apiClient.get<{ categories: { name: string; count: number }[] }>('/audio/categories'),

  getMoods: () =>
    apiClient.get<{ moods: { name: string; count: number }[] }>('/audio/moods'),

  getByGenre: (genre: string, params?: { limit?: number; cursor?: string }) =>
    apiClient.get<AudioResponse & { genre: string }>(`/audio/genre/${genre}`, { params }),

  getAudio: (audioId: string) =>
    apiClient.get<Audio>(`/audio/${audioId}`),

  getAudioReels: (audioId: string, params?: { limit?: number; cursor?: string }) =>
    apiClient.get(`/audio/${audioId}/reels`, { params }),

  toggleSave: (audioId: string) =>
    apiClient.post<{ saved: boolean; savesCount: number }>(`/audio/${audioId}/save`),

  getSaved: (params?: { limit?: number; cursor?: string }) =>
    apiClient.get<AudioResponse>('/audio/saved', { params }),
};

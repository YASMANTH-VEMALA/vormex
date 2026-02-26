// Post Types - Complete TypeScript definitions for Posts & Feed API

export type PostKind = 'POST' | 'ARTICLE_REDIRECT';

// Reaction types matching backend enum
export type ReactionType = 'LIKE' | 'CELEBRATE' | 'SUPPORT' | 'INSIGHTFUL' | 'CURIOUS';

export interface ReactionSummary {
  type: ReactionType;
  count: number;
}

export type PostType = 
  | 'TEXT' 
  | 'IMAGE' 
  | 'VIDEO' 
  | 'DOCUMENT' 
  | 'LINK' 
  | 'POLL' 
  | 'ARTICLE' 
  | 'CELEBRATION' 
  | 'MIXED';

export type PostVisibility = 'PUBLIC' | 'CONNECTIONS' | 'PRIVATE';

export type CelebrationType = 
  | 'WORK_ANNIVERSARY' 
  | 'NEW_JOB' 
  | 'JOB_CHANGE' 
  | 'PROMOTION' 
  | 'NEW_POSITION' 
  | 'BIRTHDAY' 
  | 'GRADUATION' 
  | 'CERTIFICATION';

export interface PostAuthor {
  id: string;
  username: string;
  name: string;
  profileImage: string | null;
  headline?: string | null;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  hasVoted?: boolean;
  percentage?: number;
}

export interface Post {
  id: string;
  kind?: PostKind;
  type: PostType;
  authorId?: string;
  author: PostAuthor;
  
  // Content
  content: string | null;
  contentType: string;
  mentions?: string[];
  
  // IMAGE specific
  mediaUrls: string[];
  mediaCount: number;
  
  // VIDEO specific
  videoUrl: string | null;
  videoThumbnail: string | null;
  videoDuration: number | null;
  videoSize: number | null;
  videoFormat: string | null;
  
  // DOCUMENT specific
  documentUrl: string | null;
  documentName: string | null;
  documentType: string | null;
  documentSize: number | null;
  documentPages: number | null;
  documentThumbnail: string | null;
  
  // LINK specific
  linkUrl: string | null;
  linkTitle: string | null;
  linkDescription: string | null;
  linkImage: string | null;
  linkDomain: string | null;
  
  // ARTICLE specific
  articleTitle: string | null;
  articleCoverImage: string | null;
  articleReadTime: number | null;
  articleTags: string[];
  
  // POLL specific
  pollDuration?: number | null;
  pollEndsAt?: string | null;
  pollOptions?: PollOption[];
  userVotedOptionId?: string | null;
  showResultsBeforeVote?: boolean;
  
  // CELEBRATION specific
  celebrationType: CelebrationType | null;
  celebrationMeta: Record<string, any> | null;
  celebrationBadge: string | null;
  
  // Visibility
  visibility: PostVisibility;
  
  // Engagement metrics
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  isLiked: boolean;
  isSaved?: boolean;
  userReactionType?: ReactionType | null;
  reactionSummary?: ReactionSummary[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  author: PostAuthor;
  content: string;
  contentType: string;
  mentions: string[];
  likesCount: number;
  replyCount: number;
  isLiked: boolean;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
  hasMore?: boolean; // Derived from nextCursor if not provided
}

export interface CommentsResponse {
  comments: Comment[];
  hasMore: boolean;
  total: number;
}

// Create Post Request Types
export interface CreateTextPostRequest {
  type: 'TEXT';
  content: string;
  visibility?: PostVisibility;
  mentions?: string[];
}

export interface CreateImagePostRequest {
  type: 'IMAGE';
  content?: string;
  images: File[];
  visibility?: PostVisibility;
  mentions?: string[];
}

export interface CreateVideoPostRequest {
  type: 'VIDEO';
  content?: string;
  video: File;
  visibility?: PostVisibility;
  mentions?: string[];
}

export interface CreateDocumentPostRequest {
  type: 'DOCUMENT';
  content?: string;
  document: File;
  visibility?: PostVisibility;
  mentions?: string[];
}

export interface CreateLinkPostRequest {
  type: 'LINK';
  content?: string;
  linkUrl: string;
  visibility?: PostVisibility;
  mentions?: string[];
}

export interface CreatePollPostRequest {
  type: 'POLL';
  content?: string;
  pollOptions: string[];
  pollDuration: number; // hours
  showResultsBeforeVote?: boolean;
  visibility?: PostVisibility;
  mentions?: string[];
}

export interface CreateArticlePostRequest {
  type: 'ARTICLE';
  articleTitle: string;
  content: string;
  articleCoverImage?: File;
  articleTags?: string[];
  visibility?: PostVisibility;
}

export interface CreateCelebrationPostRequest {
  type: 'CELEBRATION';
  content?: string;
  celebrationType: CelebrationType;
  celebrationMeta?: Record<string, any>;
  visibility?: PostVisibility;
}

export interface CreateMixedPostRequest {
  type: 'MIXED';
  content?: string;
  images?: File[];
  video?: File;
  document?: File;
  linkUrl?: string;
  visibility?: PostVisibility;
  mentions?: string[];
}

export type CreatePostRequest = 
  | CreateTextPostRequest
  | CreateImagePostRequest
  | CreateVideoPostRequest
  | CreateDocumentPostRequest
  | CreateLinkPostRequest
  | CreatePollPostRequest
  | CreateArticlePostRequest
  | CreateCelebrationPostRequest
  | CreateMixedPostRequest;

// Notification Types
export type NotificationType = 
  | 'like'
  | 'comment'
  | 'mention'
  | 'comment_mention'
  | 'comment_like'
  | 'follow'
  | 'reply';

export interface Notification {
  id: string;
  type: NotificationType;
  fromUser: PostAuthor;
  postId?: string;
  commentId?: string;
  content?: string;
  isRead: boolean;
  createdAt: string;
}

export interface MentionUser {
  id: string;
  username: string;
  name: string;
  profileImage: string | null;
}

export interface MentionNotification {
  id: string;
  postId: string;
  commentId: string | null;
  mentionedBy: PostAuthor;
  content: string;
  isRead: boolean;
  createdAt: string;
}

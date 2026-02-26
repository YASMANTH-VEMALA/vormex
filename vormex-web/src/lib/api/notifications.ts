import apiClient from './client';

export type NotificationType =
  | 'like'
  | 'comment'
  | 'comment_reply'
  | 'mention'
  | 'follow'
  | 'connection_request'
  | 'connection_accepted'
  | 'reel_like'
  | 'reel_comment'
  | 'reel_comment_reply'
  | 'reel_share'
  | 'reel_mention'
  | 'reel_view_milestone'
  | 'message'
  | 'streak_milestone'
  | 'streak_lost'
  | 'xp_earned'
  | 'post_share'
  // Legacy/Post types for compatibility
  | 'POST_REACTION'
  | 'POST_LIKE'
  | 'COMMENT'
  | 'COMMENT_LIKE'
  | 'MENTION'
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_ACCEPTED'
  | 'POLL_VOTE'
  | 'POST_SHARE'
  | 'GROUP_INVITE'
  | 'GROUP_JOIN_REQUEST'
  | 'GROUP_JOIN_APPROVED';

export interface NotificationActor {
  id: string;
  username: string;
  name: string;
  profileImage: string | null;
}

export interface NotificationPost {
  id: string;
  content: string;
  mediaUrls: string[];
}

export interface NotificationReel {
  id: string;
  title: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actor: NotificationActor | null;
  post: NotificationPost | null;
  reel: NotificationReel | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  // Compatibility fields for Notifications component
  content?: string;
  postPreview?: string;
  reactionType?: string | null;
  postId?: string | null;
  commentId?: string | null;
  reelId?: string | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface NotificationSettings {
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  follows: boolean;
  reelLikes: boolean;
  reelComments: boolean;
  reelShares: boolean;
  messages: boolean;
  streaks: boolean;
  email: boolean;
  push: boolean;
}

export const notificationsApi = {
  getAll: (params?: { cursor?: string; limit?: number; unreadOnly?: boolean }) =>
    apiClient.get<NotificationsResponse>('/notifications', { params }),

  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count'),

  markAsRead: (notificationIds: string[]) =>
    apiClient.post<{ success: boolean }>('/notifications/read', { notificationIds }),

  markAllAsRead: () =>
    apiClient.post<{ success: boolean }>('/notifications/read-all'),

  deleteNotification: (notificationId: string) =>
    apiClient.delete<{ success: boolean }>(`/notifications/${notificationId}`),

  getSettings: () =>
    apiClient.get<{ settings: NotificationSettings }>('/notifications/settings'),
};

// Transform backend notification to component format
function transformNotification(n: Notification): Notification {
  const typeMap: Record<string, NotificationType> = {
    like: 'POST_LIKE',
    comment: 'COMMENT',
    comment_reply: 'COMMENT_LIKE',
    mention: 'MENTION',
    follow: 'CONNECTION_ACCEPTED',
    connection_request: 'CONNECTION_REQUEST',
    connection_accepted: 'CONNECTION_ACCEPTED',
    reel_like: 'POST_LIKE',
    reel_comment: 'COMMENT',
    reel_comment_reply: 'COMMENT_LIKE',
    reel_share: 'POST_SHARE',
    reel_mention: 'MENTION',
    post_share: 'POST_SHARE',
  };
  const mappedType = typeMap[n.type] || n.type;
  const data = n.data as Record<string, unknown> | null;
  return {
    ...n,
    type: mappedType,
    content: n.body,
    postPreview: (data?.commentPreview as string) || (typeof n.body === 'string' ? n.body.slice(0, 50) : ''),
    postId: n.post?.id ?? (data?.postId as string),
    commentId: data?.commentId as string,
    reelId: n.reel?.id ?? (data?.reelId as string),
    reactionType: data?.reactionType as string,
  };
}

/** Get notifications - for Notifications component */
export async function getNotifications(params?: { cursor?: string; limit?: number; unreadOnly?: boolean }) {
  const data = (await apiClient.get('/notifications', { params })) as unknown as NotificationsResponse;
  return {
    notifications: data.notifications.map(transformNotification),
    nextCursor: data.nextCursor,
    hasMore: data.hasMore,
  };
}

/** Get unread count - for Notifications component */
export async function getUnreadNotificationCount() {
  return apiClient.get<{ count: number }>('/notifications/unread-count');
}

/** Mark notifications as read - for Notifications component */
export async function markNotificationsAsRead(notificationIds: string[]) {
  await apiClient.post('/notifications/read', { notificationIds });
}

/** Mark all notifications as read - for Notifications component */
export async function markAllNotificationsAsRead() {
  await apiClient.post('/notifications/read-all');
}

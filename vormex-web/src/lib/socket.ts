// Socket.IO Client for Real-time Features

import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/auth/authHelpers';
import { BACKEND_ORIGIN } from '@/lib/utils/constants';

const SOCKET_URL = BACKEND_ORIGIN;

let socket: Socket | null = null;

// Reaction types matching backend enum
export type ReactionType = 'LIKE' | 'CELEBRATE' | 'SUPPORT' | 'INSIGHTFUL' | 'CURIOUS';

export interface ReactionSummary {
  type: ReactionType;
  count: number;
}

export interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: { message: string }) => void;
  
  // Post events
  onPostCreated?: (data: { post: any }) => void;
  onPostLiked?: (data: { 
    postId: string; 
    userId: string; 
    liked: boolean; 
    likesCount: number;
    reactionType?: ReactionType | null;
    reactionSummary?: ReactionSummary[];
  }) => void;
  onPostReacted?: (data: { 
    postId: string; 
    userId: string; 
    liked: boolean; 
    reactionType: ReactionType | null;
    likesCount: number;
    reactionSummary: ReactionSummary[];
  }) => void;
  
  // Comment events
  onCommentCreated?: (data: { postId: string; comment: any; commentsCount: number }) => void;
  onCommentLiked?: (data: { commentId: string; userId: string; liked: boolean; likesCount: number }) => void;
  
  // Poll events
  onPollUpdated?: (data: { 
    postId: string; 
    pollOptions: any[]; 
    voterId: string;
    votedOptionId?: string;
    totalVotes?: number;
  }) => void;
  
  // Notification events
  onNotificationComment?: (data: any) => void;
  onNotificationMention?: (data: any) => void;
  onNotificationLike?: (data: any) => void;
  onNotificationReaction?: (data: any) => void;
  onNotificationCommentLike?: (data: any) => void;
  
  // User events
  onUserOnline?: (data: { userId: string }) => void;
  onUserOffline?: (data: { userId: string }) => void;
  onUserLocationChanged?: (data: { userId: string; city: string; state: string; country: string }) => void;
  
  // Location request
  onLocationRequest?: (data: { message: string; timestamp: Date }) => void;
  
  // Story events
  onStoryCreated?: (data: { story: any; author: any; timestamp: Date }) => void;
  onStoryDeleted?: (data: { storyId: string; authorId: string; timestamp: Date }) => void;
  onStoryViewed?: (data: { storyId: string; viewerId: string; viewCount: number; timestamp: Date }) => void;
  onStoryReaction?: (data: { storyId: string; user: any; reaction: string; reactionCount: number; timestamp: Date }) => void;
  onStoryReply?: (data: { storyId: string; reply: any; timestamp: Date }) => void;
  
  // Chat events
  onChatNewMessage?: (data: { conversationId: string; message: any }) => void;
  onChatNotification?: (data: { type: string; conversationId: string; message: any; sender: any }) => void;
  onChatUserTyping?: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  onChatMessagesDelivered?: (data: { conversationId: string; deliveredAt: Date }) => void;
  onChatMessagesRead?: (data: { conversationId: string; readBy: string; readAt: Date }) => void;
  onChatMessageDeleted?: (data: { messageId: string; conversationId: string; deletedBy?: string; forEveryone: boolean }) => void;
  onChatMessageEdited?: (data: { messageId: string; conversationId: string; content: string; editedAt: Date }) => void;
  onChatMessageReaction?: (data: { messageId: string; conversationId: string; userId: string; emoji: string; action: string }) => void;
  onChatMessageDelivered?: (data: { messageId: string; deliveredAt: Date }) => void;
  
  // Reel events
  onReelEngagementUpdate?: (data: { 
    reelId: string; 
    type: 'like' | 'comment' | 'share'; 
    userId?: string;
    liked?: boolean;
    likesCount?: number;
    commentsCount?: number;
    sharesCount?: number;
    comment?: { id: string; author: any; content: string; parentId?: string };
  }) => void;
  
  // New notification event
  onNotificationNew?: (data: {
    id: string;
    type: string;
    title: string;
    body: string;
    actor: any;
    post?: any;
    reel?: any;
    data: any;
    isRead: boolean;
    createdAt: string;
  }) => void;
}

/**
 * Initialize Socket.IO connection
 */
export function initializeSocket(handlers?: SocketEventHandlers): Socket {
  // If socket exists and is connected, just register new handlers
  if (socket?.connected) {
    console.log('Socket already connected, registering handlers');
    if (handlers) {
      registerSocketHandlers(socket, handlers);
    }
    return socket;
  }
  
  // If socket exists but disconnected, reuse it if still connecting to avoid "closed before established" warnings
  if (socket && !socket.connected) {
    // Only clean up if we've been disconnected (not in initial connection phase)
    const wasConnecting = (socket as Socket & { connecting?: boolean }).connecting;
    if (!wasConnecting) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    } else {
      // Socket is still trying to connect - just register handlers and return
      if (handlers) {
        registerSocketHandlers(socket, handlers);
      }
      return socket;
    }
  }
  
  const token = getToken();
  
  if (!token) {
    console.warn('⚠️ No auth token found, socket connection may fail');
  }
  
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  
  // Register handlers if provided
  if (handlers) {
    registerSocketHandlers(socket, handlers);
  }
  
  return socket;
}

/**
 * Register event handlers on an existing socket connection
 */
function registerSocketHandlers(sock: Socket, handlers: SocketEventHandlers): void {
  // Connection events
  if (handlers.onConnect) {
    sock.off('connect'); // Remove previous handler
    sock.on('connect', () => {
      console.log('✅ Socket connected:', sock?.id);
      handlers.onConnect?.();
    });
  }
  
  if (handlers.onDisconnect) {
    sock.off('disconnect');
    sock.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      handlers.onDisconnect?.();
    });
  }
  
  sock.off('connect_error');
  sock.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  if (handlers.onError) {
    sock.off('error');
    sock.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      handlers.onError?.(error);
    });
  }
  
  // Post events - use addListener to allow multiple handlers
  if (handlers.onPostCreated) {
    sock.on('post:created', handlers.onPostCreated);
  }
  
  if (handlers.onPostLiked) {
    sock.on('post:liked', handlers.onPostLiked);
  }
  
  if (handlers.onPostReacted) {
    sock.on('post:reacted', handlers.onPostReacted);
  }
  
  // Comment events
  if (handlers.onCommentCreated) {
    sock.on('comment:created', handlers.onCommentCreated);
  }
  
  if (handlers.onCommentLiked) {
    sock.on('comment:liked', handlers.onCommentLiked);
  }
  
  // Poll events
  if (handlers.onPollUpdated) {
    sock.on('poll:updated', handlers.onPollUpdated);
  }
  
  // Notification events
  if (handlers.onNotificationComment) {
    sock.on('notification:comment', handlers.onNotificationComment);
  }
  
  if (handlers.onNotificationReaction) {
    sock.on('notification:reaction', handlers.onNotificationReaction);
  }
  
  if (handlers.onNotificationMention) {
    sock.on('notification:mention', handlers.onNotificationMention);
  }
  
  if (handlers.onNotificationLike) {
    sock.on('notification:like', handlers.onNotificationLike);
  }
  
  if (handlers.onNotificationCommentLike) {
    sock.on('notification:comment_like', handlers.onNotificationCommentLike);
  }
  
  // User events
  if (handlers.onUserOnline) {
    sock.on('user:online', handlers.onUserOnline);
  }
  
  if (handlers.onUserOffline) {
    sock.on('user:offline', handlers.onUserOffline);
  }
  
  if (handlers.onUserLocationChanged) {
    sock.on('user:location_changed', handlers.onUserLocationChanged);
  }
  
  // Location request
  if (handlers.onLocationRequest) {
    sock.on('location:request', handlers.onLocationRequest);
  }
  
  // Story events
  if (handlers.onStoryCreated) {
    sock.on('story:created', handlers.onStoryCreated);
  }
  
  if (handlers.onStoryDeleted) {
    sock.on('story:deleted', handlers.onStoryDeleted);
  }
  
  if (handlers.onStoryViewed) {
    sock.on('story:viewed', handlers.onStoryViewed);
  }
  
  if (handlers.onStoryReaction) {
    sock.on('story:reaction', handlers.onStoryReaction);
  }
  
  if (handlers.onStoryReply) {
    sock.on('story:reply', handlers.onStoryReply);
  }
  
  // Chat events
  if (handlers.onChatNewMessage) {
    sock.on('chat:new_message', handlers.onChatNewMessage);
  }
  
  if (handlers.onChatNotification) {
    sock.on('chat:notification', handlers.onChatNotification);
  }
  
  if (handlers.onChatUserTyping) {
    sock.on('chat:user_typing', handlers.onChatUserTyping);
  }
  
  if (handlers.onChatMessagesDelivered) {
    sock.on('chat:messages_delivered', handlers.onChatMessagesDelivered);
  }
  
  if (handlers.onChatMessagesRead) {
    sock.on('chat:messages_read', handlers.onChatMessagesRead);
  }
  
  if (handlers.onChatMessageDeleted) {
    sock.on('chat:message_deleted', handlers.onChatMessageDeleted);
  }
  
  if (handlers.onChatMessageEdited) {
    sock.on('chat:message_edited', handlers.onChatMessageEdited);
  }
  
  if (handlers.onChatMessageReaction) {
    sock.on('chat:message_reaction', handlers.onChatMessageReaction);
  }
  
  if (handlers.onChatMessageDelivered) {
    sock.on('chat:message_delivered', handlers.onChatMessageDelivered);
  }
  
  // Reel events
  if (handlers.onReelEngagementUpdate) {
    sock.on('reel:engagement_update', handlers.onReelEngagementUpdate);
  }
  
  // New notification event
  if (handlers.onNotificationNew) {
    sock.on('notification:new', handlers.onNotificationNew);
  }
}

/**
 * Get the current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Remove specific event handlers from the socket
 */
export function removeSocketHandlers(eventNames: string[]): void {
  if (!socket) return;
  eventNames.forEach(event => {
    socket?.off(event);
  });
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join a post room for real-time updates
 */
export function joinPostRoom(postId: string): void {
  socket?.emit('post:join', { postId });
}

/**
 * Leave a post room
 */
export function leavePostRoom(postId: string): void {
  socket?.emit('post:leave', { postId });
}

/**
 * Like/Unlike a post via WebSocket (legacy, uses default LIKE reaction)
 */
export function likePost(postId: string): void {
  socket?.emit('post:like', { postId });
}

/**
 * React to a post via WebSocket with specific reaction type
 */
export function reactToPost(postId: string, reactionType: ReactionType): void {
  socket?.emit('post:react', { postId, reactionType });
}

/**
 * Create a comment via WebSocket
 */
export function createComment(
  postId: string,
  content: string,
  parentId?: string,
  mentions?: string[]
): void {
  socket?.emit('post:comment', { postId, content, parentId, mentions });
}

/**
 * Like/Unlike a comment via WebSocket
 */
export function likeComment(commentId: string, postId: string): void {
  socket?.emit('comment:like', { commentId, postId });
}

/**
 * Vote on a poll via WebSocket
 */
export function votePoll(postId: string, optionId: string): void {
  socket?.emit('poll:vote', { postId, optionId });
}

/**
 * Update location via WebSocket
 */
export function updateLocation(data: {
  lat?: number;
  lng?: number;
  accuracy?: number;
  activity?: string;
}): void {
  socket?.emit('location:update', data);
}

/**
 * Send typing indicator (for future use)
 */
export function sendTypingIndicator(postId: string, isTyping: boolean): void {
  socket?.emit('typing', { postId, isTyping });
}

// ============================================
// CHAT SOCKET FUNCTIONS
// ============================================

/**
 * Join a chat conversation room
 */
export function joinChatRoom(conversationId: string): void {
  socket?.emit('chat:join', { conversationId });
}

/**
 * Leave a chat conversation room
 */
export function leaveChatRoom(conversationId: string): void {
  socket?.emit('chat:leave', { conversationId });
}

/**
 * Send a chat message via WebSocket
 */
export function sendChatMessage(data: {
  conversationId: string;
  content: string;
  contentType?: string;
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
}): void {
  socket?.emit('chat:send_message', data);
}

/**
 * Send typing indicator for chat
 */
export function sendChatTyping(conversationId: string, isTyping: boolean): void {
  socket?.emit('chat:typing', { conversationId, isTyping });
}

/**
 * Mark chat messages as read
 */
export function markChatAsRead(conversationId: string): void {
  socket?.emit('chat:mark_read', { conversationId });
}

/**
 * Delete a chat message
 */
export function deleteChatMessage(messageId: string, conversationId: string, forEveryone?: boolean): void {
  socket?.emit('chat:delete_message', { messageId, conversationId, forEveryone });
}

/**
 * Edit a chat message
 */
export function editChatMessage(messageId: string, conversationId: string, content: string): void {
  socket?.emit('chat:edit_message', { messageId, conversationId, content });
}

/**
 * React to a chat message
 */
export function reactToChatMessage(messageId: string, conversationId: string, emoji: string): void {
  socket?.emit('chat:react', { messageId, conversationId, emoji });
}

// ============================================
// REEL SOCKET FUNCTIONS
// ============================================

/**
 * Join a reel room for real-time updates
 */
export function joinReelRoom(reelId: string): void {
  socket?.emit('reel:join', { reelId });
}

/**
 * Leave a reel room
 */
export function leaveReelRoom(reelId: string): void {
  socket?.emit('reel:leave', { reelId });
}

/**
 * Like a reel via WebSocket
 */
export function likeReel(reelId: string): void {
  socket?.emit('reel:like', { reelId });
}

/**
 * Create a reel comment via WebSocket
 */
export function createReelComment(
  reelId: string,
  content: string,
  parentId?: string,
  mentions?: string[]
): void {
  socket?.emit('reel:comment', { reelId, content, parentId, mentions });
}

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinPostRoom,
  leavePostRoom,
  likePost,
  createComment,
  likeComment,
  votePoll,
  updateLocation,
  sendTypingIndicator,
  // Chat functions
  joinChatRoom,
  leaveChatRoom,
  sendChatMessage,
  sendChatTyping,
  markChatAsRead,
  deleteChatMessage,
  editChatMessage,
  reactToChatMessage,
  // Reel functions
  joinReelRoom,
  leaveReelRoom,
  likeReel,
  createReelComment,
};

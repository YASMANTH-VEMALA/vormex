import apiClient from './client';

// ============================================
// Types
// ============================================

export interface ChatUser {
  id: string;
  username: string;
  name: string;
  profileImage: string | null;
  isOnline: boolean;
  lastActiveAt: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  contentType: string;
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  fileSize?: number;
  status: 'SENT' | 'DELIVERED' | 'READ';
  deliveredAt?: string;
  readAt?: string;
  isDeleted: boolean;
  isEdited?: boolean; // Client-side flag to track if message was edited
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    contentType: string;
    senderId: string;
  };
  sender: ChatUser;
  reactions: MessageReaction[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  id: string;
  userId: string;
  emoji: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1: ChatUser;
  participant2: ChatUser;
  otherParticipant: ChatUser;
  lastMessage?: {
    id: string;
    content: string;
    contentType: string;
    senderId: string;
    status: 'SENT' | 'DELIVERED' | 'READ';
    createdAt: string;
  };
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

// ============================================
// Chat API Functions
// ============================================

/**
 * Get all conversations for the current user
 */
export async function getConversations(
  limit?: number,
  cursor?: string
): Promise<ConversationsResponse> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', String(limit));
  if (cursor) params.append('cursor', cursor);
  
  return apiClient.get(`/chat/conversations?${params.toString()}`);
}

/**
 * Get or create a conversation with another user
 */
export async function getOrCreateConversation(participantId: string): Promise<Conversation> {
  return apiClient.post('/chat/conversations', { participantId });
}

/**
 * Get a specific conversation
 */
export async function getConversation(conversationId: string): Promise<Conversation> {
  return apiClient.get(`/chat/conversations/${conversationId}`);
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: string,
  limit?: number,
  cursor?: string
): Promise<MessagesResponse> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', String(limit));
  if (cursor) params.append('cursor', cursor);
  
  return apiClient.get(`/chat/conversations/${conversationId}/messages?${params.toString()}`);
}

/**
 * Send a message (REST fallback - prefer WebSocket)
 */
export async function sendMessage(
  conversationId: string,
  data: {
    content: string;
    contentType?: string;
    mediaUrl?: string;
    mediaType?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: string;
  }
): Promise<Message> {
  return apiClient.post(`/chat/conversations/${conversationId}/messages`, data);
}

/**
 * Mark messages as read
 */
export async function markAsRead(conversationId: string): Promise<{ updatedCount: number; readAt: string }> {
  return apiClient.post(`/chat/conversations/${conversationId}/read`);
}

/**
 * Delete a message
 */
export async function deleteMessage(
  messageId: string,
  forEveryone?: boolean
): Promise<{ success: boolean }> {
  return apiClient.delete(`/chat/messages/${messageId}`, { 
    data: { forEveryone } 
  });
}

/**
 * Edit a message
 */
export async function editMessage(messageId: string, content: string): Promise<Message> {
  return apiClient.patch(`/chat/messages/${messageId}`, { content });
}

/**
 * Add reaction to a message
 */
export async function addReaction(
  messageId: string,
  emoji: string
): Promise<{ action: 'added' | 'removed' | 'updated'; emoji: string }> {
  return apiClient.post(`/chat/messages/${messageId}/reactions`, { emoji });
}

/**
 * Get unread message count
 */
export async function getUnreadCount(): Promise<{ unreadCount: number }> {
  return apiClient.get('/chat/unread-count');
}

/**
 * Search messages
 */
export async function searchMessages(
  query: string,
  limit?: number
): Promise<{ messages: Message[] }> {
  const params = new URLSearchParams();
  params.append('q', query);
  if (limit) params.append('limit', String(limit));
  
  return apiClient.get(`/chat/search?${params.toString()}`);
}

/**
 * Upload chat media (image, video, document, audio)
 */
export async function uploadChatMedia(
  file: File,
  mediaType: 'image' | 'video' | 'document' | 'audio',
  onProgress?: (progress: number) => void
): Promise<{
  mediaUrl: string;
  fileName: string;
  fileSize: number;
  mediaType: string;
}> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mediaType', mediaType);
  
  // Use axios with proper config for file uploads
  return apiClient.post('/chat/upload', formData, {
    timeout: 120000, // 2 minutes timeout for large files
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        onProgress(progress);
      }
    },
  });
}

// ============================================
// Message Limit (Connection-based)
// ============================================

export interface MessageLimitStatus {
  canSend: boolean;
  isConnected: boolean;
  messagesSent: number;
  messagesRemaining: number;
  limit: number;
}

/**
 * Get message limit status for a user
 * Non-connected users can only send 2 messages
 * Connected users have unlimited messaging
 */
export async function getMessageLimitStatus(userId: string): Promise<MessageLimitStatus> {
  return apiClient.get(`/chat/message-limit/${userId}`);
}

// ============================================
// Message Requests (from non-connected users)
// ============================================

export interface MessageRequest extends Conversation {
  isMessageRequest: boolean;
  messageRequestAcceptedAt: string | null;
}

export interface MessageRequestsResponse {
  messageRequests: MessageRequest[];
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Get message requests (conversations from non-connected users)
 */
export async function getMessageRequests(
  limit?: number,
  cursor?: string
): Promise<MessageRequestsResponse> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', String(limit));
  if (cursor) params.append('cursor', cursor);
  
  return apiClient.get(`/chat/requests?${params.toString()}`);
}

/**
 * Get message requests count
 */
export async function getMessageRequestsCount(): Promise<{ count: number }> {
  return apiClient.get('/chat/requests/count');
}

/**
 * Accept a message request
 */
export async function acceptMessageRequest(
  conversationId: string
): Promise<{ message: string; conversation: Conversation }> {
  return apiClient.post(`/chat/requests/${conversationId}/accept`);
}

/**
 * Decline a message request
 */
export async function declineMessageRequest(
  conversationId: string
): Promise<{ message: string }> {
  return apiClient.delete(`/chat/requests/${conversationId}`);
}

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Message, getMessages } from '@/lib/api/chat';
import { 
  getSocket, 
  joinChatRoom, 
  leaveChatRoom, 
  markChatAsRead,
  deleteChatMessage,
  editChatMessage,
  reactToChatMessage
} from '@/lib/socket';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import MessageMenu, { MessageQuickActions } from './MessageMenu';
import { WALLPAPER_OPTIONS } from './ChatSettingsPanel';
import type { UploadingMessage, OptimisticMessage } from './ChatInput';
import { DEFAULT_CHAT_REACTIONS } from '@/lib/chat/customization';

interface ChatMessagesProps {
  conversationId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    username: string;
    profileImage?: string | null;
    isOnline?: boolean;
  };
  wallpaper?: string;
  availableReactions?: string[];
  animatedBubbles?: boolean;
  onReply?: (message: { id: string; content: string; senderName: string }) => void;
  uploadingMessages?: UploadingMessage[];
  optimisticMessages?: OptimisticMessage[];
  onLastMessageUpdate?: (message: string) => void;
  onMessageConfirmed?: (content: string) => void;
}

export default function ChatMessages({
  conversationId,
  currentUserId,
  otherUser,
  wallpaper = 'default',
  availableReactions = DEFAULT_CHAT_REACTIONS,
  animatedBubbles = false,
  onReply,
  uploadingMessages = [],
  optimisticMessages = [],
  onLastMessageUpdate,
  onMessageConfirmed,
}: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Scroll to a specific message and highlight it
  const scrollToMessage = useCallback((messageId: string) => {
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      // Remove highlight after 1.5 seconds
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 1500);
    }
  }, []);

  // Register message ref
  const registerMessageRef = useCallback((messageId: string, element: HTMLDivElement | null) => {
    if (element) {
      messageRefs.current.set(messageId, element);
    } else {
      messageRefs.current.delete(messageId);
    }
  }, []);

  // Fetch messages
  // Helper to determine if a message was edited based on timestamp difference
  const wasMessageEdited = (message: Message): boolean => {
    if (!message.createdAt || !message.updatedAt) return false;
    const created = new Date(message.createdAt).getTime();
    const updated = new Date(message.updatedAt).getTime();
    // Consider edited if there's at least 1 second difference
    // Prisma sets both timestamps at the exact same moment on creation
    return updated - created >= 1000;
  };

  const fetchMessages = useCallback(async (cursor?: string) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const result = await getMessages(conversationId, 50, cursor);
      
      // Add isEdited flag to each message
      const messagesWithEditFlag = result.messages.map(msg => ({
        ...msg,
        isEdited: wasMessageEdited(msg),
      }));

      if (cursor) {
        // Prepend older messages
        setMessages(prev => [...messagesWithEditFlag, ...prev]);
      } else {
        setMessages(messagesWithEditFlag);
        
        // Find the last message from the other user for AI assistant
        if (onLastMessageUpdate) {
          const lastFromOther = [...result.messages]
            .reverse()
            .find(m => m.senderId !== currentUserId && m.content);
          if (lastFromOther) {
            onLastMessageUpdate(lastFromOther.content);
          }
        }
      }

      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (err: unknown) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [conversationId, currentUserId, onLastMessageUpdate]);

  // Initial load and join room
  useEffect(() => {
    fetchMessages();
    joinChatRoom(conversationId);
    markChatAsRead(conversationId);

    return () => {
      leaveChatRoom(conversationId);
    };
  }, [conversationId, fetchMessages]);

  // Socket event listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === conversationId) {
        // Deduplicate - check if message already exists
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.message.id);
          if (exists) return prev;
          return [...prev, data.message];
        });
        setShouldAutoScroll(true);
        
        // If this is our own message, confirm it to remove optimistic version
        if (data.message.senderId === currentUserId && onMessageConfirmed) {
          onMessageConfirmed(data.message.content);
        }
        
        // Mark as read if from other user
        if (data.message.senderId !== currentUserId) {
          markChatAsRead(conversationId);
          // Update last received message for AI assistant
          if (data.message.content && onLastMessageUpdate) {
            onLastMessageUpdate(data.message.content);
          }
        }
      }
    };

    const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        setTypingUser(data.isTyping ? data.userId : null);
      }
    };

    const handleMessagesRead = (data: { conversationId: string; readBy: string; readAt: Date }) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => 
          prev.map(m => 
            m.senderId === currentUserId && m.status !== 'READ'
              ? { ...m, status: 'READ', readAt: new Date(data.readAt).toISOString() }
              : m
          )
        );
      }
    };

    const handleMessagesDelivered = (data: { conversationId: string; deliveredAt: Date }) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => 
          prev.map(m => 
            m.senderId === currentUserId && m.status === 'SENT'
              ? { ...m, status: 'DELIVERED', deliveredAt: new Date(data.deliveredAt).toISOString() }
              : m
          )
        );
      }
    };

    const handleError = (data: { message: string }) => {
      console.error('Chat socket error:', data.message);
    };

    const handleMessageDeleted = (data: { messageId: string; conversationId: string; forEveryone: boolean }) => {
      if (data.conversationId === conversationId) {
        if (data.forEveryone) {
          setMessages(prev => 
            prev.map(m => 
              m.id === data.messageId 
                ? { ...m, isDeleted: true, content: 'This message was deleted' } 
                : m
            )
          );
        } else {
          setMessages(prev => prev.filter(m => m.id !== data.messageId));
        }
      }
    };

    const handleMessageEdited = (data: { messageId: string; conversationId: string; content: string; editedAt: Date }) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => 
          prev.map(m => 
            m.id === data.messageId 
              ? { ...m, content: data.content, updatedAt: String(data.editedAt), isEdited: true } 
              : m
          )
        );
      }
    };

    const handleReaction = (data: { messageId: string; conversationId: string; userId: string; emoji: string; action: string }) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => 
          prev.map(m => {
            if (m.id !== data.messageId) return m;
            
            let reactions = [...(m.reactions || [])];
            
            if (data.action === 'removed') {
              reactions = reactions.filter(r => !(r.userId === data.userId));
            } else if (data.action === 'added') {
              reactions.push({
                id: `temp-${Date.now()}`,
                userId: data.userId,
                emoji: data.emoji,
                user: { id: data.userId, username: '', name: '' }
              });
            } else if (data.action === 'updated') {
              const index = reactions.findIndex(r => r.userId === data.userId);
              if (index >= 0) {
                reactions[index] = { ...reactions[index], emoji: data.emoji };
              }
            }
            
            return { ...m, reactions };
          })
        );
      }
    };

    // Handle chat:notification (sent to user's personal room as fallback)
    const handleChatNotification = (data: { type: string; conversationId: string; message: Message }) => {
      if (data.type === 'new_message' && data.conversationId === conversationId) {
        // Deduplicate - check if message already exists
        setMessages(prev => {
          const exists = prev.some(m => m.id === data.message.id);
          if (exists) return prev;
          return [...prev, data.message];
        });
        setShouldAutoScroll(true);
        
        // If this is our own message, confirm it to remove optimistic version
        if (data.message.senderId === currentUserId && onMessageConfirmed) {
          onMessageConfirmed(data.message.content);
        }
        
        // Mark as read if from other user
        if (data.message.senderId !== currentUserId) {
          markChatAsRead(conversationId);
          if (data.message.content && onLastMessageUpdate) {
            onLastMessageUpdate(data.message.content);
          }
        }
      }
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:notification', handleChatNotification);
    socket.on('chat:user_typing', handleTyping);
    socket.on('chat:messages_read', handleMessagesRead);
    socket.on('chat:messages_delivered', handleMessagesDelivered);
    socket.on('chat:message_deleted', handleMessageDeleted);
    socket.on('chat:message_edited', handleMessageEdited);
    socket.on('chat:message_reaction', handleReaction);
    socket.on('error', handleError);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:notification', handleChatNotification);
      socket.off('chat:user_typing', handleTyping);
      socket.off('chat:messages_read', handleMessagesRead);
      socket.off('chat:messages_delivered', handleMessagesDelivered);
      socket.off('chat:message_deleted', handleMessageDeleted);
      socket.off('chat:message_edited', handleMessageEdited);
      socket.off('chat:message_reaction', handleReaction);
      socket.off('error', handleError);
    };
  }, [conversationId, currentUserId, otherUser.id, onLastMessageUpdate, onMessageConfirmed]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldAutoScroll(false);
    }
  }, [messages, shouldAutoScroll]);

  // Scroll detection for loading more
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop < 100 && hasMore && !loadingMore) {
      fetchMessages(nextCursor);
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    
    return groups;
  }, {} as Record<string, Message[]>);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get wallpaper styles
  const wallpaperOption = WALLPAPER_OPTIONS.find(w => w.id === wallpaper) || WALLPAPER_OPTIONS[0];
  const wallpaperClasses = cn(wallpaperOption.color, wallpaperOption.pattern);

  return (
    <>
    <div 
      ref={messagesContainerRef}
      className={cn("flex-1 overflow-y-auto p-4 space-y-4", wallpaperClasses)}
      onScroll={handleScroll}
    >
      {loadingMore && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      )}

      {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
        <div key={dateKey}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-300">
              {formatDateSeparator(new Date(dateKey))}
            </div>
          </div>

          {/* Messages for this date */}
          {dateMessages.map((message, index) => {
            const prevMessage = index > 0 ? dateMessages[index - 1] : null;
            const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                showAvatar={showAvatar}
                otherUser={otherUser}
                conversationId={conversationId}
                isHighlighted={highlightedMessageId === message.id}
                onScrollToReply={scrollToMessage}
                registerRef={(el) => registerMessageRef(message.id, el)}
                onReply={onReply ? () => onReply({
                  id: message.id,
                  content: message.content,
                  senderName: message.senderId === currentUserId ? 'You' : otherUser.name,
                }) : undefined}
                onViewImage={setViewingImage}
                onViewVideo={setViewingVideo}
                availableReactions={availableReactions}
                animatedBubbles={animatedBubbles}
              />
            );
          })}
        </div>
      ))}

      {/* Optimistic Messages (sent but not yet confirmed) */}
      {optimisticMessages.map(optMsg => (
        <div key={optMsg.id} className="flex justify-end mb-2">
          <div className="max-w-[70%]">
            {/* Reply preview if present */}
            {optMsg.replyTo && (
              <div className="text-xs p-2 rounded-t-lg border-l-2 bg-blue-600/20 border-blue-400">
                <span className="text-gray-500 text-[10px]">↩ Replying to</span>
                <p className="truncate text-gray-700 dark:text-gray-300">{optMsg.replyTo.content}</p>
              </div>
            )}
            <div className={cn(
              "bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-sm",
              optMsg.replyTo && "rounded-t-none"
            )}>
              <p className="break-words whitespace-pre-wrap">{optMsg.content}</p>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
              <span>{format(new Date(optMsg.createdAt), 'HH:mm')}</span>
              <span className="animate-pulse">⏳</span>
            </div>
          </div>
        </div>
      ))}

      {/* Uploading Messages */}
      {uploadingMessages.map(uploadingMsg => (
        <div key={uploadingMsg.id} className="flex justify-end mb-2">
          <div className="relative max-w-[70%]">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-sm">
              {/* Preview for images/videos */}
              {uploadingMsg.preview && (uploadingMsg.type === 'image' || uploadingMsg.type === 'video') && (
                <div className="relative mb-2 rounded-lg overflow-hidden">
                  {uploadingMsg.type === 'image' ? (
                    <img 
                      src={uploadingMsg.preview} 
                      alt="Uploading" 
                      className="max-w-full opacity-70"
                      style={{ maxHeight: '200px' }}
                    />
                  ) : (
                    <video 
                      src={uploadingMsg.preview}
                      className="max-w-full opacity-70"
                      style={{ maxHeight: '200px' }}
                      muted
                    />
                  )}
                  {/* Overlay with spinner */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="relative">
                      <svg className="w-12 h-12" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeDasharray={`${uploadingMsg.progress}, 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                        {uploadingMsg.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* For audio/documents - show icon with progress */}
              {(uploadingMsg.type === 'audio' || uploadingMsg.type === 'document') && (
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeDasharray={`${uploadingMsg.progress}, 100`}
                        strokeLinecap="round"
                        transform="rotate(-90 18 18)"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs">
                      {uploadingMsg.type === 'audio' ? '🎤' : '📄'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm truncate">{uploadingMsg.fileName || 'Uploading...'}</p>
                    <p className="text-xs opacity-70">Sending... {uploadingMsg.progress}%</p>
                  </div>
                </div>
              )}
              
              {/* Text label */}
              {(uploadingMsg.type === 'image' || uploadingMsg.type === 'video') && (
                <p className="text-sm">
                  {uploadingMsg.type === 'image' ? '📷 Sending photo...' : '🎥 Sending video...'}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {typingUser && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <div className="flex gap-1">
            <span className="animate-bounce">•</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>•</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
          </div>
          <span>{otherUser.name} is typing...</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>

    {/* Image Viewer Modal */}
    {viewingImage && (
      <div 
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={() => setViewingImage(null)}
      >
        <button
          onClick={() => setViewingImage(null)}
          className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img 
          src={viewingImage} 
          alt="Full size image" 
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
        <a
          href={viewingImage}
          download
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </a>
      </div>
    )}

    {/* Video Viewer Modal */}
    {viewingVideo && (
      <div 
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
        onClick={() => setViewingVideo(null)}
      >
        <button
          onClick={() => setViewingVideo(null)}
          className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded-full transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <video 
          src={viewingVideo} 
          controls
          autoPlay
          className="max-w-full max-h-full rounded-lg"
          style={{ maxHeight: '90vh', maxWidth: '90vw' }}
          onClick={(e) => e.stopPropagation()}
        />
        <a
          href={viewingVideo}
          download
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </a>
      </div>
    )}
    </>
  );
}

// ============================================
// Message Bubble Component
// ============================================
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  otherUser: {
    name: string;
    profileImage?: string | null;
  };
  conversationId: string;
  isHighlighted?: boolean;
  onScrollToReply?: (messageId: string) => void;
  registerRef?: (el: HTMLDivElement | null) => void;
  onReply?: () => void;
  onViewImage?: (url: string) => void;
  onViewVideo?: (url: string) => void;
  availableReactions?: string[];
  animatedBubbles?: boolean;
}

function MessageBubble({ 
  message, 
  isOwn, 
  showAvatar, 
  otherUser,
  conversationId,
  isHighlighted = false,
  onScrollToReply,
  registerRef,
  onReply,
  onViewImage,
  onViewVideo,
  availableReactions = DEFAULT_CHAT_REACTIONS,
  animatedBubbles = false,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const handleDelete = (forEveryone: boolean) => {
    deleteChatMessage(message.id, conversationId, forEveryone);
    setShowActions(false);
    setShowMenu(false);
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      editChatMessage(message.id, conversationId, editContent);
    }
    setIsEditing(false);
  };

  const handleReaction = (emoji: string) => {
    reactToChatMessage(message.id, conversationId, emoji);
    setShowReactions(false);
  };

  if (message.isDeleted) {
    return (
      <div 
        ref={registerRef}
        className={cn(
          'flex items-center gap-2',
          isOwn ? 'justify-end' : 'justify-start'
        )}
      >
        <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 italic px-4 py-2 rounded-lg text-sm">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={registerRef}
      className={cn(
        'flex gap-2 group transition-all duration-300',
        isOwn ? 'justify-end' : 'justify-start',
        isHighlighted && 'bg-yellow-100/50 dark:bg-yellow-900/30 -mx-2 px-2 py-1 rounded-lg'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
    >
      {/* Avatar for received messages */}
      {!isOwn && (
        <div className={cn('w-8 h-8 flex-shrink-0', !showAvatar && 'invisible')}>
          {showAvatar && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              {otherUser.profileImage ? (
                <img
                  src={otherUser.profileImage}
                  alt={otherUser.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                otherUser.name.charAt(0).toUpperCase()
              )}
            </div>
          )}
        </div>
      )}

      <div className={cn('max-w-[70%] relative', isOwn && 'order-first')}>
        {/* Reply preview - clickable to scroll to original message */}
        {message.replyTo && (
          <button
            onClick={() => onScrollToReply?.(message.replyTo!.id)}
            className={cn(
              'text-xs p-2 rounded-t-lg border-l-2 w-full text-left cursor-pointer hover:opacity-80 transition-opacity',
              isOwn 
                ? 'bg-blue-600/20 border-blue-400' 
                : 'bg-gray-100 dark:bg-gray-800 border-gray-400'
            )}
          >
            <span className="text-gray-500 text-[10px]">↩ Replying to</span>
            <p className="truncate text-gray-700 dark:text-gray-300">{message.replyTo.content}</p>
          </button>
        )}

        {/* Message content */}
        <div className={cn(
          'px-4 py-2 rounded-2xl relative',
          animatedBubbles && 'shadow-sm shadow-blue-400/15 transition-transform duration-150 hover:scale-[1.01]',
          isOwn 
            ? 'bg-blue-600 text-white rounded-br-sm' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm',
          message.replyTo && 'rounded-t-none'
        )}>
          {/* Image content */}
          {message.mediaUrl && message.contentType === 'image' && (
            <button 
              onClick={() => onViewImage?.(message.mediaUrl!)}
              className="block w-full text-left"
            >
              <img 
                src={message.mediaUrl} 
                alt="Shared image" 
                className="rounded-lg max-w-full mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxHeight: '300px' }}
              />
            </button>
          )}

          {/* Video content */}
          {message.mediaUrl && message.contentType === 'video' && (
            <div className="relative group cursor-pointer mb-2" onClick={() => onViewVideo?.(message.mediaUrl!)}>
              <video 
                src={message.mediaUrl}
                className="rounded-lg max-w-full"
                style={{ maxHeight: '300px' }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors rounded-lg">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Audio content */}
          {message.mediaUrl && message.contentType === 'audio' && (
            <div className={cn(
              'flex items-center gap-3 p-2 rounded-lg mb-2',
              isOwn ? 'bg-blue-700/50' : 'bg-gray-200 dark:bg-gray-700'
            )}>
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-lg">🎤</span>
              </div>
              <audio 
                src={message.mediaUrl}
                controls
                className="flex-1 h-8"
                style={{ maxWidth: '200px' }}
              />
            </div>
          )}

          {/* Document content */}
          {message.mediaUrl && message.contentType === 'document' && (
            <a 
              href={message.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors',
                isOwn ? 'bg-blue-700/50 hover:bg-blue-700/70' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                <span className="text-white text-lg">📄</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('font-medium truncate text-sm', isOwn ? 'text-white' : 'text-gray-900 dark:text-white')}>
                  {message.fileName || 'Document'}
                </p>
                {message.fileSize && (
                  <p className={cn('text-xs', isOwn ? 'text-blue-200' : 'text-gray-500')}>
                    {(message.fileSize / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </a>
          )}

          {/* Generic file content */}
          {message.mediaUrl && message.contentType === 'file' && (
            <a 
              href={message.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/10 p-2 rounded mb-2 hover:bg-white/20"
            >
              <span>📎</span>
              <span className="truncate">{message.fileName || 'File'}</span>
            </a>
          )}

          {/* Shared Reel content - thumbnail only, click to open reel */}
          {message.contentType === 'reel' && (() => {
            let reelId: string | null = null;
            try {
              const data = JSON.parse(message.content);
              reelId = data.reelId || null;
            } catch {
              // Legacy: content might be plain text, try to extract reel ID from URL if any
              const match = message.content?.match(/\/reels\/([a-f0-9-]+)/i);
              reelId = match?.[1] || null;
            }
            const thumbnailUrl = message.mediaUrl;
            const reelUrl = reelId ? `/reels/${reelId}` : '/reels';
            // Show thumbnail card even for legacy messages without reelId (links to reels feed)
            return (
              <a
                href={reelUrl}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = reelUrl;
                }}
                className={cn(
                  'block relative rounded-xl overflow-hidden w-24 h-36 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity',
                  isOwn ? 'ring-2 ring-white/30' : 'ring-2 ring-gray-300 dark:ring-gray-600'
                )}
              >
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Reel"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={cn(
                    'w-full h-full flex items-center justify-center',
                    isOwn ? 'bg-blue-700/50' : 'bg-gray-200 dark:bg-gray-700'
                  )}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M7 3v18" />
                      <path d="M17 3v18" />
                      <path d="M3 12h18" />
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </a>
            );
          })()}

          {/* Shared Post content */}
          {(message.contentType === 'post' || message.contentType === 'application/x-shared-post') && (() => {
            try {
              const postData = JSON.parse(message.content);
              const postId = postData.postId;
              const postUrl = postData.postUrl || (postId ? `/post/${postId}` : null);
              
              return (
                <a
                  href={postUrl || '#'}
                  onClick={(e) => {
                    if (postUrl) {
                      e.preventDefault();
                      window.location.href = postUrl;
                    }
                  }}
                  className={cn(
                    'block rounded-lg p-3 mb-2 cursor-pointer transition-colors',
                    isOwn ? 'bg-blue-700/50 hover:bg-blue-700/70' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
                    <span>📄</span>
                    <span>Shared Post</span>
                  </div>
                  {postData.mediaUrl && (
                    <img 
                      src={postData.mediaUrl} 
                      alt="Post media" 
                      className="rounded-md w-full h-24 object-cover mb-2"
                    />
                  )}
                  {postData.author && (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        {postData.author.profileImage && (
                          <img 
                            src={postData.author.profileImage} 
                            alt={postData.author.name} 
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <p className={cn('font-medium text-sm', isOwn ? 'text-white' : 'text-gray-900 dark:text-white')}>
                          {postData.author.name}
                        </p>
                      </div>
                      {postData.author.username && (
                        <p className={cn('text-xs opacity-60', isOwn ? 'text-blue-200' : 'text-gray-500')}>
                          @{postData.author.username}
                        </p>
                      )}
                    </>
                  )}
                  {/* Legacy format support */}
                  {!postData.author && postData.authorName && (
                    <>
                      <p className={cn('font-medium text-sm', isOwn ? 'text-white' : 'text-gray-900 dark:text-white')}>
                        {postData.authorName}
                      </p>
                      {postData.authorUsername && (
                        <p className={cn('text-xs opacity-60', isOwn ? 'text-blue-200' : 'text-gray-500')}>
                          @{postData.authorUsername}
                        </p>
                      )}
                    </>
                  )}
                  {(postData.preview || postData.contentPreview) && (
                    <p className={cn('text-sm mt-1 line-clamp-2', isOwn ? 'text-blue-100' : 'text-gray-600 dark:text-gray-300')}>
                      {postData.preview || postData.contentPreview}
                    </p>
                  )}
                  <p className="text-xs opacity-50 mt-2 italic">Tap to view post →</p>
                </a>
              );
            } catch {
              return <p className="break-words whitespace-pre-wrap">{message.content}</p>;
            }
          })()}

          {/* Text content - hide for reel (thumbnail only) and post */}
          {message.contentType !== 'post' && message.contentType !== 'reel' && (isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 bg-white/20 rounded px-2 py-1 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <button onClick={handleEdit} className="text-xs">Save</button>
            </div>
          ) : (
            <p className="break-words whitespace-pre-wrap">{message.content}</p>
          ))}

          {/* Edited indicator - only show if message was explicitly edited */}
          {!message.isDeleted && message.isEdited && (
            <span className="text-xs opacity-60 ml-1">(edited)</span>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={cn(
            'flex flex-wrap gap-1 mt-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}>
            {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
              const count = message.reactions.filter(r => r.emoji === emoji).length;
              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-sm flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <span>{emoji}</span>
                  <span className="text-xs text-gray-500">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Time and status */}
        <div className={cn(
          'text-xs text-gray-500 mt-1 flex items-center gap-1',
          isOwn ? 'justify-end' : 'justify-start'
        )}>
          <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
          {isOwn && (
            <span className={cn(
              message.status === 'READ' && 'text-blue-500'
            )}>
              {message.status === 'READ' ? '✓✓' : message.status === 'DELIVERED' ? '✓✓' : '✓'}
            </span>
          )}
        </div>

        {/* Quick Action buttons (Discord-style) */}
        <MessageQuickActions
          isVisible={showActions && !isEditing && !showMenu}
          isOwn={isOwn}
          onReply={() => onReply?.()}
          onReact={() => setShowReactions(!showReactions)}
          onMore={() => setShowMenu(true)}
        />

        {/* Full Message Menu */}
        <MessageMenu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          isOwn={isOwn}
          messageContent={message.content}
          hasMedia={!!message.mediaUrl}
          mediaUrl={message.mediaUrl}
          onReply={() => onReply?.()}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
          onReact={handleReaction}
          onCopy={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          availableReactions={availableReactions}
          anchorPosition={isOwn ? 'right' : 'left'}
        />

        {/* Reaction picker */}
        {showReactions && !showMenu && (
          <div className={cn(
            'absolute -top-10 flex items-center gap-1 bg-white dark:bg-gray-900 shadow-lg rounded-full px-2 py-1',
            isOwn ? 'right-0' : 'left-0'
          )}>
            {availableReactions.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Copied notification */}
        {copied && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Copied!
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Utility Functions
// ============================================
function formatDateSeparator(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

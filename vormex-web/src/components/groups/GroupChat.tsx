'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { format, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Group, GroupMessage, GroupUser, getGroupMessages } from '@/lib/api/groups';
import { getSocket, initializeSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth/useAuth';
import { cn } from '@/lib/utils';

interface GroupChatProps {
  group: Group;
}

export default function GroupChat({ group }: GroupChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<GroupUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const data = await getGroupMessages(group.id);
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [group.id]);

  // Setup socket
  useEffect(() => {
    initializeSocket();
    const socket = getSocket();
    if (!socket) return;

    // Join group chat room
    socket.emit('group:join', { groupId: group.id });

    // Listen for new messages
    socket.on('group:new_message', (newMessage: GroupMessage) => {
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    });

    // Listen for typing indicators
    socket.on('group:user_typing', (data: { groupId: string; user: GroupUser; isTyping: boolean }) => {
      if (data.groupId !== group.id || data.user.id === user?.id) return;
      
      setTypingUsers(prev => {
        if (data.isTyping) {
          if (!prev.find(u => u.id === data.user.id)) {
            return [...prev, data.user];
          }
        } else {
          return prev.filter(u => u.id !== data.user.id);
        }
        return prev;
      });
    });

    // Listen for online count
    socket.on('group:online_count', (data: { groupId: string; count: number }) => {
      if (data.groupId === group.id) {
        setOnlineCount(data.count);
      }
    });

    socket.on('group:user_joined', (data: { groupId: string; onlineCount: number }) => {
      if (data.groupId === group.id) {
        setOnlineCount(data.onlineCount);
      }
    });

    socket.on('group:user_left', (data: { groupId: string; onlineCount: number }) => {
      if (data.groupId === group.id) {
        setOnlineCount(data.onlineCount);
      }
    });

    // Listen for message deletions
    socket.on('group:message_deleted', (data: { groupId: string; messageId: string }) => {
      if (data.groupId === group.id) {
        setMessages(prev => prev.filter(m => m.id !== data.messageId));
      }
    });

    // Cleanup
    return () => {
      socket.emit('group:leave', { groupId: group.id });
      socket.off('group:new_message');
      socket.off('group:user_typing');
      socket.off('group:online_count');
      socket.off('group:user_joined');
      socket.off('group:user_left');
      socket.off('group:message_deleted');
    };
  }, [group.id, user?.id]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('group:typing', { groupId: group.id, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('group:typing', { groupId: group.id, isTyping: false });
    }, 2000);
  }, [group.id, isTyping]);

  // Send message
  const handleSend = () => {
    if (!message.trim()) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('group:message', {
      groupId: group.id,
      content: message.trim(),
      tempId: `temp-${Date.now()}`,
    });

    setMessage('');
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    socket.emit('group:typing', { groupId: group.id, isTyping: false });
  };

  // Format message time
  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'HH:mm');
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.createdAt);
    let dateLabel = format(date, 'MMMM d, yyyy');
    if (isToday(date)) dateLabel = 'Today';
    else if (isYesterday(date)) dateLabel = 'Yesterday';
    
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(msg);
    return acc;
  }, {} as Record<string, GroupMessage[]>);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {group.iconImage ? (
              <Image src={group.iconImage} alt={group.name} width={40} height={40} className="object-cover" />
            ) : (
              group.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">{group.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {onlineCount} online • {group.memberCount} members
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Date divider */}
            <div className="flex items-center justify-center my-4">
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                {date}
              </span>
            </div>

            {/* Messages for this date */}
            {msgs.map((msg, index) => {
              const isOwn = msg.senderId === user?.id;
              const showAvatar = !isOwn && (index === 0 || msgs[index - 1]?.senderId !== msg.senderId);

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2 mb-2", isOwn ? "justify-end" : "justify-start")}
                >
                  {/* Avatar */}
                  {!isOwn && (
                    <div className={cn("w-8 h-8 flex-shrink-0", !showAvatar && "invisible")}>
                      {msg.sender.profileImage ? (
                        <Image
                          src={msg.sender.profileImage}
                          alt={msg.sender.name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                          {msg.sender.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message */}
                  <div className={cn("max-w-[70%]", isOwn ? "text-right" : "text-left")}>
                    {/* Sender name */}
                    {!isOwn && showAvatar && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
                        {msg.sender.name}
                      </span>
                    )}
                    
                    <div
                      className={cn(
                        "inline-block px-4 py-2 rounded-2xl",
                        isOwn
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm"
                      )}
                    >
                      {/* Media */}
                      {msg.mediaUrl && (
                        <div className="mb-2">
                          {msg.contentType === 'image' ? (
                            <Image
                              src={msg.mediaUrl}
                              alt="Image"
                              width={200}
                              height={200}
                              className="rounded-lg max-w-full"
                            />
                          ) : msg.contentType === 'video' ? (
                            <video src={msg.mediaUrl} controls className="rounded-lg max-w-full" />
                          ) : (
                            <a
                              href={msg.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:underline"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              {msg.fileName || 'Attachment'}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Text content */}
                      {msg.content && (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                      
                      {/* Time */}
                      <span className={cn(
                        "text-xs mt-1 block",
                        isOwn ? "text-blue-200" : "text-gray-400"
                      )}>
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm"
            >
              <div className="flex -space-x-2">
                {typingUsers.slice(0, 3).map((u) => (
                  <div key={u.id} className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-900 overflow-hidden">
                    {u.profileImage ? (
                      <Image src={u.profileImage} alt={u.name} width={24} height={24} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">
                        {u.name.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <span>
                {typingUsers.length === 1
                  ? `${typingUsers[0].name} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-900 rounded-full border-0 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500"
          />
          
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

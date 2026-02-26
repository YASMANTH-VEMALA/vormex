'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Heart,
  MessageCircle,
  AtSign,
  UserPlus,
  Loader2,
  CheckCheck,
  PartyPopper,
  HandHeart,
  Lightbulb,
  HelpCircle,
  ThumbsUp,
  Users,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  type Notification,
  type NotificationType,
} from '@/lib/api/notifications';
import { initializeSocket } from '@/lib/socket';

// Get icon for notification type
function getNotificationIcon(type: NotificationType, reactionType?: string | null) {
  switch (type) {
    case 'POST_REACTION':
      // Show specific reaction icon
      switch (reactionType) {
        case 'CELEBRATE':
          return <PartyPopper className="w-5 h-5 text-yellow-500" />;
        case 'SUPPORT':
          return <HandHeart className="w-5 h-5 text-green-500" />;
        case 'INSIGHTFUL':
          return <Lightbulb className="w-5 h-5 text-amber-500" />;
        case 'CURIOUS':
          return <HelpCircle className="w-5 h-5 text-purple-500" />;
        default:
          return <ThumbsUp className="w-5 h-5 text-blue-500" />;
      }
    case 'POST_LIKE':
      return <ThumbsUp className="w-5 h-5 text-blue-500" />;
    case 'COMMENT':
      return <MessageCircle className="w-5 h-5 text-green-500" />;
    case 'COMMENT_LIKE':
      return <Heart className="w-5 h-5 text-red-500" />;
    case 'MENTION':
      return <AtSign className="w-5 h-5 text-purple-500" />;
    case 'CONNECTION_REQUEST':
    case 'CONNECTION_ACCEPTED':
      return <UserPlus className="w-5 h-5 text-blue-500" />;
    case 'GROUP_INVITE':
    case 'GROUP_JOIN_REQUEST':
    case 'GROUP_JOIN_APPROVED':
      return <Users className="w-5 h-5 text-indigo-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
}

// Get notification message
function getNotificationMessage(notification: Notification): string {
  const actorName = notification.actor?.name || 'Someone';
  
  switch (notification.type) {
    case 'POST_REACTION':
      const reactionLabels: Record<string, string> = {
        LIKE: 'liked',
        CELEBRATE: 'celebrated',
        SUPPORT: 'supported',
        INSIGHTFUL: 'found insightful',
        CURIOUS: 'is curious about',
      };
      const action = reactionLabels[notification.reactionType || 'LIKE'] || 'reacted to';
      return `${actorName} ${action} your post`;
    case 'POST_LIKE':
      return `${actorName} liked your post`;
    case 'COMMENT':
      return `${actorName} commented on your post`;
    case 'COMMENT_LIKE':
      return `${actorName} liked your comment`;
    case 'MENTION':
      return `${actorName} mentioned you`;
    case 'CONNECTION_REQUEST':
      return `${actorName} sent you a connection request`;
    case 'CONNECTION_ACCEPTED':
      return `${actorName} accepted your connection request`;
    case 'POLL_VOTE':
      return `${actorName} voted on your poll`;
    case 'POST_SHARE':
      return `${actorName} shared your post`;
    case 'GROUP_INVITE':
      return `${actorName} invited you to join ${notification.content || 'a group'}`;
    case 'GROUP_JOIN_REQUEST':
      return `${actorName} requested to join your group`;
    case 'GROUP_JOIN_APPROVED':
      return `Your request to join ${notification.content || 'the group'} was approved`;
    default:
      return `${actorName} interacted with your content`;
  }
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const router = useRouter();
  
  const handleClick = () => {
    // Mark as read
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'GROUP_INVITE' || notification.type === 'GROUP_JOIN_APPROVED') {
      router.push('/groups?tab=invites');
    } else if (notification.reelId) {
      router.push(`/reels/${notification.reelId}`);
    } else if (notification.postId) {
      if (notification.commentId) {
        router.push(`/post/${notification.postId}?comment=${notification.commentId}`);
      } else {
        router.push(`/post/${notification.postId}`);
      }
    } else if (notification.type === 'CONNECTION_REQUEST' || notification.type === 'CONNECTION_ACCEPTED') {
      if (notification.actor) {
        router.push(`/profile/${notification.actor.username}`);
      }
    }
  };
  
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={handleClick}
      className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
        notification.isRead 
          ? 'bg-transparent hover:bg-gray-50 dark:hover:bg-neutral-800/50' 
          : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-700">
          {notification.actor?.profileImage ? (
            <Image
              src={notification.actor.profileImage}
              alt={notification.actor.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
              {notification.actor?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-neutral-900">
          {getNotificationIcon(notification.type, notification.reactionType)}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white">
          {getNotificationMessage(notification)}
        </p>
        {notification.content && (
          <p className="text-sm text-gray-500 dark:text-neutral-400 line-clamp-2 mt-1">
            &quot;{notification.content}&quot;
          </p>
        )}
        {notification.postPreview && !notification.content && (
          <p className="text-sm text-gray-500 dark:text-neutral-400 line-clamp-1 mt-1">
            {notification.postPreview}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
      )}
    </motion.button>
  );
}

interface NotificationsProps {
  isOpen?: boolean;
  onClose?: () => void;
  isDropdown?: boolean;
}

export function Notifications({ isOpen = true, onClose, isDropdown = false }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fetch notifications
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const [notifResponse, countRes] = await Promise.all([
          getNotifications(),
          getUnreadNotificationCount(),
        ]);
        setNotifications((notifResponse as { notifications: Notification[] }).notifications);
        setUnreadCount((countRes as unknown as { count: number }).count);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [isOpen]);

  // Setup real-time notifications
  useEffect(() => {
    const refetch = () => {
      setUnreadCount(prev => prev + 1);
      getNotifications().then(res => setNotifications(res.notifications)).catch(console.error);
    };
    const socket = initializeSocket({
      onNotificationNew: refetch,
      onNotificationMention: refetch,
      onNotificationComment: refetch,
      onNotificationLike: refetch,
      onNotificationReaction: refetch,
      onNotificationCommentLike: refetch,
    });
    
    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  // Mark notification as read
  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationsAsRead([id]);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500 text-white">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          {!isDropdown && (
            <Link
              href="/notifications/settings"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
            </Link>
          )}
        </div>
      </div>
      
      {/* Notifications List */}
      <div className={`overflow-y-auto ${isDropdown ? 'max-h-96' : 'flex-1'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-neutral-600 mb-2" />
            <p className="text-gray-500 dark:text-neutral-400">No notifications yet</p>
            <p className="text-sm text-gray-400 dark:text-neutral-500">
              When someone interacts with your content, it will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-neutral-800">
            <AnimatePresence>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );

  if (isDropdown) {
    return (
      <div className="w-80 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-xl overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-900 min-h-screen border-x border-gray-200 dark:border-neutral-800">
        {content}
      </div>
    </div>
  );
}

// Notification Bell with Badge for Dock/Header
export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Fetch unread count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await getUnreadNotificationCount();
        setUnreadCount((res as unknown as { count: number }).count);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };
    
    fetchCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time updates
  useEffect(() => {
    initializeSocket({
      onNotificationMention: () => setUnreadCount(prev => prev + 1),
      onNotificationComment: () => setUnreadCount(prev => prev + 1),
      onNotificationLike: () => setUnreadCount(prev => prev + 1),
      onNotificationReaction: () => setUnreadCount(prev => prev + 1),
      onNotificationCommentLike: () => setUnreadCount(prev => prev + 1),
    });
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600 dark:text-neutral-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50">
            <Notifications isDropdown onClose={() => setShowDropdown(false)} />
          </div>
        </>
      )}
    </div>
  );
}

export default Notifications;

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, AtSign, UserPlus, ThumbsUp, PartyPopper, Lightbulb, HelpCircle } from 'lucide-react';
import { initializeSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth/useAuth';
import type { ReactionType } from '@/types/post';

interface Toast {
  id: string;
  type: 'reaction' | 'comment' | 'mention' | 'follow' | 'comment_like';
  title: string;
  message: string;
  reactionType?: ReactionType;
  avatarUrl?: string;
  avatarFallback?: string;
  postId?: string;
  createdAt: Date;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useNotificationToasts() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useNotificationToasts must be used within NotificationToastProvider');
  }
  return context;
}

// Map reaction types to icons
const reactionIcons: Record<ReactionType, React.ElementType> = {
  LIKE: ThumbsUp,
  CELEBRATE: PartyPopper,
  SUPPORT: Heart,
  INSIGHTFUL: Lightbulb,
  CURIOUS: HelpCircle,
};

const reactionColors: Record<ReactionType, string> = {
  LIKE: 'text-blue-500',
  CELEBRATE: 'text-green-500',
  SUPPORT: 'text-purple-500',
  INSIGHTFUL: 'text-amber-500',
  CURIOUS: 'text-pink-500',
};

export function NotificationToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { user } = useAuth();

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'createdAt'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts(prev => [...prev, { ...toast, id, createdAt: new Date() }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!user) return;

    const socket = initializeSocket({
      onNotificationReaction: (data: any) => {
        addToast({
          type: 'reaction',
          title: 'New Reaction',
          message: `Someone reacted to your post`,
          reactionType: data.reactionType,
          postId: data.postId,
        });
      },
      onNotificationLike: (data: any) => {
        addToast({
          type: 'reaction',
          title: 'New Like',
          message: `Someone liked your post`,
          reactionType: 'LIKE',
          postId: data.postId,
        });
      },
      onNotificationComment: (data: any) => {
        addToast({
          type: 'comment',
          title: 'New Comment',
          message: `Someone commented on your post`,
          postId: data.postId,
        });
      },
      onNotificationMention: (data: any) => {
        addToast({
          type: 'mention',
          title: 'New Mention',
          message: `You were mentioned in a comment`,
          postId: data.postId,
        });
      },
      onNotificationCommentLike: (data: any) => {
        addToast({
          type: 'comment_like',
          title: 'Comment Liked',
          message: `Someone liked your comment`,
          postId: data.postId,
        });
      },
    });

    return () => {
      // Cleanup will be handled by the socket singleton
    };
  }, [user, addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <NotificationToasts />
    </ToastContext.Provider>
  );
}

function NotificationToasts() {
  const { toasts, removeToast } = useNotificationToasts();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const getIcon = () => {
    switch (toast.type) {
      case 'reaction':
        if (toast.reactionType) {
          const Icon = reactionIcons[toast.reactionType];
          return <Icon className={`w-5 h-5 ${reactionColors[toast.reactionType]}`} />;
        }
        return <ThumbsUp className="w-5 h-5 text-blue-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-purple-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'comment_like':
        return <Heart className="w-5 h-5 text-red-500" />;
      default:
        return <Heart className="w-5 h-5 text-red-500" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'reaction':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'comment':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'mention':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'follow':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'comment_like':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      className={`relative flex items-start gap-3 p-4 rounded-xl border shadow-lg ${getBgColor()}`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 p-2 rounded-full bg-white dark:bg-neutral-900">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white text-sm">
          {toast.title}
        </p>
        <p className="text-sm text-gray-600 dark:text-neutral-400 truncate">
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
      >
        <X className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
      </button>

      {/* Progress Bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-b-xl"
      />
    </motion.div>
  );
}

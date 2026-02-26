'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  AtSign,
  Loader2,
  MessageSquare,
  FileText,
  Check,
  Eye,
  X,
} from 'lucide-react';
import {
  getUnreadMentions,
  getUnreadMentionCount,
  markMentionsAsRead,
  type Mention,
} from '@/lib/api/mentions';
import { formatDistanceToNow } from 'date-fns';

export function MentionsDashboard() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  // Fetch mentions
  useEffect(() => {
    const fetchMentions = async () => {
      try {
        const data = await getUnreadMentions();
        setMentions(data);
      } catch (error) {
        console.error('Failed to fetch mentions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentions();
  }, []);

  // Mark single mention as read
  const handleMarkAsRead = async (mentionId: string) => {
    setMarkingRead(mentionId);
    try {
      await markMentionsAsRead([mentionId]);
      setMentions((prev) =>
        prev.map((m) => (m.id === mentionId ? { ...m, isRead: true } : m))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    } finally {
      setMarkingRead(null);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const unreadIds = mentions.filter((m) => !m.isRead).map((m) => m.id);
    if (unreadIds.length === 0) return;

    setMarkingRead('all');
    try {
      await markMentionsAsRead(unreadIds);
      setMentions((prev) => prev.map((m) => ({ ...m, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setMarkingRead(null);
    }
  };

  // Get link for mention
  const getMentionLink = (mention: Mention) => {
    if (mention.postId) {
      return `/post/${mention.postId}`;
    }
    return '#';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const unreadCount = mentions.filter((m) => !m.isRead).length;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <AtSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Mentions
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {unreadCount > 0
                  ? `${unreadCount} unread mention${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingRead === 'all'}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              {markingRead === 'all' ? 'Marking...' : 'Mark all as read'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-200 dark:divide-neutral-800">
        {mentions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <AtSign className="w-6 h-6 text-gray-400 dark:text-neutral-600" />
            </div>
            <p className="text-gray-500 dark:text-neutral-400">
              No mentions yet
            </p>
          </div>
        ) : (
          mentions.map((mention) => (
            <Link
              key={mention.id}
              href={getMentionLink(mention)}
              className={`block p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors ${
                !mention.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {mention.mentioner?.profileImage || mention.mentioner?.avatar ? (
                    <img
                      src={(mention.mentioner?.profileImage || mention.mentioner?.avatar) as string}
                      alt={mention.mentioner?.name || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold">
                      {mention.mentioner?.name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">
                      {mention.mentioner?.name || 'Someone'}
                    </span>{' '}
                    <span className="text-gray-500 dark:text-neutral-400">
                      mentioned you in a post
                    </span>
                  </p>

                  {/* Preview */}
                  {mention.post?.content && (
                    <p className="text-sm text-gray-600 dark:text-neutral-300 mt-1 line-clamp-2">
                      {mention.post.content}
                    </p>
                  )}

                  {/* Time */}
                  <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
                    {formatDistanceToNow(new Date(mention.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                {/* Mark as read button */}
                {!mention.isRead && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleMarkAsRead(mention.id);
                    }}
                    disabled={markingRead === mention.id}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {markingRead === mention.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <Check className="w-4 h-4 text-gray-400 hover:text-green-500" />
                    )}
                  </button>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

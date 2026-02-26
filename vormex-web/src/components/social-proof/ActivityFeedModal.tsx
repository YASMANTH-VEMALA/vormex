'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getActivityFeed, type ActivityFeedItem } from '@/lib/api/social-proof';
import { X } from 'lucide-react';

/**
 * ActivityFeedModal — Real-time anonymized activity stream
 *
 * Psychology: SOCIAL PROOF + URGENCY
 * Seeing "Arjun just connected with someone (2s ago)" in a live-scrolling
 * feed creates the visceral feeling that the platform is alive and active.
 * Users feel compelled to participate when they see others acting in real-time.
 *
 * - "Someone from NIAT just joined" → Anonymized for privacy
 * - Auto-scrolling feed of recent activities
 * - Refreshes every 10 seconds
 *
 * Placement: Opens as modal when tapping LiveActivityIndicator
 */

interface ActivityFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivityFeedModal({ isOpen, onClose }: ActivityFeedModalProps) {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const data = await getActivityFeed(20, 10);
      setActivities(data);
    } catch (error) {
      console.error('Failed to fetch activity feed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on open and refresh every 10 seconds
  useEffect(() => {
    if (!isOpen) return;
    fetchFeed();
    const interval = setInterval(fetchFeed, 10000);
    return () => clearInterval(interval);
  }, [isOpen, fetchFeed]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Live Activity
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 dark:text-neutral-500" />
          </button>
        </div>

        {/* Activity list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600 dark:border-neutral-600 dark:border-t-neutral-300" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400 dark:text-neutral-500">
              No recent activity — be the first to act!
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 py-2.5 border-b border-gray-50 dark:border-neutral-800/50 last:border-0"
                >
                  {/* Activity icon */}
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </span>

                  {/* Activity text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-neutral-300">
                      {activity.label}
                    </p>
                  </div>

                  {/* Time ago */}
                  <span className="text-[10px] text-gray-400 dark:text-neutral-500 flex-shrink-0 tabular-nums mt-0.5">
                    {formatTimeAgo(activity.secondsAgo)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-neutral-800 text-center">
          <p className="text-[10px] text-gray-400 dark:text-neutral-500">
            Activity is anonymized for privacy
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function getActivityIcon(type: string): string {
  switch (type) {
    case 'CONNECTION_MADE': return '🤝';
    case 'POST_CREATED': return '📝';
    case 'GROUP_JOINED': return '👥';
    case 'EVENT_RSVP': return '📅';
    case 'USER_SIGNED_UP': return '🆕';
    case 'COMMENT_POSTED': return '💬';
    case 'PROFILE_UPDATED': return '✏️';
    default: return '⚡';
  }
}

function formatTimeAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

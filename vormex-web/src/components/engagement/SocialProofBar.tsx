'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getLiveActivity, type LiveActivity } from '@/lib/api/engagement';

/**
 * SocialProofBar - Subtle live activity ticker
 * Clean, minimal design — single line of text with a green dot
 */
export default function SocialProofBar({ location }: { location?: string }) {
  const [activity, setActivity] = useState<LiveActivity | null>(null);
  const [currentStat, setCurrentStat] = useState(0);

  const fetchActivity = useCallback(async () => {
    try {
      const data = await getLiveActivity(location);
      setActivity(data);
    } catch (error) {
      console.error('Failed to fetch live activity:', error);
    }
  }, [location]);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  useEffect(() => {
    if (!activity) return;
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, [activity]);

  if (!activity) return null;

  const stats = [
    `${activity.activeUsersNow ?? 0} ${(activity.activeUsersNow ?? 0) === 1 ? 'person' : 'people'} networking${activity.locationLabel ? ` ${activity.locationLabel}` : ''}`,
    `${activity.connectionsToday ?? 0} connections made today`,
    `${activity.newUsersToday ?? 0} new ${(activity.newUsersToday ?? 0) === 1 ? 'member' : 'members'} joined today`,
  ];

  return (
    <div className="flex items-center gap-2 px-1 py-1 overflow-hidden">
      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentStat}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="text-xs text-gray-500 dark:text-neutral-400"
        >
          {stats[currentStat]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

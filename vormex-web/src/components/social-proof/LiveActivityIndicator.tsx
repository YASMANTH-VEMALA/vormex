'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getSocialProofLiveStats, type LiveStats } from '@/lib/api/social-proof';

/**
 * LiveActivityIndicator — Pulsing live activity counter
 *
 * Psychology: BANDWAGON EFFECT
 * "If 23 students are networking right now, I should be too."
 * The pulsing red dot creates urgency; the rotating stats maintain attention.
 *
 * Placement: Top of Home screen, Discover page
 * Refresh: Every 30 seconds (near real-time feel)
 * Tappable: Opens ActivityFeedModal on click
 */

interface LiveActivityIndicatorProps {
  city?: string;
  college?: string;
  onTap?: () => void;
  compact?: boolean;
}

export default function LiveActivityIndicator({
  city,
  college,
  onTap,
  compact = false,
}: LiveActivityIndicatorProps) {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [currentStatIndex, setCurrentStatIndex] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getSocialProofLiveStats(city, college);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch live stats:', error);
    }
  }, [city, college]);

  // Fetch every 30 seconds — creates feeling of real-time updates
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Rotate through different stats every 5 seconds — maintains attention
  useEffect(() => {
    if (!stats) return;
    const interval = setInterval(() => {
      setCurrentStatIndex(prev => (prev + 1) % getStatMessages(stats).length);
    }, 5000);
    return () => clearInterval(interval);
  }, [stats]);

  if (!stats) return null;

  const messages = getStatMessages(stats);

  if (compact) {
    return (
      <button
        onClick={onTap}
        className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 transition-colors"
      >
        <PulsingDot />
        <AnimatePresence mode="wait">
          <motion.span
            key={currentStatIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {messages[currentStatIndex]}
          </motion.span>
        </AnimatePresence>
      </button>
    );
  }

  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-100 dark:border-red-900/30 rounded-xl hover:from-red-100 hover:to-orange-100 dark:hover:from-red-950/30 dark:hover:to-orange-950/30 transition-all"
    >
      <PulsingDot size="md" />
      <div className="flex-1 text-left">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStatIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-medium text-gray-800 dark:text-neutral-200"
          >
            {messages[currentStatIndex]}
          </motion.p>
        </AnimatePresence>
        <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-0.5">
          Tap to see live activity
        </p>
      </div>
      <span className="text-gray-300 dark:text-neutral-600">›</span>
    </button>
  );
}

/** Build stat messages array from live data */
function getStatMessages(stats: LiveStats): string[] {
  const msgs: string[] = [];

  if (stats.activeNow > 0) {
    msgs.push(`🔴 ${stats.activeNow} ${stats.activeNow === 1 ? 'student' : 'students'} networking ${stats.locationLabel}`);
  }
  if (stats.activeLastHour > 0) {
    msgs.push(`⚡ ${stats.activeLastHour} active in the last hour`);
  }
  if (stats.connectionsToday > 0) {
    msgs.push(`🤝 ${stats.connectionsToday} connections made today`);
  }
  if (stats.newUsersToday > 0) {
    msgs.push(`🆕 ${stats.newUsersToday} new members joined today`);
  }
  if (stats.profileBrowsersNow > 0) {
    msgs.push(`🔥 ${stats.profileBrowsersNow} people browsing profiles right now`);
  }

  return msgs.length > 0 ? msgs : ['Students are connecting on Vormex'];
}

/** Animated pulsing red dot */
function PulsingDot({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'h-2 w-2' : 'h-1.5 w-1.5';
  return (
    <span className={`relative flex ${dim} flex-shrink-0`}>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60`} />
      <span className={`relative inline-flex rounded-full ${dim} bg-red-500`} />
    </span>
  );
}

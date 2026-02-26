'use client';

import { Flame } from 'lucide-react';

/**
 * TrendingBadge — Small 🔥 overlay badge for trending items
 *
 * Psychology: AUTHORITY + SCARCITY
 * A trending badge signals "This is popular right now, pay attention."
 * Creates urgency (it won't be trending forever) and social validation
 * (if it's trending, it must be good).
 *
 * Placement: Overlaid on posts, profiles, circles, events
 */

interface TrendingBadgeProps {
  reason?: string;         // "23 people shared this"
  size?: 'sm' | 'md';
  showTooltip?: boolean;
}

export default function TrendingBadge({
  reason,
  size = 'sm',
  showTooltip = true,
}: TrendingBadgeProps) {
  if (size === 'sm') {
    return (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full"
        title={showTooltip ? reason || 'Trending now' : undefined}
      >
        <Flame className="w-2.5 h-2.5" />
        <span className="text-[9px] font-semibold">Trending</span>
      </span>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-700 dark:text-orange-300 rounded-lg"
      title={showTooltip ? reason || 'Trending now' : undefined}
    >
      <Flame className="w-3.5 h-3.5" />
      <span className="text-xs font-semibold">Trending</span>
      {reason && (
        <span className="text-[10px] text-orange-500 dark:text-orange-400 ml-0.5">
          · {reason}
        </span>
      )}
    </div>
  );
}

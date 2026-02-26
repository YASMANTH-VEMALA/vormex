'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getProfileViewStats, type ProfileViewStats } from '@/lib/api/social-proof';
import { TrendingUp, TrendingDown, Eye } from 'lucide-react';

/**
 * ProfileViewsCard — Profile view analytics with trend indicator
 *
 * Psychology: FOMO + CURIOSITY
 * "47 people viewed your profile this week (+32%↗️)" creates:
 * - Curiosity: "Who's looking at me?"
 * - Validation: "People are interested in me"
 * - Urgency: "I should update my profile to make a good impression"
 *
 * Placement: User's own profile page
 */

interface ProfileViewsCardProps {
  userId: string;
  onViewDetails?: () => void;
}

export default function ProfileViewsCard({ userId, onViewDetails }: ProfileViewsCardProps) {
  const [stats, setStats] = useState<ProfileViewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getProfileViewStats(userId);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch profile views:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-gray-200 dark:bg-neutral-800 rounded mb-3" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-neutral-800 rounded" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const isUp = stats.trendDirection === 'up';

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onViewDetails}
      className="w-full text-left bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-500 dark:text-neutral-400">
          <Eye className="w-4 h-4" />
          <span className="text-xs font-medium">Profile Views</span>
        </div>
        {stats.trendPercent !== 0 && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${
            isUp ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
          }`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isUp ? '+' : ''}{stats.trendPercent}%</span>
          </div>
        )}
      </div>

      {/* Main stat */}
      <div className="flex items-end gap-3">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
            {stats.viewsThisWeek.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">
            views this week
          </p>
        </div>

        {/* Secondary stats */}
        <div className="flex-1 flex gap-3 ml-auto">
          {stats.viewsLastHour > 0 && (
            <div className="text-right">
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                {stats.viewsLastHour}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-neutral-500">last hour</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700 dark:text-neutral-300 tabular-nums">
              {stats.viewsToday}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-neutral-500">today</p>
          </div>
        </div>
      </div>

      {/* FOMO urgency indicator — recent hot views */}
      {stats.viewsLastHour >= 3 && (
        <div className="mt-3 flex items-center gap-1.5 px-2 py-1 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
          <span className="text-xs">🔥</span>
          <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
            {stats.viewsLastHour} people viewed your profile in the last hour
          </span>
        </div>
      )}

      {/* Recent viewers preview (avatars) */}
      {stats.recentViewers.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex -space-x-2">
            {stats.recentViewers.slice(0, 4).map(v => (
              <div
                key={v.id}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-neutral-900 overflow-hidden"
              >
                {v.viewer.profileImage ? (
                  <img
                    src={v.viewer.profileImage}
                    alt={v.viewer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-[8px] font-semibold text-gray-500 dark:text-neutral-400">
                    {v.viewer.name.charAt(0)}
                  </div>
                )}
              </div>
            ))}
            {stats.viewerCount > 4 && (
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-neutral-900 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-[8px] font-semibold text-gray-500 dark:text-neutral-400">
                +{stats.viewerCount - 4}
              </div>
            )}
          </div>
          <span className="text-[10px] text-gray-400 dark:text-neutral-500">
            viewed your profile recently
          </span>
        </div>
      )}
    </motion.button>
  );
}

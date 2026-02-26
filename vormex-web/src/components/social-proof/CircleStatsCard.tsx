'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getGroupSocialStats, type GroupStats } from '@/lib/api/social-proof';
import { Users, UserPlus, Wifi, Star } from 'lucide-react';

/**
 * CircleStatsCard — Group/Circle growth social proof
 *
 * Psychology: BANDWAGON + FOMO
 * "48 students joined in the last 24 hours" creates:
 * - FOMO: "Everyone's joining, I'll miss out"
 * - Trust: "523 members can't be wrong"
 * - Belonging: "34 of my connections are here"
 *
 * Placement: Group/Circle detail page, before the Join button
 */

interface CircleStatsCardProps {
  groupId: string;
}

export default function CircleStatsCard({ groupId }: CircleStatsCardProps) {
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getGroupSocialStats(groupId);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch group stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [groupId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2 p-4">
        <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-800 rounded" />
        <div className="h-4 w-36 bg-gray-200 dark:bg-neutral-800 rounded" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 space-y-2.5"
    >
      {/* Total members */}
      <StatRow
        icon={<Users className="w-3.5 h-3.5 text-blue-500" />}
        label={`${stats.totalMembers.toLocaleString()} members`}
      />

      {/* Recent joins — FOMO trigger */}
      {stats.recentJoins24h > 0 && (
        <StatRow
          icon={<UserPlus className="w-3.5 h-3.5 text-green-500" />}
          label={`+${stats.recentJoins24h} joined in last 24 hours`}
          highlight
        />
      )}

      {/* Week growth */}
      {stats.recentJoinsWeek > 0 && (
        <StatRow
          icon={<span className="text-xs">🔥</span>}
          label={`+${stats.recentJoinsWeek} members this week`}
          badge={stats.isTrending ? 'Trending' : undefined}
        />
      )}

      {/* Online now */}
      {stats.onlineNow > 0 && (
        <StatRow
          icon={
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
          }
          label={`${stats.onlineNow} online now`}
        />
      )}

      {/* Mutual connections — social validation */}
      {stats.mutualConnections > 0 && (
        <StatRow
          icon={<Star className="w-3.5 h-3.5 text-amber-500" />}
          label={`${stats.mutualConnections} of your connections are members`}
          highlight
        />
      )}
    </motion.div>
  );
}

function StatRow({
  icon,
  label,
  highlight = false,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-shrink-0 flex items-center justify-center w-5">{icon}</span>
      <span className={`text-sm ${
        highlight
          ? 'font-medium text-gray-800 dark:text-neutral-200'
          : 'text-gray-600 dark:text-neutral-400'
      }`}>
        {label}
      </span>
      {badge && (
        <span className="ml-auto px-1.5 py-0.5 text-[9px] font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSocialProofLeaderboard, type LeaderboardResponse, type LeaderboardEntry } from '@/lib/api/social-proof';
import Link from 'next/link';
import { Trophy, ChevronRight } from 'lucide-react';

/**
 * LeaderboardCard — Top Networkers with competitive ranking
 *
 * Psychology: SOCIAL STATUS + COMPETITION
 * "Top 10 Most Connected Students This Week" creates:
 * - Aspiration: "I want to be on that list"
 * - Competition: "I can beat #3 if I network more"
 * - Validation: "These are the people to connect with"
 *
 * Key: "You're ranked #24" — shows user they're not far off, motivating action
 *
 * Placement: Discover page, Progress tab
 */

interface LeaderboardCardProps {
  defaultPeriod?: 'daily' | 'weekly' | 'all_time';
  defaultScope?: string;
  limit?: number;
  showFilters?: boolean;
}

const PERIOD_LABELS = {
  daily: 'Today',
  weekly: 'This Week',
  all_time: 'All Time',
};

const RANK_COLORS = ['text-amber-500', 'text-gray-400', 'text-amber-600'];
const RANK_EMOJIS = ['🥇', '🥈', '🥉'];

export default function LeaderboardCard({
  defaultPeriod = 'weekly',
  defaultScope = 'global',
  limit = 10,
  showFilters = true,
}: LeaderboardCardProps) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [period, setPeriod] = useState(defaultPeriod);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const result = await getSocialProofLeaderboard(period, defaultScope, limit);
        setData(result);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [period, defaultScope, limit]);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      {/* Header with trophy and period filter */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Top Networkers
          </h3>
        </div>

        {showFilters && (
          <div className="flex bg-gray-100 dark:bg-neutral-800 rounded-lg p-0.5">
            {(['daily', 'weekly', 'all_time'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                  period === p
                    ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600 dark:border-neutral-600 dark:border-t-neutral-300" />
        </div>
      ) : !data || data.entries.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400 dark:text-neutral-500">
          No data yet — be the first to network!
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-50 dark:divide-neutral-800/50">
            {data.entries.map((entry, index) => (
              <LeaderboardRow key={entry.userId} entry={entry} index={index} />
            ))}
          </div>

          {/* User's own rank — motivational "You're almost there!" */}
          {data.userRank && !data.userRank.inTopList && (
            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border-t border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    You&apos;re ranked #{data.userRank.rank}
                  </span>
                  {data.userRank.rank <= 30 && (
                    <span className="text-xs text-blue-500 dark:text-blue-400">
                      You&apos;re in the top 30!
                    </span>
                  )}
                </div>
                <Link
                  href="/progress"
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-0.5 hover:underline"
                >
                  View Full <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  return (
    <Link
      href={`/profile/${entry.username}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
    >
      {/* Rank */}
      <span className={`w-6 text-center text-xs font-bold tabular-nums ${
        index < 3 ? RANK_COLORS[index] : 'text-gray-400 dark:text-neutral-500'
      }`}>
        {index < 3 ? RANK_EMOJIS[index] : entry.rank}
      </span>

      {/* Avatar */}
      {entry.profileImage ? (
        <img
          src={entry.profileImage}
          alt={entry.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-gray-500 dark:text-neutral-400 text-xs font-semibold flex-shrink-0">
          {entry.name.charAt(0)}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.name}</p>
        {entry.college && (
          <p className="text-[10px] text-gray-400 dark:text-neutral-500 truncate">{entry.college}</p>
        )}
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold text-gray-700 dark:text-neutral-300 tabular-nums">
          {entry.connectionCount}
        </p>
        <p className="text-[9px] text-gray-400 dark:text-neutral-500">connections</p>
      </div>
    </Link>
  );
}

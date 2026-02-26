'use client';

import { useState, useEffect } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '@/lib/api/engagement';
import Link from 'next/link';

/**
 * Leaderboard - Clean top networkers list
 * Professional design with week/month toggle
 */
export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await getLeaderboard(period, 10);
        setEntries(data?.leaderboard ?? []);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period]);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Networkers</h3>
        <div className="flex bg-gray-100 dark:bg-neutral-800 rounded-lg p-0.5">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              period === 'weekly'
                ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              period === 'monthly'
                ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600 dark:border-neutral-600 dark:border-t-neutral-300" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400 dark:text-neutral-500">
          No data yet
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-neutral-800">
          {entries.map((entry, index) => (
            <Link
              key={entry.id}
              href={`/profile/${entry.username}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              {/* Rank */}
              <span className={`w-5 text-xs font-semibold text-center tabular-nums ${
                index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-400 dark:text-neutral-500'
              }`}>
                {index + 1}
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
                  <p className="text-xs text-gray-400 dark:text-neutral-500 truncate">{entry.college}</p>
                )}
              </div>

              {/* Count */}
              <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 tabular-nums flex-shrink-0">
                {entry.connectionCount}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

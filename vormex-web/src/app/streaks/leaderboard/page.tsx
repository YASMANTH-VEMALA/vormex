'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Flame,
  LogIn,
  FileText,
  MessageCircle,
  Crown,
  Medal,
  Award,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  getStreakLeaderboard,
  type StreakType,
  type StreakLeaderboardEntry,
  type StreakLeaderboardResponse,
} from '@/lib/api/engagement';

const TAB_CONFIG: Array<{
  key: StreakType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeClass: string;
}> = [
  {
    key: 'connection',
    label: 'Networking',
    icon: Flame,
    color: 'text-orange-500',
    activeClass: 'bg-orange-500 text-white',
  },
  {
    key: 'login',
    label: 'Login',
    icon: LogIn,
    color: 'text-blue-500',
    activeClass: 'bg-blue-500 text-white',
  },
  {
    key: 'posting',
    label: 'Posting',
    icon: FileText,
    color: 'text-green-500',
    activeClass: 'bg-green-500 text-white',
  },
  {
    key: 'messaging',
    label: 'Messages',
    icon: MessageCircle,
    color: 'text-purple-500',
    activeClass: 'bg-purple-500 text-white',
  },
];

const PODIUM_ICONS = [Crown, Medal, Award];
const PODIUM_COLORS = ['text-amber-500', 'text-gray-400', 'text-orange-400'];
const PODIUM_BG = [
  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  'bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700',
  'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30',
];

export default function StreakLeaderboardPage() {
  const [activeTab, setActiveTab] = useState<StreakType>('connection');
  const [data, setData] = useState<StreakLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async (type: StreakType) => {
    setLoading(true);
    try {
      const result = await getStreakLeaderboard(type, 20);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab, fetchLeaderboard]);

  const handleTabChange = (type: StreakType) => {
    if (type !== activeTab) {
      setActiveTab(type);
    }
  };

  const topThree = data?.leaderboard?.slice(0, 3) ?? [];
  const rest = data?.leaderboard?.slice(3) ?? [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-24">
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/streaks" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Streak Leaderboard</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? tab.activeClass
                      : 'bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-400 border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && data && (!data.leaderboard || data.leaderboard.length === 0) && (
            <div className="text-center py-16">
              <Crown className="w-12 h-12 text-gray-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-neutral-400">No leaderboard data yet</p>
              <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">Be the first to start a streak!</p>
            </div>
          )}

          {/* Podium (Top 3) */}
          {!loading && topThree.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 mb-4"
            >
              {topThree.map((entry, index) => {
                const PodiumIcon = PODIUM_ICONS[index];
                return (
                  <div
                    key={entry.user.id}
                    className={`flex items-center gap-3 rounded-xl border p-4 ${PODIUM_BG[index]}`}
                  >
                    <div className="flex items-center justify-center w-8">
                      <PodiumIcon className={`w-5 h-5 ${PODIUM_COLORS[index]}`} />
                    </div>

                    {/* Avatar */}
                    {entry.user.profileImage ? (
                      <img
                        src={entry.user.profileImage}
                        alt={entry.user.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-500 dark:text-neutral-400">
                          {entry.user.name.charAt(0)}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {entry.user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                        @{entry.user.username}
                        {entry.user.college && ` · ${entry.user.college}`}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{entry.currentStreak}</p>
                      <p className="text-[10px] text-gray-400 dark:text-neutral-500">day{entry.currentStreak !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Rest of leaderboard */}
          {!loading && rest.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-gray-100 dark:divide-neutral-800">
              {rest.map((entry) => (
                <div key={entry.user.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-6 text-center text-xs font-medium text-gray-400 dark:text-neutral-500 tabular-nums">
                    {entry.rank}
                  </span>

                  {entry.user.profileImage ? (
                    <img
                      src={entry.user.profileImage}
                      alt={entry.user.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
                        {entry.user.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {entry.user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                      @{entry.user.username}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{entry.currentStreak}</p>
                    <p className="text-[10px] text-gray-400 dark:text-neutral-500">best: {entry.longestStreak}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

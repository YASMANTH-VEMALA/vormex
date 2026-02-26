'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Flame,
  Trophy,
  Shield,
  Snowflake,
  TrendingUp,
  MessageCircle,
  FileText,
  LogIn,
  ChevronRight,
  Eye,
  EyeOff,
  History,
  Crown,
  Zap,
  AlertTriangle,
  ArrowLeft,
  Star,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  getStreaks,
  purchaseStreakFreeze,
  toggleStreakShield,
  toggleStreakVisibility,
  getStreakHistory,
  type StreakData,
  type StreakHistoryItem,
} from '@/lib/api/engagement';

const STREAK_TYPES = [
  {
    key: 'connection' as const,
    label: 'Networking',
    icon: Flame,
    color: 'orange',
    currentKey: 'connectionStreak' as const,
    longestKey: 'longestConnectionStreak' as const,
    description: 'Connect with someone daily',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-900/20',
    textColor: 'text-orange-500',
    ringColor: 'ring-orange-500/30',
  },
  {
    key: 'login' as const,
    label: 'Login',
    icon: LogIn,
    color: 'blue',
    currentKey: 'loginStreak' as const,
    longestKey: 'longestLoginStreak' as const,
    description: 'Log in every day',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-900/20',
    textColor: 'text-blue-500',
    ringColor: 'ring-blue-500/30',
  },
  {
    key: 'posting' as const,
    label: 'Posting',
    icon: FileText,
    color: 'green',
    currentKey: 'postingStreak' as const,
    longestKey: 'longestPostingStreak' as const,
    description: 'Share a post every day',
    bgLight: 'bg-green-50',
    bgDark: 'dark:bg-green-900/20',
    textColor: 'text-green-500',
    ringColor: 'ring-green-500/30',
  },
  {
    key: 'messaging' as const,
    label: 'Messaging',
    icon: MessageCircle,
    color: 'purple',
    currentKey: 'messagingStreak' as const,
    longestKey: 'longestMessagingStreak' as const,
    description: 'Send a message every day',
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-900/20',
    textColor: 'text-purple-500',
    ringColor: 'ring-purple-500/30',
  },
];

function getHistoryEventEmoji(event: string): string {
  switch (event) {
    case 'increment': return '🔥';
    case 'milestone': return '🏆';
    case 'break': return '💔';
    case 'freeze_used': return '❄️';
    case 'shield_saved': return '🛡️';
    default: return '📌';
  }
}

function getHistoryEventLabel(event: string): string {
  switch (event) {
    case 'increment': return 'Streak extended';
    case 'milestone': return 'Milestone reached!';
    case 'break': return 'Streak broken';
    case 'freeze_used': return 'Freeze used';
    case 'shield_saved': return 'Shield saved streak';
    default: return event;
  }
}

function getStreakTypeLabel(type: string): string {
  switch (type) {
    case 'connection': return 'Networking';
    case 'login': return 'Login';
    case 'posting': return 'Posting';
    case 'messaging': return 'Messaging';
    default: return type;
  }
}

export default function StreaksPage() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [history, setHistory] = useState<StreakHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [shieldLoading, setShieldLoading] = useState(false);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [streakData, historyData] = await Promise.all([
        getStreaks(),
        getStreakHistory(15),
      ]);
      setStreak(streakData);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error('Failed to fetch streak data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePurchaseFreeze = async () => {
    if (freezeLoading) return;
    setFreezeLoading(true);
    try {
      const result = await purchaseStreakFreeze();
      showToast(result.message, 'success');
      setStreak((prev) => prev ? { ...prev, streakFreezes: result.freezesRemaining } : prev);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to purchase freeze';
      showToast(msg, 'error');
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleToggleShield = async () => {
    if (shieldLoading) return;
    setShieldLoading(true);
    try {
      const result = await toggleStreakShield();
      showToast(result.message, 'success');
      setStreak((prev) => prev ? { ...prev, streakShieldActive: result.shieldActive } : prev);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to toggle shield';
      showToast(msg, 'error');
    } finally {
      setShieldLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (visibilityLoading) return;
    setVisibilityLoading(true);
    try {
      const result = await toggleStreakVisibility();
      showToast(result.message, 'success');
      setStreak((prev) => prev ? { ...prev, showOnProfile: result.showOnProfile } : prev);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to toggle visibility';
      showToast(msg, 'error');
    } finally {
      setVisibilityLoading(false);
    }
  };

  const anyAtRisk = streak?.isAtRisk ? Object.values(streak.isAtRisk).some(Boolean) : false;
  const bestCurrentStreak = streak
    ? Math.max(streak.connectionStreak, streak.loginStreak, streak.postingStreak, streak.messagingStreak)
    : 0;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
          <div className="max-w-lg mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-neutral-800 rounded w-1/3" />
              <div className="h-40 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!streak) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
          <p className="text-gray-500 dark:text-neutral-400">Failed to load streak data.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-24">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg ${
                toast.type === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/more" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Your Streaks</h1>
          </div>

          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600 p-6 mb-6 text-white"
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <Flame className="w-full h-full" />
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-5xl font-black tabular-nums"
                >
                  {bestCurrentStreak}
                </motion.div>
              </div>
              <div>
                <p className="text-base font-semibold text-white/90">Best Active Streak</p>
                <p className="text-sm text-white/70">Overall best: {streak.overallBestStreak} days</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span className="font-medium">{streak.engagementScore} XP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4" />
                <span>
                  {streak.weeklyConnectionsMade}/{streak.weeklyConnectionsGoal} weekly
                </span>
              </div>
            </div>

            {anyAtRisk && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 flex items-center gap-2 px-3 py-2 bg-white/15 backdrop-blur-sm rounded-lg text-sm"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Some streaks are at risk — take action today!</span>
              </motion.div>
            )}
          </motion.div>

          {/* Streak Type Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {STREAK_TYPES.map((type, index) => {
              const current = streak[type.currentKey];
              const longest = streak[type.longestKey];
              const atRisk = streak.isAtRisk?.[type.key] ?? false;
              const Icon = type.icon;

              return (
                <motion.div
                  key={type.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 ${
                    atRisk ? 'ring-2 ring-amber-400/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${type.bgLight} ${type.bgDark} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${type.textColor}`} />
                    </div>
                    {atRisk && (
                      <span className="ml-auto px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] rounded font-medium">
                        At risk
                      </span>
                    )}
                  </div>

                  <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                    {current}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">{type.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-0.5">
                    Best: {longest} days
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Protection Section */}
          <div className="space-y-3 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider px-1">
              Protection
            </h2>

            {/* Streak Freeze */}
            <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
                  <Snowflake className="w-5 h-5 text-cyan-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Streak Freezes</p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    {streak.streakFreezes} available · {streak.totalFreezesUsed} used total
                  </p>
                </div>
                <button
                  onClick={handlePurchaseFreeze}
                  disabled={freezeLoading}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors disabled:opacity-50"
                >
                  {freezeLoading ? '...' : 'Buy'}
                </button>
              </div>
            </div>

            {/* Streak Shield */}
            <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  streak.streakShieldActive
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-gray-100 dark:bg-neutral-800'
                }`}>
                  <Shield className={`w-5 h-5 ${
                    streak.streakShieldActive ? 'text-green-500' : 'text-gray-400 dark:text-neutral-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Streak Shield</p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    {streak.streakShieldActive ? 'Active — your streaks are protected' : 'Inactive — enable for protection'}
                  </p>
                </div>
                <button
                  onClick={handleToggleShield}
                  disabled={shieldLoading}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                    streak.streakShieldActive
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                      : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {shieldLoading ? '...' : streak.streakShieldActive ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider px-1">
              More
            </h2>

            {/* Leaderboard Link */}
            <Link
              href="/streaks/leaderboard"
              className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Leaderboard</p>
                <p className="text-xs text-gray-500 dark:text-neutral-400">See top streakers</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
            </Link>

            {/* Visibility Toggle */}
            <button
              onClick={handleToggleVisibility}
              disabled={visibilityLoading}
              className="w-full flex items-center gap-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors disabled:opacity-50 text-left"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                streak.showOnProfile
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-gray-100 dark:bg-neutral-800'
              }`}>
                {streak.showOnProfile ? (
                  <Eye className="w-5 h-5 text-blue-500" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400 dark:text-neutral-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Show on Profile</p>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  {streak.showOnProfile ? 'Visible to others' : 'Hidden from profile'}
                </p>
              </div>
              <div className={`w-9 h-5 rounded-full relative transition-colors ${
                streak.showOnProfile ? 'bg-blue-500' : 'bg-gray-300 dark:bg-neutral-600'
              }`}>
                <motion.div
                  animate={{ x: streak.showOnProfile ? 16 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </div>
            </button>

            {/* History Toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center gap-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <History className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Streak History</p>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  {history?.length || 0} recent events
                </p>
              </div>
              <motion.div
                animate={{ rotate: showHistory ? 90 : 0 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
              </motion.div>
            </button>
          </div>

          {/* History Timeline */}
          <AnimatePresence>
            {showHistory && history.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mb-6"
              >
                <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-gray-100 dark:divide-neutral-800">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-lg flex-shrink-0">{getHistoryEventEmoji(item.event)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {getHistoryEventLabel(item.event)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          {getStreakTypeLabel(item.streakType)} · {item.streakBefore}→{item.streakAfter}
                          {item.xpEarned > 0 && ` · +${item.xpEarned} XP`}
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-400 dark:text-neutral-500 flex-shrink-0">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProtectedRoute>
  );
}

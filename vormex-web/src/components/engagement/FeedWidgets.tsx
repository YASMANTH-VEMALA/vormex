'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Flame, Target, Users, FileText, MessageSquare,
  ChevronRight, TrendingUp, Zap, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { getStreaks, getWeeklyGoals, getNudges, type StreakData, type WeeklyGoals, type ProgressNudge } from '@/lib/api/engagement';
import { WeeklyGoalsSkeleton } from './WeeklyGoalsSkeleton';

/**
 * Inline feed gamification widgets — interleaved between posts
 * Mirrors Android's GamificationWidgets.kt
 */

// ─── StreakWidget ─────────────────────────────────────────────────
// Compact fire-themed streak card inserted between posts

export function StreakWidget() {
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    getStreaks().then(setStreak).catch(() => {});
  }, []);

  if (!streak) return null;

  const best = Math.max(
    streak.connectionStreak,
    streak.loginStreak,
    streak.postingStreak,
    streak.messagingStreak
  );
  if (best === 0) return null;

  const anyAtRisk = streak.isAtRisk ? Object.values(streak.isAtRisk).some(Boolean) : false;

  const rows = [
    { label: 'Networking', value: streak.connectionStreak, longest: streak.longestConnectionStreak, color: 'bg-orange-500', riskKey: 'connection' },
    { label: 'Login', value: streak.loginStreak, longest: streak.longestLoginStreak, color: 'bg-blue-500', riskKey: 'login' },
    { label: 'Posting', value: streak.postingStreak, longest: streak.longestPostingStreak, color: 'bg-green-500', riskKey: 'posting' },
    { label: 'Messaging', value: streak.messagingStreak, longest: streak.longestMessagingStreak, color: 'bg-purple-500', riskKey: 'messaging' },
  ].filter(r => r.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {best}-day streak! <span className="text-orange-500">🔥</span>
            </p>
            {anyAtRisk && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> Some streaks at risk
              </p>
            )}
          </div>
        </div>
        <Link href="/streaks" className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-0.5 hover:underline">
          Details <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Streak bars */}
      <div className="px-4 py-3 space-y-2.5">
        {rows.map((row) => {
          const pct = row.longest > 0 ? Math.min((row.value / row.longest) * 100, 100) : 100;
          const atRisk = streak.isAtRisk?.[row.riskKey] ?? false;
          return (
            <div key={row.riskKey}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-neutral-400">{row.label}</span>
                <div className="flex items-center gap-1.5">
                  {atRisk && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium">
                      At risk
                    </span>
                  )}
                  <span className="text-xs font-semibold text-gray-700 dark:text-neutral-300 tabular-nums">
                    {row.value}d
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-1.5">
                <motion.div
                  className={`h-1.5 rounded-full ${row.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}


// ─── WeeklyGoalsWidget ────────────────────────────────────────────
// Inline goals card with animated progress bars

export function WeeklyGoalsWidget() {
  const [goals, setGoals] = useState<WeeklyGoals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklyGoals()
      .then(setGoals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <WeeklyGoalsSkeleton />;
  if (!goals || goals.isCompleted) return null;

  const items = [
    { label: 'Connections', current: goals.connectionsMade, target: goals.connectionsTarget, progress: goals.connectionsProgress, icon: Users, color: 'bg-blue-500' },
    { label: 'Posts', current: goals.postsMade, target: goals.postsTarget, progress: goals.postsProgress, icon: FileText, color: 'bg-green-500' },
    { label: 'Messages', current: goals.messagesSent, target: goals.messagesTarget, progress: goals.messagesProgress, icon: MessageSquare, color: 'bg-purple-500' },
  ];

  const totalProgress = Math.round((items.reduce((sum, i) => sum + i.progress, 0) / items.length));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Weekly Goals</p>
            <p className="text-[11px] text-gray-400 dark:text-neutral-500">{totalProgress}% complete</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-neutral-400">{item.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-neutral-300 tabular-nums">
                  {item.current}/{item.target}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-1.5">
                <motion.div
                  className={`h-1.5 rounded-full ${item.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(item.progress, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}


// ─── NudgeCard ────────────────────────────────────────────────────
// Zeigarnik-effect progress nudge inserted later in feed

export function NudgeCard() {
  const [nudges, setNudges] = useState<ProgressNudge[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getNudges().then(setNudges).catch(() => {});
  }, []);

  if (dismissed || nudges.length === 0) return null;

  // Show the most impactful nudge
  const nudge = nudges[0];
  const progress = nudge.target > 0 ? Math.round((nudge.progress / nudge.target) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="text-lg">{nudge.icon || '💡'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
            {nudge.message}
          </p>
          {nudge.target > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                  {nudge.progress}/{nudge.target}
                </span>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-white/60 dark:bg-neutral-800 rounded-full h-1.5">
                <motion.div
                  className="h-1.5 rounded-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

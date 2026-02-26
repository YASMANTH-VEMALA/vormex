'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Trophy, Target, Zap, Star, Award, TrendingUp, MessageCircle, Users, Crown } from 'lucide-react';

/**
 * RewardPopup - General purpose milestone/reward popup
 * Like Android's RewardBottomSheet — fires for streaks, goals, first-time actions, XP, etc.
 */

export type RewardType =
  | 'streak_milestone'
  | 'weekly_goal_complete'
  | 'first_post'
  | 'first_connection'
  | 'connection_milestone'
  | 'leaderboard_rank'
  | 'xp_gain'
  | 'level_up'
  | 'badge_earned';

export interface RewardData {
  id: string;
  type: RewardType;
  title: string;
  message: string;
  value?: string | number;
  subtext?: string;
  showConfetti?: boolean;
}

interface RewardPopupProps {
  rewards: RewardData[];
  onDismiss: (id: string) => void;
}

const rewardConfig: Record<RewardType, {
  icon: typeof Flame;
  gradient: string;
  iconColor: string;
  badgeBg: string;
  confettiColors: string[];
}> = {
  streak_milestone: {
    icon: Flame,
    gradient: 'from-orange-500 to-red-500',
    iconColor: 'text-orange-500',
    badgeBg: 'bg-orange-50 dark:bg-orange-900/20',
    confettiColors: ['#f97316', '#ef4444', '#eab308'],
  },
  weekly_goal_complete: {
    icon: Target,
    gradient: 'from-green-500 to-emerald-500',
    iconColor: 'text-green-500',
    badgeBg: 'bg-green-50 dark:bg-green-900/20',
    confettiColors: ['#22c55e', '#10b981', '#34d399'],
  },
  first_post: {
    icon: Star,
    gradient: 'from-blue-500 to-indigo-500',
    iconColor: 'text-blue-500',
    badgeBg: 'bg-blue-50 dark:bg-blue-900/20',
    confettiColors: ['#3b82f6', '#6366f1', '#818cf8'],
  },
  first_connection: {
    icon: Users,
    gradient: 'from-purple-500 to-pink-500',
    iconColor: 'text-purple-500',
    badgeBg: 'bg-purple-50 dark:bg-purple-900/20',
    confettiColors: ['#a855f7', '#ec4899', '#d946ef'],
  },
  connection_milestone: {
    icon: Users,
    gradient: 'from-indigo-500 to-purple-500',
    iconColor: 'text-indigo-500',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-900/20',
    confettiColors: ['#6366f1', '#a855f7', '#818cf8'],
  },
  leaderboard_rank: {
    icon: Crown,
    gradient: 'from-amber-500 to-yellow-500',
    iconColor: 'text-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-900/20',
    confettiColors: ['#f59e0b', '#eab308', '#fbbf24'],
  },
  xp_gain: {
    icon: Zap,
    gradient: 'from-cyan-500 to-blue-500',
    iconColor: 'text-cyan-500',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-900/20',
    confettiColors: ['#06b6d4', '#3b82f6', '#0891b2'],
  },
  level_up: {
    icon: TrendingUp,
    gradient: 'from-emerald-500 to-teal-500',
    iconColor: 'text-emerald-500',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    confettiColors: ['#10b981', '#14b8a6', '#34d399'],
  },
  badge_earned: {
    icon: Award,
    gradient: 'from-pink-500 to-rose-500',
    iconColor: 'text-pink-500',
    badgeBg: 'bg-pink-50 dark:bg-pink-900/20',
    confettiColors: ['#ec4899', '#f43f5e', '#fb7185'],
  },
};

export default function RewardPopup({ rewards, onDismiss }: RewardPopupProps) {
  const [currentReward, setCurrentReward] = useState<RewardData | null>(null);

  useEffect(() => {
    if (rewards.length > 0 && !currentReward) {
      setCurrentReward(rewards[0]);
    }
  }, [rewards, currentReward]);

  const fireConfetti = useCallback(async (colors: string[]) => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 60, spread: 55, origin: { x: 0.3, y: 0.6 }, colors });
      setTimeout(() => {
        confetti({ particleCount: 60, spread: 55, origin: { x: 0.7, y: 0.6 }, colors });
      }, 150);
    } catch {
      // canvas-confetti not available
    }
  }, []);

  useEffect(() => {
    if (currentReward?.showConfetti) {
      const config = rewardConfig[currentReward.type];
      setTimeout(() => fireConfetti(config.confettiColors), 300);
    }
  }, [currentReward, fireConfetti]);

  // Auto-dismiss after 5s
  useEffect(() => {
    if (!currentReward) return;
    const timer = setTimeout(() => handleDismiss(), 5000);
    return () => clearTimeout(timer);
  }, [currentReward]);

  const handleDismiss = () => {
    if (!currentReward) return;
    const id = currentReward.id;
    setCurrentReward(null);
    onDismiss(id);
    // Show next reward after brief delay
    setTimeout(() => {
      const remaining = rewards.filter(r => r.id !== id);
      if (remaining.length > 0) {
        setCurrentReward(remaining[0]);
      }
    }, 300);
  };

  if (!currentReward) return null;

  const config = rewardConfig[currentReward.type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        key={currentReward.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/30"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-xl border border-gray-200 dark:border-neutral-800 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient header */}
          <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

          <div className="p-6 text-center">
            {/* Animated icon */}
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
              className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${config.badgeBg} flex items-center justify-center`}
            >
              <Icon className={`w-8 h-8 ${config.iconColor}`} />
            </motion.div>

            {/* Value badge */}
            {currentReward.value && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${config.badgeBg} mb-3`}
              >
                <span className={`text-lg font-bold ${config.iconColor}`}>
                  {currentReward.value}
                </span>
              </motion.div>
            )}

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-lg font-bold text-gray-900 dark:text-white mb-1"
            >
              {currentReward.title}
            </motion.h2>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-gray-500 dark:text-neutral-400 mb-1"
            >
              {currentReward.message}
            </motion.p>

            {/* Subtext */}
            {currentReward.subtext && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-gray-400 dark:text-neutral-500"
              >
                {currentReward.subtext}
              </motion.p>
            )}

            {/* Remaining indicator */}
            {rewards.length > 1 && (
              <div className="flex items-center justify-center gap-1 mt-4">
                {rewards.slice(0, Math.min(rewards.length, 5)).map((r, i) => (
                  <div
                    key={r.id}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      r.id === currentReward.id
                        ? 'bg-blue-500'
                        : 'bg-gray-200 dark:bg-neutral-700'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="w-full py-3 border-t border-gray-100 dark:border-neutral-800 text-sm font-medium text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

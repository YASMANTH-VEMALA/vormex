'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, Check } from 'lucide-react';
import type { MilestoneData } from '@/lib/api/variable-rewards';

interface MilestoneCardProps {
  milestones: MilestoneData[];
  onDismiss: () => void;
}

/**
 * MilestoneCard — Celebration card for unlocked milestones
 * Green gradient with animated progress dots + confetti-style accent
 */
export function MilestoneCard({ milestones, onDismiss }: MilestoneCardProps) {
  const milestone = milestones[0];
  if (!milestone) return null;

  const iconEmoji = milestone.icon || '🏆';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="relative overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40"
    >
      {/* Confetti accents */}
      <div className="absolute top-2 left-6 w-2 h-2 bg-yellow-400 rounded-full opacity-60" />
      <div className="absolute top-4 right-12 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-50" />
      <div className="absolute top-6 left-20 w-1 h-1 bg-blue-400 rounded-full opacity-40" />

      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xl"
          >
            {iconEmoji}
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              Milestone Unlocked! 🎉
            </p>
            <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
              {milestone.title}
            </p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
          <X className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      <div className="px-4 py-3">
        <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-3">
          {milestone.description}
        </p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-3">
          {Array.from({ length: Math.min(milestone.value, 10) }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center"
            >
              <Check className="w-2 h-2 text-white" />
            </motion.div>
          ))}
          {milestone.value > 10 && (
            <span className="text-[10px] text-emerald-500 font-medium ml-1">
              +{milestone.value - 10} more
            </span>
          )}
        </div>

        {/* XP Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold"
        >
          <Trophy className="w-3 h-3" />
          +{milestone.value * 10} XP earned
        </motion.div>
      </div>
    </motion.div>
  );
}

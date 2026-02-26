'use client';

import { motion } from 'framer-motion';
import { X, Zap, Sparkles } from 'lucide-react';
import type { SurpriseBoostData } from '@/lib/api/variable-rewards';

interface SurpriseBoostCardProps {
  data: SurpriseBoostData;
  onDismiss: () => void;
}

/**
 * SurpriseBoostCard — Surprise XP boost for loyal users
 * Gradient rose→pink with animated XP counter
 */
export function SurpriseBoostCard({ data, onDismiss }: SurpriseBoostCardProps) {
  if (!data.eligible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="relative overflow-hidden rounded-xl border border-rose-200 dark:border-rose-800/50 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40"
    >
      {/* Sparkle accents */}
      <div className="absolute top-3 right-8 w-2 h-2 bg-yellow-300 rounded-full opacity-60 animate-pulse" />
      <div className="absolute top-8 right-4 w-1.5 h-1.5 bg-pink-300 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-6 left-6 w-1 h-1 bg-rose-300 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ rotate: -20 }}
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center"
          >
            <Zap className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
              Surprise Boost! ⚡
            </p>
            <p className="text-[11px] text-rose-600/70 dark:text-rose-400/70">
              {data.reason}
            </p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
          <X className="w-4 h-4 text-rose-400" />
        </button>
      </div>

      <div className="px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-rose-500 dark:text-rose-400 mb-1">
            {data.activeDays} days active this week
          </p>
          <p className="text-sm text-rose-700 dark:text-rose-300">
            You've earned a special bonus!
          </p>
        </div>

        {/* XP Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.4 }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-lg font-bold">+{data.xpAmount}</span>
          <span className="text-xs opacity-80">XP</span>
        </motion.div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={onDismiss}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors"
        >
          <Zap className="w-4 h-4" />
          Claim Boost
        </button>
      </div>
    </motion.div>
  );
}

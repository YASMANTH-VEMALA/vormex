'use client';

import { motion } from 'framer-motion';
import { X, TrendingUp, Eye } from 'lucide-react';
import type { TrendingData } from '@/lib/api/variable-rewards';

interface TrendingCardProps {
  data: TrendingData;
  onDismiss: () => void;
}

/**
 * TrendingCard — "Your profile is trending!" notification
 * Gradient amber→red with stats comparison
 */
export function TrendingCard({ data, onDismiss }: TrendingCardProps) {
  if (!data.hasSpike) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="relative overflow-hidden rounded-xl border border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-red-50 dark:from-amber-950/40 dark:to-red-950/40"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              You're Trending! 📈
            </p>
            <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70">
              Your profile views are surging
            </p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
          <X className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Stats comparison */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-amber-500 dark:text-amber-400 mb-0.5">Before</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-200">{data.previousViews}</p>
          </div>
          <div className="text-amber-400">→</div>
          <div className="text-center">
            <p className="text-xs text-red-500 dark:text-red-400 mb-0.5">Today</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-300">{data.recentViews}</p>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-white text-sm font-bold"
        >
          +{data.increasePercent}%
        </motion.div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-1.5 text-[11px] text-amber-600/60 dark:text-amber-400/50">
          <Eye className="w-3 h-3" />
          Keep posting to maintain your momentum!
        </div>
      </div>
    </motion.div>
  );
}

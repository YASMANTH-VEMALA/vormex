'use client';

import { motion } from 'framer-motion';
import { X, UserPlus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { MatchUser } from '@/lib/api/variable-rewards';

interface MatchBurstCardProps {
  matches: MatchUser[];
  onDismiss: () => void;
}

/**
 * MatchBurstCard — "You have new matches!" card
 * Gradient indigo→purple, staggered avatar entrance
 */
export function MatchBurstCard({ matches, onDismiss }: MatchBurstCardProps) {
  if (!matches.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="relative overflow-hidden rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
              {matches.length} New Match{matches.length > 1 ? 'es' : ''}! ✨
            </p>
            <p className="text-[11px] text-indigo-600/70 dark:text-indigo-400/70">
              People who share your interests
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
        >
          <X className="w-4 h-4 text-indigo-400" />
        </button>
      </div>

      {/* Avatar Row */}
      <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
        {matches.slice(0, 5).map((match, i) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              href={`/profile/${match.username}`}
              className="flex flex-col items-center gap-1.5 min-w-[64px]"
            >
              <div className="relative">
                {match.profileImage ? (
                  <img
                    src={match.profileImage}
                    alt={match.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-400 ring-offset-2 ring-offset-indigo-50 dark:ring-offset-indigo-950"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold ring-2 ring-indigo-400 ring-offset-2">
                    {match.name.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-[11px] font-medium text-indigo-800 dark:text-indigo-200 truncate max-w-[64px]">
                {match.name.split(' ')[0]}
              </p>
            </Link>
          </motion.div>
        ))}
        {matches.length > 5 && (
          <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
            <div className="w-12 h-12 rounded-full bg-indigo-200/60 dark:bg-indigo-800/40 flex items-center justify-center">
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                +{matches.length - 5}
              </span>
            </div>
            <p className="text-[11px] text-indigo-500">more</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <Link
          href="/connections"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          View Matches
        </Link>
      </div>
    </motion.div>
  );
}

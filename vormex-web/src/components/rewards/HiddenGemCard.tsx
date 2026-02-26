'use client';

import { motion } from 'framer-motion';
import { X, Gem, UserPlus } from 'lucide-react';
import Link from 'next/link';
import type { MatchUser } from '@/lib/api/variable-rewards';

interface HiddenGemCardProps {
  gems: MatchUser[];
  onDismiss: () => void;
}

/**
 * HiddenGemCard — Discover underrated peers with shared interests
 * Gold-bordered profile card with interest overlap
 */
export function HiddenGemCard({ gems, onDismiss }: HiddenGemCardProps) {
  const gem = gems[0];
  if (!gem) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="relative overflow-hidden rounded-xl border-2 border-yellow-300 dark:border-yellow-700/60 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30"
    >
      {/* Sparkle accent */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-200/30 dark:bg-yellow-700/10 rounded-full blur-2xl" />

      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
            <Gem className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
              Hidden Gem 💎
            </p>
            <p className="text-[11px] text-yellow-600/70 dark:text-yellow-400/70">
              Someone special shares your vibe
            </p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
          <X className="w-4 h-4 text-yellow-400" />
        </button>
      </div>

      {/* Profile */}
      <Link href={`/profile/${gem.username}`} className="block px-4 py-3">
        <div className="flex items-center gap-3">
          {gem.profileImage ? (
            <img
              src={gem.profileImage}
              alt={gem.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-yellow-400 ring-offset-2 ring-offset-yellow-50 dark:ring-offset-yellow-950"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center text-xl font-bold text-yellow-700 dark:text-yellow-300 ring-2 ring-yellow-400 ring-offset-2">
              {gem.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{gem.name}</p>
            {gem.headline && (
              <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">{gem.headline}</p>
            )}
            {gem.college && (
              <p className="text-[11px] text-yellow-600 dark:text-yellow-400 mt-0.5">{gem.college}</p>
            )}
          </div>
        </div>

        {/* Shared interests */}
        {gem.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {gem.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </Link>

      <div className="px-4 pb-4">
        <Link
          href={`/profile/${gem.username}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Connect with {gem.name.split(' ')[0]}
        </Link>
      </div>
    </motion.div>
  );
}

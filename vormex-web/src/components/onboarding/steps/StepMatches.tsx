'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { onboardingAPI, type MatchResult } from '@/lib/api/onboarding';

interface Props {
  onFinish: () => void;
}

export default function StepMatches({ onFinish }: Props) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await onboardingAPI.getInitialMatches();
        setMatches(data.matches.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  useEffect(() => {
    if (!loading && matches.length > 0 && revealed < matches.length) {
      const timer = setTimeout(() => setRevealed(r => r + 1), 300);
      return () => clearTimeout(timer);
    }
  }, [loading, matches.length, revealed]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
        <div className="w-10 h-10 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-500">Finding people like you...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
        <span className="text-4xl">🌱</span>
        <p className="font-semibold text-neutral-800 dark:text-neutral-200">You&apos;re one of the first from your campus!</p>
        <p className="text-sm text-neutral-500 text-center max-w-xs">
          As more students join, we&apos;ll match you with the right people. Meanwhile, explore circles and start connecting.
        </p>
        <button
          onClick={onFinish}
          className="mt-4 w-full py-3.5 rounded-xl font-semibold text-sm bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Explore Vormex
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Found <span className="font-semibold text-neutral-800 dark:text-neutral-200">{matches.length} matches</span> based on your interests and campus. You can connect with them after.
      </p>

      <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] custom-scrollbar">
        {matches.map((match, i) => (
          <motion.div
            key={match.user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={i < revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800"
          >
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                {match.user.profileImage ? (
                  <img src={match.user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-neutral-500 text-sm">{match.user.name.charAt(0)}</span>
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900 text-[8px] font-bold text-white ${
                match.matchPercentage >= 60 ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                {match.matchPercentage}%
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{match.user.name}</p>
              <p className="text-[11px] text-neutral-500 truncate">{match.user.college || match.user.headline}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {match.reasons.slice(0, 2).map((reason, j) => (
                  <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <button
        onClick={onFinish}
        className="w-full py-3.5 rounded-xl font-semibold text-sm bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-[0.98] transition-all"
      >
        Start Connecting
      </button>
    </div>
  );
}

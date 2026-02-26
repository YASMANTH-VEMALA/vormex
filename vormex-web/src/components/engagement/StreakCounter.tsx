'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Trophy, Target, TrendingUp, X, LogIn, FileText, MessageCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getStreaks, type StreakData } from '@/lib/api/engagement';

/**
 * StreakCounter - Professional streak badge with clean detail panel
 */
export default function StreakCounter() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreaks = async () => {
      try {
        const data = await getStreaks();
        setStreak(data);
      } catch (error) {
        console.error('Failed to fetch streaks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStreaks();
  }, []);

  if (loading || !streak) return null;

  const bestCurrentStreak = Math.max(
    streak.connectionStreak,
    streak.loginStreak,
    streak.postingStreak,
    streak.messagingStreak
  );
  const hasStreak = bestCurrentStreak > 0;
  const anyAtRisk = streak.isAtRisk ? Object.values(streak.isAtRisk).some(Boolean) : false;

  return (
    <>
      {/* Compact Badge */}
      <button
        onClick={() => setIsExpanded(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          hasStreak
            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30'
            : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
        }`}
      >
        <Flame className="w-4 h-4" />
        <span>{bestCurrentStreak}</span>
        {anyAtRisk && hasStreak && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        )}
      </button>

      {/* Detail Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-sm shadow-lg border border-gray-200 dark:border-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Your Streaks</h3>
                <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Streak rows */}
                {[
                  { label: 'Networking', value: streak.connectionStreak, longest: streak.longestConnectionStreak, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', riskKey: 'connection' },
                  { label: 'Login', value: streak.loginStreak, longest: streak.longestLoginStreak, icon: LogIn, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', riskKey: 'login' },
                  { label: 'Posting', value: streak.postingStreak, longest: streak.longestPostingStreak, icon: FileText, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', riskKey: 'posting' },
                  { label: 'Messaging', value: streak.messagingStreak, longest: streak.longestMessagingStreak, icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', riskKey: 'messaging' },
                ].map((item) => {
                  const Icon = item.icon;
                  const atRisk = streak.isAtRisk?.[item.riskKey] ?? false;
                  return (
                    <div key={item.riskKey} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                          {item.value} <span className="text-xs font-normal text-gray-400 dark:text-neutral-500">/ best {item.longest}</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">{item.label}</p>
                      </div>
                      {atRisk && (
                        <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] rounded font-medium">
                          At risk
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-neutral-800">
                  <div className="py-3 text-center">
                    <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1.5" />
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{streak.overallBestStreak}</p>
                    <p className="text-[11px] text-gray-400 dark:text-neutral-500 mt-0.5">Best ever</p>
                  </div>
                  <div className="py-3 text-center">
                    <Target className="w-4 h-4 text-blue-500 mx-auto mb-1.5" />
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {streak.weeklyConnectionsMade}/{streak.weeklyConnectionsGoal}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-neutral-500 mt-0.5">This week</p>
                  </div>
                </div>

                {/* View Full Dashboard Link */}
                <Link
                  href="/streaks"
                  onClick={() => setIsExpanded(false)}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors"
                >
                  View Full Dashboard
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

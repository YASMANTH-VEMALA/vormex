'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { matchingAPI, type SmartMatch } from '@/lib/api/matching';
import { Zap, ChevronRight } from 'lucide-react';

export function RecommendedPeople() {
  const router = useRouter();
  const [matches, setMatches] = useState<SmartMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await matchingAPI.getSmartMatches({ type: 'all', limit: 8 });
        setMatches(data.matches);
      } catch {
        // Silently fail - this is a supplementary section
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-32 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-[140px] h-[160px] rounded-2xl bg-gray-100 dark:bg-neutral-900 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">People like you</h3>
        </div>
        <button
          onClick={() => router.push('/find-people')}
          className="flex items-center gap-0.5 text-xs text-blue-500 font-medium hover:text-blue-600 transition-colors"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {matches.map((match, i) => (
          <motion.div
            key={match.user.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => router.push(`/profile/${match.user.username}`)}
            className="flex-shrink-0 w-[130px] bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-3 cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-neutral-700 transition-all"
          >
            <div className="relative mx-auto w-14 h-14 mb-2">
              <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                {match.user.profileImage ? (
                  <img src={match.user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-gray-400 text-lg">{match.user.name.charAt(0)}</span>
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900 text-[7px] font-bold text-white ${
                match.matchPercentage >= 60 ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                {match.matchPercentage}%
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-900 dark:text-white text-center truncate">{match.user.name}</p>
            <p className="text-[10px] text-gray-500 dark:text-neutral-500 text-center truncate mt-0.5">
              {match.user.college || match.user.headline || ''}
            </p>

            {match.reasons[0] && (
              <p className="text-[9px] text-blue-500 text-center mt-1.5 font-medium truncate">
                {match.reasons[0]}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

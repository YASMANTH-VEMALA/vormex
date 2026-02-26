'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { matchingAPI, type SmartMatch } from '@/lib/api/matching';

const GOAL_LABELS: Record<string, string> = {
  learn_coding: 'Coding & Tech',
  web_dev: 'Web Dev',
  mobile_dev: 'Mobile Dev',
  ai_ml: 'AI & ML',
  competitive_programming: 'Competitive Coding',
  start_business: 'Business',
  get_internship: 'Career',
  design: 'Design',
  data_science: 'Data Science',
  cybersecurity: 'Cybersecurity',
  devops: 'DevOps',
  content_creation: 'Content',
  research: 'Research',
  freelance: 'Freelancing',
  sports_fitness: 'Sports & Fitness',
  music_arts: 'Music & Arts',
  photography: 'Photography',
};

export function SmartMatchesTab() {
  const router = useRouter();
  const [matches, setMatches] = useState<SmartMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await matchingAPI.getSmartMatches({
        type: filter as any,
        limit: 20,
      });
      setMatches(data.matches);
    } catch (error) {
      console.error('Failed to fetch smart matches:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const filters = [
    { id: 'all', label: 'Best Matches' },
    { id: 'same_campus', label: 'Same Campus' },
    { id: 'same_goal', label: 'Same Goal' },
    { id: 'mentor', label: 'Find Mentor' },
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-32" />
                <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded w-48" />
              </div>
              <div className="w-16 h-8 bg-gray-200 dark:bg-neutral-800 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium text-gray-700 dark:text-neutral-300">No matches found</p>
          <p className="text-sm text-gray-500 dark:text-neutral-500 mt-1">
            Complete your profile and add interests to get matched
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match, i) => (
            <motion.div
              key={match.user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => router.push(`/profile/${match.user.username}`)}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 cursor-pointer hover:border-blue-300 dark:hover:border-blue-800 transition-all"
            >
              {/* Avatar + Score */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                  {match.user.profileImage ? (
                    <img src={match.user.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-gray-500 dark:text-neutral-400">{match.user.name.charAt(0)}</span>
                  )}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-950 text-[8px] font-bold text-white ${
                  match.matchPercentage >= 60 ? 'bg-green-500' : match.matchPercentage >= 35 ? 'bg-blue-500' : 'bg-orange-500'
                }`}>
                  {match.matchPercentage}%
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{match.user.name}</p>
                  {match.tags.includes('github-verified') && (
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  )}
                  {match.tags.includes('active') && (
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                  {[match.user.college, match.user.onboarding?.primaryGoal ? GOAL_LABELS[match.user.onboarding.primaryGoal] : null].filter(Boolean).join(' · ')}
                </p>
                {match.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {match.reasons.slice(0, 2).map((reason, j) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Connect */}
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/profile/${match.user.username}`); }}
                className="px-3 py-1.5 rounded-full bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors flex-shrink-0"
              >
                View
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

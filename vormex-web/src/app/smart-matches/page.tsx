'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { matchingAPI, type SmartMatch } from '@/lib/api/matching';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const MATCH_TYPES = [
  { id: 'all', label: 'Best Matches', emoji: '✨' },
  { id: 'same_campus', label: 'Same Campus', emoji: '🏫' },
  { id: 'same_goal', label: 'Same Goal', emoji: '🎯' },
  { id: 'mentor', label: 'Find Mentor', emoji: '🧭' },
  { id: 'mentee', label: 'Find Mentee', emoji: '🌱' },
] as const;

const GOAL_LABELS: Record<string, string> = {
  learn_coding: 'Learning to Code',
  web_dev: 'Web Development',
  mobile_dev: 'Mobile Dev',
  ai_ml: 'AI & Machine Learning',
  competitive_programming: 'Competitive Programming',
  start_business: 'Building a Startup',
  get_internship: 'Getting an Internship',
  design: 'UI/UX Design',
  data_science: 'Data Science',
  cybersecurity: 'Cybersecurity',
  devops: 'DevOps & Cloud',
  content_creation: 'Content Creation',
  research: 'Research',
  freelance: 'Freelancing',
};

function MatchCard({ match }: { match: SmartMatch }) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => router.push(`/profile/${match.user.username}`)}
    >
      <div className="flex items-start gap-4">
        {/* Avatar with match score */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
            {match.user.profileImage ? (
              <img src={match.user.profileImage} alt={match.user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">{match.user.name.charAt(0)}</span>
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900 ${
            match.matchPercentage >= 70 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
            match.matchPercentage >= 40 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
            'bg-gradient-to-r from-orange-400 to-yellow-500'
          }`}>
            <span className="text-[9px] font-bold text-white">{match.matchPercentage}%</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm truncate">{match.user.name}</h3>
            {match.tags.includes('github-verified') && (
              <svg className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            )}
            {match.tags.includes('active') && (
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            )}
          </div>

          {match.user.headline && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{match.user.headline}</p>
          )}
          
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
            {match.user.college && <span>{match.user.college}</span>}
            {match.user.college && match.user.onboarding?.primaryGoal && <span>·</span>}
            {match.user.onboarding?.primaryGoal && (
              <span>{GOAL_LABELS[match.user.onboarding.primaryGoal] || match.user.onboarding.primaryGoal}</span>
            )}
          </div>

          {/* Skills */}
          {match.user.skills && match.user.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {match.user.skills.slice(0, 4).map(skill => (
                <span key={skill.name} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {skill.name}
                </span>
              ))}
            </div>
          )}

          {/* Match reasons */}
          <div className="flex flex-wrap gap-1 mt-2">
            {match.reasons.map((reason, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>

        {/* Connect button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/profile/${match.user.username}`);
          }}
          className="px-3 py-1.5 rounded-full bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20 flex-shrink-0"
        >
          Connect
        </button>
      </div>
    </motion.div>
  );
}

function SmartMatchesContent() {
  const [type, setType] = useState<string>('all');
  const [matches, setMatches] = useState<SmartMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMatches = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const data = await matchingAPI.getSmartMatches({ type: type as any, page: currentPage, limit: 15 });
      if (reset) {
        setMatches(data.matches);
        setPage(1);
      } else {
        setMatches(prev => [...prev, ...data.matches]);
      }
      setHasMore(currentPage < data.totalPages);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setLoading(false);
    }
  }, [type, page]);

  useEffect(() => {
    fetchMatches(true);
  }, [type]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Smart Matches</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            AI-powered matches based on your goals, skills & interests
          </p>

          {/* Type filters */}
          <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1 -mx-1 px-1 custom-scrollbar">
            {MATCH_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  type === t.id
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matches */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading && matches.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-32" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-48" />
                  <div className="flex gap-1">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-full w-16" />
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-full w-20" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : matches.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="font-medium text-neutral-700 dark:text-neutral-300">No matches yet</p>
            <p className="text-sm text-neutral-500 mt-1">
              Complete your onboarding profile to get matched with the right people
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {matches.map((match, i) => (
              <MatchCard key={match.user.id} match={match} />
            ))}
          </AnimatePresence>
        )}

        {hasMore && matches.length > 0 && (
          <button
            onClick={() => { setPage(p => p + 1); fetchMatches(); }}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            {loading ? 'Loading...' : 'Load more matches'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SmartMatchesPage() {
  return (
    <ProtectedRoute>
      <SmartMatchesContent />
    </ProtectedRoute>
  );
}

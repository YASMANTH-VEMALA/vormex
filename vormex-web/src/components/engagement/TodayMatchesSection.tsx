'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, ChevronRight, ChevronLeft, Check, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { getDailyMatches, type DailyMatch, type DailyMatchesResponse } from '@/lib/api/engagement';
import { sendConnectionRequest } from '@/lib/api/connections';
import Link from 'next/link';
import { TodayMatchesSkeleton } from './TodayMatchesSkeleton';

/**
 * TodayMatchesSection - Horizontal scrollable match cards at top of feed
 * Like Android's TodayMatchesSection — prominent, above posts
 */
export default function TodayMatchesSection() {
  const [matchData, setMatchData] = useState<DailyMatchesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getDailyMatches();
        setMatchData(data);
      } catch (error) {
        console.error('Failed to fetch daily matches:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  // Track scroll state for arrow visibility
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setCanScrollLeft(el.scrollLeft > 8);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, [matchData]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  const handleConnect = async (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (connectingIds.has(userId) || connectedIds.has(userId)) return;

    setConnectingIds(prev => new Set([...prev, userId]));
    try {
      await sendConnectionRequest(userId);
      setConnectedIds(prev => new Set([...prev, userId]));
    } catch (error) {
      console.error('Failed to send connection request:', error);
    } finally {
      setConnectingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  if (loading) return <TodayMatchesSkeleton />;
  if (!matchData || matchData.matches.length === 0) return null;

  return (
    <div className="relative mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-0 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Today&apos;s Matches</h3>
          <span className="text-xs text-gray-400 dark:text-neutral-500">
            {matchData.matches.length} people
          </span>
        </div>
        <Link
          href="/find-people"
          className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Scroll arrows (desktop) */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            key="scroll-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('left')}
            className="hidden lg:flex absolute left-0 top-1/2 mt-3 z-10 w-8 h-8 items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-md hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-neutral-300" />
          </motion.button>
        )}
        {canScrollRight && (
          <motion.button
            key="scroll-right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('right')}
            className="hidden lg:flex absolute right-0 top-1/2 mt-3 z-10 w-8 h-8 items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-md hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-neutral-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 lg:px-0 pb-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {matchData.matches.map((match, i) => (
          <MatchCard
            key={match.id}
            match={match}
            index={i}
            isConnecting={connectingIds.has(match.id)}
            isConnected={connectedIds.has(match.id)}
            onConnect={handleConnect}
          />
        ))}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  index,
  isConnecting,
  isConnected,
  onConnect,
}: {
  match: DailyMatch;
  index: number;
  isConnecting: boolean;
  isConnected: boolean;
  onConnect: (e: React.MouseEvent, userId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex-shrink-0 w-[200px] bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden hover:shadow-md transition-shadow"
      style={{ scrollSnapAlign: 'start' }}
    >
      <Link href={`/profile/${match.username}`} className="block">
        {/* Avatar + Online indicator */}
        <div className="relative flex justify-center pt-4 pb-2">
          <div className="relative">
            {match.profileImage ? (
              <img
                src={match.profileImage}
                alt={match.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-neutral-800 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-400 border-2 border-white dark:border-neutral-800 shadow-sm">
                {match.name.charAt(0)}
              </div>
            )}
            {match.isOnline && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-3 pb-2 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{match.name}</p>
          {match.college && (
            <p className="text-[11px] text-gray-400 dark:text-neutral-500 truncate mt-0.5">{match.college}</p>
          )}
          {match.headline && (
            <p className="text-[11px] text-gray-500 dark:text-neutral-400 truncate mt-0.5">{match.headline}</p>
          )}
        </div>

        {/* Interest chips */}
        {match.interests && match.interests.length > 0 && (
          <div className="px-3 pb-2 flex flex-wrap justify-center gap-1">
            {match.interests.slice(0, 2).map((interest) => (
              <span
                key={interest}
                className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
              >
                {interest}
              </span>
            ))}
            {match.interests.length > 2 && (
              <span className="text-[10px] px-1.5 py-0.5 text-gray-400 dark:text-neutral-500">
                +{match.interests.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Reply rate badge */}
        {match.replyRate !== undefined && match.replyRate >= 50 && (
          <div className="flex justify-center pb-2">
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
              match.replyRate >= 80
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
            }`}>
              <MessageCircle className="w-2.5 h-2.5" />
              {match.replyRate}% reply rate
            </span>
          </div>
        )}
      </Link>

      {/* Connect button */}
      <div className="px-3 pb-3">
        {isConnected ? (
          <div className="flex items-center justify-center gap-1.5 w-full py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-lg">
            <Check className="w-3 h-3" />
            Request Sent
          </div>
        ) : (
          <button
            onClick={(e) => onConnect(e, match.id)}
            disabled={isConnecting}
            className="flex items-center justify-center gap-1.5 w-full py-2 border border-blue-500 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
          >
            {isConnecting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <UserPlus className="w-3 h-3" />
            )}
            Connect
          </button>
        )}
      </div>
    </motion.div>
  );
}

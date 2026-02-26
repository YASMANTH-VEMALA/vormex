'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, ChevronRight, X, MessageCircle, Check, Loader2 } from 'lucide-react';
import { getDailyMatches, getHiddenGem, type DailyMatch, type DailyMatchesResponse } from '@/lib/api/engagement';
import { sendConnectionRequest } from '@/lib/api/connections';
import Link from 'next/link';
import { PeopleYouMayKnowSkeleton } from './PeopleYouMayKnowSkeleton';

/**
 * DailyMatchCard - Professional "People you may know" card
 * Clean LinkedIn-style suggestion list with functional Connect button
 */
export default function DailyMatchCard() {
  const [matchData, setMatchData] = useState<DailyMatchesResponse | null>(null);
  const [hiddenGem, setHiddenGem] = useState<{ match: DailyMatch; message: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const [matches, gem] = await Promise.all([
          getDailyMatches(),
          getHiddenGem(),
        ]);
        setMatchData(matches);
        if (gem) setHiddenGem(gem as { match: DailyMatch; message: string });
      } catch (error) {
        console.error('Failed to fetch daily matches:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

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

  if (loading) return <PeopleYouMayKnowSkeleton />;
  if (dismissed || !matchData || matchData.matches.length === 0) return null;

  const ConnectButton = ({ userId }: { userId: string }) => {
    const isConnecting = connectingIds.has(userId);
    const isConnected = connectedIds.has(userId);
    
    if (isConnected) {
      return (
        <span className="flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-full flex-shrink-0">
          <Check className="w-3 h-3" />
          Sent
        </span>
      );
    }
    
    return (
      <button
        onClick={(e) => handleConnect(e, userId)}
        disabled={isConnecting}
        className="flex items-center gap-1 px-3 py-1.5 border border-blue-500 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex-shrink-0 disabled:opacity-50"
      >
        {isConnecting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <UserPlus className="w-3 h-3" />
        )}
        Connect
      </button>
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          People you may know
        </h3>
        <button onClick={() => setDismissed(true)} className="p-0.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors">
          <X className="w-4 h-4 text-gray-300 dark:text-neutral-500" />
        </button>
      </div>

      {/* Surprise message — subtle info bar */}
      <AnimatePresence>
        {matchData.surpriseMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/20"
          >
            <p className="text-xs text-blue-600 dark:text-blue-400">{matchData.surpriseMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match List */}
      <div className="divide-y divide-gray-100 dark:divide-neutral-800">
        {matchData.matches.map((match) => (
          <Link
            key={match.id}
            href={`/profile/${match.username}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            {match.profileImage ? (
              <img
                src={match.profileImage}
                alt={match.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-gray-500 dark:text-neutral-400 text-sm font-semibold flex-shrink-0">
                {match.name.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{match.name}</p>
                {match.isOnline && (
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                )}
              </div>
              {match.headline && (
                <p className="text-xs text-gray-500 dark:text-neutral-400 truncate mt-0.5">{match.headline}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                {match.college && (
                  <p className="text-xs text-gray-400 dark:text-neutral-500 truncate">{match.college}</p>
                )}
                {match.replyRate !== undefined && (
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    match.replyRate >= 80
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : match.replyRate >= 50
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400'
                  }`}>
                    <MessageCircle className="w-2.5 h-2.5" />
                    {match.replyRate}%
                  </span>
                )}
              </div>
            </div>

            <ConnectButton userId={match.id} />
          </Link>
        ))}
      </div>

      {/* Hidden Gem — integrated as a highlighted row */}
      {hiddenGem && (
        <Link
          href={`/profile/${hiddenGem.match.username}`}
          className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-neutral-800/30 border-t border-gray-100 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800/60 transition-colors"
        >
          {hiddenGem.match.profileImage ? (
            <img
              src={hiddenGem.match.profileImage}
              alt={hiddenGem.match.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-gray-500 dark:text-neutral-400 text-sm font-semibold flex-shrink-0">
              {hiddenGem.match.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">{hiddenGem.message}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{hiddenGem.match.name}</p>
            <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">{hiddenGem.match.headline || hiddenGem.match.college}</p>
          </div>
          <ConnectButton userId={hiddenGem.match.id} />
        </Link>
      )}

      {/* Footer */}
      <Link
        href="/find-people"
        className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors border-t border-gray-100 dark:border-neutral-800"
      >
        Show more <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

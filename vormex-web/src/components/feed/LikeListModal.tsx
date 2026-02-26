'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getReactionConfig, REACTIONS } from './ReactionPicker';
import type { ReactionType } from '@/types/post';
import apiClient from '@/lib/api/client';

interface LikeUser {
  id: string;
  username: string;
  name: string;
  profileImage: string | null;
  headline: string | null;
  reactionType: ReactionType;
  createdAt: string;
}

interface LikeListModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  totalCount: number;
}

export function LikeListModal({ isOpen, onClose, postId, totalCount }: LikeListModalProps) {
  const [likes, setLikes] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<ReactionType | 'ALL'>('ALL');
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    LIKE: 0,
    CELEBRATE: 0,
    SUPPORT: 0,
    INSIGHTFUL: 0,
    CURIOUS: 0,
  });

  useEffect(() => {
    if (!isOpen || !postId) return;

    const fetchLikes = async () => {
      setLoading(true);
      try {
        // apiClient already extracts response.data, so response IS the data
        const data = await apiClient.get(`/posts/${postId}/likes`) as any;
        setLikes(data.likes || []);
        
        // Calculate reaction counts
        const counts: Record<ReactionType, number> = {
          LIKE: 0,
          CELEBRATE: 0,
          SUPPORT: 0,
          INSIGHTFUL: 0,
          CURIOUS: 0,
        };
        data.likes?.forEach((like: LikeUser) => {
          if (like.reactionType && counts[like.reactionType] !== undefined) {
            counts[like.reactionType]++;
          }
        });
        setReactionCounts(counts);
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [isOpen, postId]);

  const filteredLikes = selectedFilter === 'ALL' 
    ? likes 
    : likes.filter(like => like.reactionType === selectedFilter);

  // Get reactions with counts > 0
  const activeReactions = REACTIONS.filter(r => reactionCounts[r.type] > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed inset-x-4 top-[10%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl z-50 max-w-lg w-full max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reactions
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
              </button>
            </div>

            {/* Reaction Filter Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-neutral-800 overflow-x-auto">
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedFilter === 'ALL'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                }`}
              >
                All
                <span className="text-xs bg-gray-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full">
                  {totalCount}
                </span>
              </button>

              {activeReactions.map((reaction) => {
                const Icon = reaction.icon;
                const count = reactionCounts[reaction.type];
                
                return (
                  <button
                    key={reaction.type}
                    onClick={() => setSelectedFilter(reaction.type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedFilter === reaction.type
                        ? `${reaction.bgColor} ${reaction.color}`
                        : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs bg-gray-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* User List */}
            <div className="overflow-y-auto max-h-[50vh]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : filteredLikes.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-neutral-400">
                  No reactions yet
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {filteredLikes.map((like) => {
                    const reactionConfig = getReactionConfig(like.reactionType);
                    const Icon = reactionConfig.icon;
                    
                    return (
                      <Link
                        key={like.id}
                        href={`/profile/${like.username}`}
                        onClick={onClose}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        {/* Avatar with Reaction Badge */}
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-700">
                            {like.profileImage ? (
                              <Image
                                src={like.profileImage}
                                alt={like.name}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-gray-600 dark:text-neutral-300">
                                {like.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          {/* Reaction Badge */}
                          <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${reactionConfig.bgColor} border-2 border-white dark:border-neutral-900`}>
                            <Icon className={`w-3 h-3 ${reactionConfig.color}`} />
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {like.name}
                          </p>
                          {like.headline && (
                            <p className="text-sm text-gray-500 dark:text-neutral-400 truncate">
                              {like.headline}
                            </p>
                          )}
                        </div>

                        {/* Connect Button (optional, can be added later) */}
                        {/* <button className="px-4 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          Connect
                        </button> */}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

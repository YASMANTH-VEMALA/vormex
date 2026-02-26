'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  Loader2,
  BookmarkX,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PostCard } from '@/components/feed/PostCard';
import { getSavedPosts, type SavedPostsResponse } from '@/lib/api/saved';
import type { Post, PollOption, ReactionType, ReactionSummary } from '@/types/post';

export default function SavedPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSavedPosts = useCallback(async (cursor?: string | null, append = false) => {
    try {
      if (!cursor) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response: SavedPostsResponse = await getSavedPosts(cursor, 20);
      
      if (append) {
        setPosts(prev => [...prev, ...response.posts]);
      } else {
        setPosts(response.posts);
      }
      
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setTotalCount(prev => append ? prev + response.posts.length : response.posts.length);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedPosts(null);
  }, [fetchSavedPosts]);

  const loadMore = () => {
    if (!loadingMore && hasMore && nextCursor) {
      fetchSavedPosts(nextCursor, true);
    }
  };

  const handleLikeUpdate = (
    postId: string,
    liked: boolean,
    count: number,
    reactionType?: ReactionType | null,
    reactionSummary?: ReactionSummary[]
  ) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: liked,
              likesCount: count,
              userReactionType: reactionType || null,
              reactionSummary: reactionSummary || post.reactionSummary,
            }
          : post
      )
    );
  };

  const handlePollUpdate = (postId: string, options: PollOption[]) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId ? { ...post, pollOptions: options } : post
      )
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
    setTotalCount(prev => prev - 1);
  };

  const handlePostEdit = (postId: string, updatedPost: Post) => {
    setPosts(prev =>
      prev.map(post => (post.id === postId ? updatedPost : post))
    );
  };

  // Handle unsave - remove from list when unsaved
  const handleUnsave = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
    setTotalCount(prev => Math.max(0, prev - 1));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-500" />
                Saved Posts
              </h1>
              {posts.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-neutral-500">
                  {posts.length} saved post{posts.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                <BookmarkX className="w-10 h-10 text-gray-400 dark:text-neutral-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No saved posts yet
              </h2>
              <p className="text-gray-500 dark:text-neutral-400 max-w-sm mx-auto">
                When you save posts, they'll appear here so you can easily find them later.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    layout
                  >
                    <PostCard
                      post={post}
                      onLikeUpdate={handleLikeUpdate}
                      onPollUpdate={handlePollUpdate}
                      onDelete={handlePostDelete}
                      onEdit={handlePostEdit}
                      onUnsave={handleUnsave}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Load More */}
              {hasMore && nextCursor && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

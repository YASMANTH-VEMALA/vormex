'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import {
  FileText,
  Newspaper,
  Video,
  MessageSquare,
  Heart,
  Eye,
  Clock,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { getUserFeed } from '@/lib/api/profile';
import { getPost, deletePost } from '@/lib/api/posts';
import { reelsApi } from '@/lib/api/reels';
import type { FeedItem, RecentActivity } from '@/types/profile';
import type { Post } from '@/types/post'; // Added Post type
import { useAuth } from '@/lib/auth/useAuth';
import { EditPostModal } from '@/components/feed/EditPostModal';

interface ProfileFeedProps {
  userId: string;
  initialFeed?: RecentActivity;
}

type FilterType = 'all' | 'posts' | 'articles' | 'forum' | 'videos';

const TABS: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <FileText className="w-4 h-4" /> },
  { value: 'posts', label: 'Posts', icon: <MessageSquare className="w-4 h-4" /> },
  { value: 'articles', label: 'Articles', icon: <Newspaper className="w-4 h-4" /> },
  { value: 'videos', label: 'Reels', icon: <Video className="w-4 h-4" /> },
];

export function ProfileFeed({ userId, initialFeed }: ProfileFeedProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterType>('all');
  const [items, setItems] = useState<FeedItem[]>(initialFeed?.items || []);
  const [hasMore, setHasMore] = useState(initialFeed?.hasMore || false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Edit/Delete State
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Check ownership
  const isOwner = user?.id === userId;

  // Fetch feed when tab changes
  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const response = await getUserFeed(userId, 1, 20, activeTab);
        setItems(response.items);
        setHasMore(response.hasMore);
        setPage(1);
      } catch (error) {
        console.error('Failed to fetch feed:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we don't have initial data or tab changed
    if (!initialFeed || activeTab !== 'all') {
      fetchFeed();
    }
  }, [userId, activeTab, initialFeed]);

  // Load more
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await getUserFeed(userId, nextPage, 20, activeTab);
      setItems((prev) => [...prev, ...response.items]);
      setHasMore(response.hasMore);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, page, activeTab, hasMore, loadingMore]);

  const handleDelete = async (itemId: string, contentType: string) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;

    setIsDeleting(itemId);
    try {
      if (contentType === 'short_video') {
        await reelsApi.deleteReel(itemId);
      } else {
        await deletePost(itemId);
      }
      setItems(items.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete');
    } finally {
      setIsDeleting(null);
      setMenuOpenId(null);
    }
  };

  const handleEditClick = async (itemId: string, contentType: string) => {
    setMenuOpenId(null);
    if (contentType === 'short_video') {
      window.location.href = `/reels/${itemId}/edit`;
      return;
    }
    try {
      const post = await getPost(itemId);
      setPostToEdit(post);
      setEditModalOpen(true);
    } catch (err) {
      console.error('Failed to load post for editing:', err);
      alert('Failed to load post for editing');
    }
  };

  const handlePostUpdated = (updatedPost: Post) => {
    // Update the item in the list
    // Note: FeedItem is a subset/different shape, so we assume updatedPost content reflects there
    setItems(items.map(item => {
      if (item.id === updatedPost.id) {
        return {
          ...item,
          content: updatedPost.content || '',
          // Update other fields if available in FeedItem
        };
      }
      return item;
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      post: 'Post',
      article: 'Article',
      short_video: 'Reel',
      forum_question: 'Question',
      forum_answer: 'Answer',
    };
    return labels[type] || type;
  };

  // Simplified Brutalist Color Scheme (Black/White primarily)
  // But keeping type badges distinct but cleaner
  const getContentTypeStyle = (type: string) => {
    switch (type) {
      case 'article': return 'bg-emerald-500 text-white border-emerald-500';
      case 'short_video': return 'bg-purple-500 text-white border-purple-500';
      case 'forum_question': return 'bg-amber-500 text-black border-amber-500';
      case 'forum_answer': return 'bg-rose-500 text-white border-rose-500';
      default: return 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden">
        <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as FilterType)}>
          {/* Tabs */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <Tabs.List className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className={`flex items-center gap-2 px-4 py-2 border text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.value
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                      : 'bg-white dark:bg-black text-neutral-500 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>

          {/* Content */}
          <Tabs.Content value={activeTab}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 border-neutral-100 dark:border-neutral-900">
                <div className="w-12 h-12 mx-auto mb-4 border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide">No content found</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-6 bg-white dark:bg-black group hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors relative ${item.contentType === 'short_video' ? 'cursor-pointer' : ''}`}
                    {...(item.contentType === 'short_video' ? { onClick: () => window.location.href = `/reels/${item.id}` } : {})}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getContentTypeStyle(
                            item.contentType
                          )}`}
                        >
                          {getContentTypeLabel(item.contentType)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>

                      {/* Menu for Owner */}
                      {isOwner && (
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === item.id ? null : item.id);
                            }}
                            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {menuOpenId === item.id && (
                            <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-xl z-10 flex flex-col py-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditClick(item.id, item.contentType); }}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase hover:bg-neutral-50 dark:hover:bg-neutral-900 text-left w-full text-neutral-900 dark:text-white"
                              >
                                <Pencil className="w-3 h-3" /> {item.contentType === 'short_video' ? 'Edit Reel' : 'Edit'}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.contentType); }}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase hover:bg-red-50 dark:hover:bg-red-900/20 text-left w-full text-red-600"
                                disabled={isDeleting === item.id}
                              >
                                <Trash2 className="w-3 h-3" /> {isDeleting === item.id ? '...' : 'Delete'}
                              </button>
                            </div>
                          )}

                          {/* Click outside closer helper (transparent overlay) */}
                          {menuOpenId === item.id && (
                            <div className="fixed inset-0 z-0" onClick={() => setMenuOpenId(null)} />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Title (for articles/questions) */}
                    {item.title && (
                      <h4 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-tight mb-2">{item.title}</h4>
                    )}

                    {/* Content */}
                    <div className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4 whitespace-pre-wrap font-medium">
                      {item.content.length > 300 ? `${item.content.substring(0, 300)}...` : item.content}
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider hover:text-black dark:hover:text-white cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Images */}
                    {item.images && item.images.length > 0 && (
                      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {item.images.slice(0, 3).map((img, i) => (
                          <div key={i} className="flex-shrink-0 w-32 h-32 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-1">
                            <img
                              src={img}
                              alt=""
                              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                            />
                          </div>
                        ))}
                        {item.images.length > 3 && (
                          <div className="flex-shrink-0 w-32 h-32 border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                            <span className="text-sm font-bold text-neutral-500">+{item.images.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Question reference for answers */}
                    {item.questionTitle && (
                      <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-900 border-l-2 border-neutral-300 dark:border-neutral-700">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Answered:</p>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white uppercase">{item.questionTitle}</p>
                      </div>
                    )}

                    {/* Engagement Stats - Interactive Look */}
                    <div className="flex items-center gap-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                      {/* Like - Even if disabled, style it */}
                      <div className="flex items-center gap-2 group/stat cursor-default">
                        <Heart className={`w-4 h-4 ${Number(item.likesCount) > 0 ? 'fill-neutral-900 dark:fill-white text-neutral-900 dark:text-white' : 'text-neutral-400'}`} />
                        <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">{item.likesCount || 0}</span>
                      </div>

                      <div className="flex items-center gap-2 group/stat cursor-default">
                        <MessageSquare className={`w-4 h-4 ${Number(item.commentsCount) > 0 ? 'fill-neutral-900 dark:fill-white text-neutral-900 dark:text-white' : 'text-neutral-400'}`} />
                        <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">{item.commentsCount || 0}</span>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <Eye className="w-4 h-4 text-neutral-400" />
                        <span className="text-xs font-bold text-neutral-400">{item.viewsCount || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center p-6 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Activity'
                  )}
                </button>
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </Card>

      {/* Edit Post Modal */}
      {postToEdit && (
        <EditPostModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setPostToEdit(null);
          }}
          post={postToEdit}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
}

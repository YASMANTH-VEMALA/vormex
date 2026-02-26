'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/useAuth';
import { getStoriesFeed, type StoryGroup, type Story } from '@/lib/api/stories';
import { getSocket } from '@/lib/socket';

interface StoryCarouselProps {
  onOpenStory: (group: StoryGroup, startIndex?: number) => void;
  onCreateStory: () => void;
}

export function StoryCarousel({ onOpenStory, onCreateStory }: StoryCarouselProps) {
  const { user, loading: authLoading } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Fetch stories on mount (only after auth is ready)
  const fetchStories = useCallback(async () => {
    if (authLoading) return; // Wait for auth to complete
    
    try {
      const response = await getStoriesFeed();
      console.log('📖 Stories feed response:', response);
      setStoryGroups(response?.storyGroups || []);
    } catch (error: any) {
      console.error('Error fetching stories:', error);
      // Don't clear stories on 401 - user might just need to re-auth
      if (error?.response?.status !== 401) {
        setStoryGroups([]);
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchStories();
    }
  }, [authLoading, fetchStories]);

  // Listen for real-time story updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Handle new story created
    const handleStoryCreated = (data: { story: Story; author: any; timestamp: Date }) => {
      console.log('📖 Real-time: New story received', data);
      
      setStoryGroups(prev => {
        // Check if author already has stories
        const existingGroupIndex = prev.findIndex(g => g.user.id === data.author.id);
        
        if (existingGroupIndex >= 0) {
          // Add story to existing group
          const updated = [...prev];
          updated[existingGroupIndex] = {
            ...updated[existingGroupIndex],
            stories: [data.story, ...updated[existingGroupIndex].stories],
            hasUnviewed: true,
            lastStoryAt: data.story.createdAt,
          };
          return updated;
        } else {
          // Create new group for this author
          const newGroup: StoryGroup = {
            user: data.author,
            stories: [data.story],
            hasUnviewed: true,
            lastStoryAt: data.story.createdAt,
            isOwnStory: data.author.id === user?.id,
          };
          
          // Add at beginning (after own stories if exists)
          const ownGroupIndex = prev.findIndex(g => g.isOwnStory);
          if (newGroup.isOwnStory) {
            return [newGroup, ...prev.filter(g => !g.isOwnStory)];
          } else if (ownGroupIndex >= 0) {
            return [prev[ownGroupIndex], newGroup, ...prev.filter((g, i) => !g.isOwnStory && i !== ownGroupIndex)];
          }
          return [newGroup, ...prev];
        }
      });
    };

    // Handle story deleted
    const handleStoryDeleted = (data: { storyId: string; authorId: string; timestamp: Date }) => {
      console.log('🗑️ Real-time: Story deleted', data);
      
      setStoryGroups(prev => {
        return prev.map(group => {
          if (group.user.id === data.authorId) {
            const filteredStories = group.stories.filter(s => s.id !== data.storyId);
            if (filteredStories.length === 0) {
              return null; // Remove group entirely
            }
            return {
              ...group,
              stories: filteredStories,
            };
          }
          return group;
        }).filter(Boolean) as StoryGroup[];
      });
    };

    socket.on('story:created', handleStoryCreated);
    socket.on('story:deleted', handleStoryDeleted);

    return () => {
      socket.off('story:created', handleStoryCreated);
      socket.off('story:deleted', handleStoryDeleted);
    };
  }, [user?.id]);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    checkScroll();
    scrollRef.current?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      scrollRef.current?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [storyGroups]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const ownStoryGroup = storyGroups.find(g => g.isOwnStory);
  const otherStoryGroups = storyGroups.filter(g => !g.isOwnStory);

  // Show loading skeleton while auth is loading or stories are loading
  if (authLoading || loading) {
    return (
      <div className="w-full py-4 px-4">
        <div className="flex gap-3 overflow-hidden">
          {/* Skeleton for create story */}
          <div className="flex-shrink-0 w-28 h-40 bg-gray-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          {/* Skeletons for stories */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-28 h-40 bg-gray-200 dark:bg-neutral-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full py-4 group">
      {/* Left Scroll Button */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white dark:bg-neutral-800 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Right Scroll Button */}
      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white dark:bg-neutral-800 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Story Cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Create Story Card */}
        <motion.button
          onClick={onCreateStory}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-shrink-0 relative w-28 h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg"
        >
          {/* User Avatar Background */}
          {user?.profileImage ? (
            <div className="absolute inset-0">
              <Image
                src={user.profileImage}
                alt="Your story"
                fill
                sizes="112px"
                loading="eager"
                className="object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
          )}

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center shadow-lg mb-2">
              <Plus className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-white text-xs font-semibold text-center px-2">
              {ownStoryGroup ? 'Add to Story' : 'Create Story'}
            </span>
          </div>

          {/* Glassmorphic overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/10 backdrop-blur-sm" />
        </motion.button>

        {/* Own Story (if exists) */}
        {ownStoryGroup && (
          <StoryCard
            group={ownStoryGroup}
            onClick={() => onOpenStory(ownStoryGroup)}
            isOwn
          />
        )}

        {/* Other Stories */}
        {otherStoryGroups.map((group) => (
          <StoryCard
            key={group.user.id}
            group={group}
            onClick={() => onOpenStory(group)}
          />
        ))}
      </div>
    </div>
  );
}

interface StoryCardProps {
  group: StoryGroup;
  onClick: () => void;
  isOwn?: boolean;
}

function StoryCard({ group, onClick, isOwn }: StoryCardProps) {
  const { user, stories, hasUnviewed } = group;
  const latestStory = stories[0];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="flex-shrink-0 relative w-28 h-40 rounded-2xl overflow-hidden shadow-lg group/card"
    >
      {/* Background Image - use img for CDN URLs to avoid Next.js Image restrictions */}
      <div className="absolute inset-0">
        {(latestStory.thumbnailUrl || latestStory.mediaUrl) ? (
          <img
            src={latestStory.thumbnailUrl || latestStory.mediaUrl}
            alt={`${user.name}'s story`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{ backgroundColor: latestStory.backgroundColor || '#3B82F6' }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
      </div>

      {/* Ring Border - Gradient for unviewed, gray for viewed */}
      <div 
        className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
          hasUnviewed
            ? 'ring-[3px] ring-offset-2 ring-offset-white dark:ring-offset-neutral-950'
            : 'ring-2 ring-gray-300 dark:ring-neutral-700'
        }`}
        style={hasUnviewed ? {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '3px',
        } : undefined}
      />

      {/* Avatar */}
      <div className="absolute top-2 left-2 z-10">
        <div className={`w-9 h-9 rounded-full overflow-hidden ring-2 ${
          hasUnviewed 
            ? 'ring-purple-500 ring-offset-1 ring-offset-black/50' 
            : 'ring-white/50'
        }`}>
          {user.profileImage ? (
            <Image
              src={user.profileImage}
              alt={user.name}
              width={36}
              height={36}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Story Count Badge */}
      {stories.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
          <span className="text-white text-[10px] font-medium">{stories.length}</span>
        </div>
      )}

      {/* Text Content Preview */}
      {latestStory.textContent && (
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 text-center">
          <p className="text-white text-xs font-medium line-clamp-3 drop-shadow-lg">
            {latestStory.textContent}
          </p>
        </div>
      )}

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white text-xs font-semibold truncate">
          {isOwn ? 'Your Story' : user.name.split(' ')[0]}
        </p>
        {/* Time ago */}
        <p className="text-white/70 text-[10px]">
          {formatTimeAgo(new Date(latestStory.createdAt))}
        </p>
      </div>

      {/* Category Badge */}
      {latestStory.category && latestStory.category !== 'GENERAL' && (
        <div className="absolute bottom-10 left-2 right-2">
          <span className="text-[9px] text-white/80 bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
            {formatCategory(latestStory.category)}
          </span>
        </div>
      )}
    </motion.button>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return '1d';
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    DAY_AT_WORK: '💼 Work',
    LEARNING: '📚 Learning',
    ACHIEVEMENT: '🏆 Achievement',
    PROJECT: '🚀 Project',
    EVENT: '🎉 Event',
    BEHIND_SCENES: '🎬 BTS',
    TIPS: '💡 Tips',
    QNA: '❓ Q&A',
  };
  return map[category] || category;
}

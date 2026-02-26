'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Plus,
  Eye,
  Heart,
  MessageCircle,
  Sparkles,
  Clock,
  Loader2,
  Camera,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StoryCarousel, StoryViewer, StoryCreator, StoryHighlights } from '@/components/stories';
import { useAuth } from '@/lib/auth/useAuth';
import {
  getStoriesFeed,
  getMyStories,
  getUserHighlights,
  type StoryGroup,
  type Story,
  type StoryHighlight,
} from '@/lib/api/stories';

function StoriesPage() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'my-stories'>('feed');
  
  // Modal states
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState<StoryGroup | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [feedRes, myStoriesRes, highlightsRes] = await Promise.all([
        getStoriesFeed(),
        getMyStories(),
        getUserHighlights(user.id),
      ]);
      
      setStoryGroups(feedRes?.storyGroups || []);
      setMyStories(myStoriesRes?.stories || []);
      setHighlights(highlightsRes?.highlights || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenStory = (group: StoryGroup, startIndex = 0) => {
    setSelectedStoryGroup(group);
    setSelectedStoryIndex(startIndex);
    setShowStoryViewer(true);
  };

  const handleStoryCreated = () => {
    setShowStoryCreator(false);
    fetchData();
  };

  const ownStoryGroup = storyGroups.find(g => g.isOwnStory);
  const totalViews = myStories.reduce((sum, s) => sum + s.viewsCount, 0);
  const totalReactions = myStories.reduce((sum, s) => sum + s.reactionsCount, 0);

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours <= 0) return 'Expiring soon';
    if (hours < 1) return 'Less than 1h';
    return `${hours}h left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Stories</h1>
                <p className="text-xs text-gray-500">Share moments that disappear in 24h</p>
              </div>
            </div>
            <button
              onClick={() => setShowStoryCreator(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-4 gap-2 pb-3">
            {[
              { id: 'feed', label: 'Stories', icon: <Sparkles className="w-4 h-4" /> },
              { id: 'my-stories', label: 'My Stories', icon: <Camera className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {activeTab === 'feed' && (
          <>
            {/* Story Carousel */}
            <StoryCarousel
              onOpenStory={handleOpenStory}
              onCreateStory={() => setShowStoryCreator(true)}
            />

            {/* Highlights Section */}
            {highlights.length > 0 && (
              <div className="px-4 py-4">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Your Highlights</h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {highlights.map((highlight) => (
                    <div
                      key={highlight.id}
                      className="flex flex-col items-center gap-2 shrink-0"
                    >
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 border-2 border-gray-300 dark:border-neutral-600 flex items-center justify-center overflow-hidden">
                        {highlight.coverImage ? (
                          <Image
                            src={highlight.coverImage}
                            alt={highlight.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">{highlight.emoji || '📌'}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 text-center max-w-[64px] truncate">
                        {highlight.title}
                      </span>
                    </div>
                  ))}
                  {/* Add Highlight Button */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <button className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-neutral-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">New</span>
                  </div>
                </div>
              </div>
            )}

            {/* Story Grid - All Stories */}
            <div className="px-4 py-4">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">All Stories</h2>
              {storyGroups.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No stories yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Be the first to share a story!</p>
                  <button
                    onClick={() => setShowStoryCreator(true)}
                    className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    Create Story
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {storyGroups.map((group) => (
                    <motion.button
                      key={group.user.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => handleOpenStory(group)}
                      className="relative aspect-[3/4] rounded-xl overflow-hidden group"
                    >
                      {/* Background */}
                      {group.stories[0].thumbnailUrl || group.stories[0].mediaUrl ? (
                        <Image
                          src={group.stories[0].thumbnailUrl || group.stories[0].mediaUrl}
                          alt={`${group.user.name}'s story`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div 
                          className="w-full h-full"
                          style={{ backgroundColor: group.stories[0].backgroundColor || '#3B82F6' }}
                        />
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
                      
                      {/* Unviewed Ring */}
                      {group.hasUnviewed && (
                        <div className="absolute inset-0 ring-2 ring-inset ring-purple-500 rounded-xl" />
                      )}
                      
                      {/* User Info */}
                      <div className="absolute top-2 left-2 z-10">
                        <div className={`w-8 h-8 rounded-full overflow-hidden ring-2 ${
                          group.hasUnviewed ? 'ring-purple-500' : 'ring-white/50'
                        }`}>
                          {group.user.profileImage ? (
                            <Image
                              src={group.user.profileImage}
                              alt={group.user.name}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {group.user.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Story Count */}
                      {group.stories.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/50 px-1.5 py-0.5 rounded-full">
                          <span className="text-white text-[10px] font-medium">{group.stories.length}</span>
                        </div>
                      )}
                      
                      {/* Bottom Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-xs font-medium truncate">
                          {group.isOwnStory ? 'Your Story' : group.user.name.split(' ')[0]}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'my-stories' && (
          <div className="px-4 py-4">
            {/* Stats */}
            {myStories.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
                    <Camera className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{myStories.length}</p>
                  <p className="text-xs text-gray-500">Active Stories</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
                    <Eye className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalViews}</p>
                  <p className="text-xs text-gray-500">Total Views</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
                    <Heart className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalReactions}</p>
                  <p className="text-xs text-gray-500">Reactions</p>
                </div>
              </div>
            )}

            {/* My Stories List */}
            {myStories.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No active stories</h3>
                <p className="text-sm text-gray-500 mb-4">Your stories appear here for 24 hours</p>
                <button
                  onClick={() => setShowStoryCreator(true)}
                  className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Create Story
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myStories.map((story, index) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden"
                  >
                    <div className="flex">
                      {/* Thumbnail */}
                      <div className="w-24 h-32 relative shrink-0">
                        {story.thumbnailUrl || story.mediaUrl ? (
                          <Image
                            src={story.thumbnailUrl || story.mediaUrl}
                            alt="Story"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div 
                            className="w-full h-full"
                            style={{ backgroundColor: story.backgroundColor || '#3B82F6' }}
                          />
                        )}
                        {story.textContent && (
                          <div className="absolute inset-0 flex items-center justify-center p-2">
                            <p className="text-white text-xs font-medium text-center line-clamp-3 drop-shadow">
                              {story.textContent}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-xs">
                              {story.category}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                              <Clock className="w-3 h-3" />
                              {formatTimeRemaining(story.expiresAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Posted {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">{story.viewsCount}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm">{story.reactionsCount}</span>
                          </div>
                          {story.repliesCount !== undefined && story.repliesCount > 0 && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-sm">{story.repliesCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Highlights Section */}
            {highlights.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Your Highlights</h2>
                <StoryHighlights userId={user?.id || ''} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Story Creator Modal */}
      <StoryCreator
        isOpen={showStoryCreator}
        onClose={() => setShowStoryCreator(false)}
        onStoryCreated={handleStoryCreated}
      />

      {/* Story Viewer */}
      {showStoryViewer && selectedStoryGroup && (
        <StoryViewer
          storyGroups={[selectedStoryGroup]}
          initialGroupIndex={0}
          initialStoryIndex={selectedStoryIndex}
          onClose={() => {
            setShowStoryViewer(false);
            setSelectedStoryGroup(null);
          }}
          onStoryEnd={() => {
            setShowStoryViewer(false);
            setSelectedStoryGroup(null);
          }}
        />
      )}
    </div>
  );
}

export default function StoriesPageWrapper() {
  return (
    <ProtectedRoute>
      <StoriesPage />
    </ProtectedRoute>
  );
}

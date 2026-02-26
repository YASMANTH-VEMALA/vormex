'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  Heart,
  Send,
  MoreHorizontal,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Link2,
  Trash2,
  Archive,
  Share2,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/useAuth';
import { getSocket } from '@/lib/socket';
import {
  viewStory,
  reactToStory,
  removeReaction,
  replyToStory,
  deleteStory,
  archiveStory,
  type StoryGroup,
  type Story,
} from '@/lib/api/stories';

interface StoryViewerProps {
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  initialStoryIndex?: number;
  onClose: () => void;
  onStoryEnd?: () => void;
}

const REACTIONS = ['🔥', '❤️', '👏', '😮', '😂', '💡'];

export function StoryViewer({
  storyGroups,
  initialGroupIndex,
  initialStoryIndex = 0,
  onClose,
  onStoryEnd,
}: StoryViewerProps) {
  const { user } = useAuth();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [viewStartTime, setViewStartTime] = useState<number>(Date.now());
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentGroup = storyGroups[currentGroupIndex];
  const [storiesWithViews, setStoriesWithViews] = useState<Record<string, number>>({});
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const currentViewsCount = storiesWithViews[currentStory?.id ?? ''] ?? currentStory?.viewsCount ?? 0;
  const isOwnStory = currentGroup?.isOwnStory;

  // Live view count updates for own stories
  useEffect(() => {
    if (!isOwnStory || !currentStory) return;
    const socket = getSocket();
    if (!socket) return;

    const handleStoryViewed = ({ storyId, viewsCount }: { storyId: string; viewsCount: number }) => {
      if (storyId === currentStory.id) {
        setStoriesWithViews((prev) => ({ ...prev, [storyId]: viewsCount }));
      }
    };

    socket.on('story:viewed', handleStoryViewed);
    return () => {
      socket.off('story:viewed', handleStoryViewed);
    };
  }, [isOwnStory, currentStory?.id]);

  // Mark story as viewed on mount and story change
  useEffect(() => {
    if (currentStory && !isOwnStory) {
      setViewStartTime(Date.now());
      
      // Record view via socket for real-time updates
      const socket = getSocket();
      if (socket) {
        socket.emit('story:view', { storyId: currentStory.id });
      }
    }
  }, [currentStory?.id, isOwnStory]);

  // Record view duration when leaving story
  const recordView = useCallback(async () => {
    if (currentStory && !isOwnStory) {
      const duration = Date.now() - viewStartTime;
      
      // Use socket for real-time view tracking
      const socket = getSocket();
      if (socket) {
        socket.emit('story:view', { storyId: currentStory.id, duration });
      } else {
        // Fallback to HTTP
        try {
          await viewStory(currentStory.id, duration);
        } catch (error) {
          console.error('Error recording view:', error);
        }
      }
    }
  }, [currentStory, isOwnStory, viewStartTime]);

  // Progress timer
  useEffect(() => {
    if (!currentStory || isPaused) return;

    const duration = currentStory.mediaType === 'VIDEO' 
      ? (currentStory.duration || 15000) 
      : (currentStory.duration || 5000);

    const interval = 50; // Update every 50ms for smooth progress
    const increment = (100 / duration) * interval;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStory?.id, isPaused]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    setSelectedReaction(currentStory?.userReaction || null);
  }, [currentStory?.id]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          goToPreviousStory();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          goToNextStory();
          break;
        case ' ':
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
        case 'Escape':
          handleClose();
          break;
        case 'm':
          setIsMuted((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const goToNextStory = useCallback(async () => {
    await recordView();

    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      handleClose();
      onStoryEnd?.();
    }
  }, [currentStoryIndex, currentGroupIndex, currentGroup, storyGroups.length, recordView, onStoryEnd]);

  const goToPreviousStory = useCallback(async () => {
    await recordView();

    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex((prev) => prev - 1);
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    }
  }, [currentStoryIndex, currentGroupIndex, storyGroups, recordView]);

  const handleClose = async () => {
    await recordView();
    onClose();
  };

  // Swipe handling for vertical navigation
  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    const velocity = 500;

    if (info.offset.y < -threshold || info.velocity.y < -velocity) {
      goToNextStory();
    } else if (info.offset.y > threshold || info.velocity.y > velocity) {
      goToPreviousStory();
    }
  };

  const handleReaction = async (reaction: string) => {
    if (!currentStory) return;

    try {
      if (selectedReaction === reaction) {
        await removeReaction(currentStory.id);
        setSelectedReaction(null);
      } else {
        await reactToStory(currentStory.id, reaction);
        setSelectedReaction(reaction);
      }
      
      // Also emit via socket for real-time updates
      const socket = getSocket();
      if (socket) {
        socket.emit('story:react', { storyId: currentStory.id, reaction });
      }
    } catch (error) {
      console.error('Error reacting to story:', error);
    }
    setShowReactions(false);
  };

  const handleSendReply = async () => {
    if (!currentStory || !replyText.trim()) return;

    try {
      // Emit via socket for real-time delivery
      const socket = getSocket();
      if (socket) {
        socket.emit('story:reply', { 
          storyId: currentStory.id, 
          content: replyText.trim() 
        });
      } else {
        // Fallback to HTTP
        await replyToStory(currentStory.id, replyText.trim());
      }
      
      setReplyText('');
      setShowReplyInput(false);
      // Show success toast or animation
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory) return;

    try {
      await deleteStory(currentStory.id);
      goToNextStory();
    } catch (error) {
      console.error('Error deleting story:', error);
    }
    setShowMenu(false);
  };

  const handleArchiveStory = async () => {
    if (!currentStory) return;

    try {
      await archiveStory(currentStory.id);
      // Show success message
    } catch (error) {
      console.error('Error archiving story:', error);
    }
    setShowMenu(false);
  };

  if (!currentGroup || !currentStory) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black"
      >
        {/* Main Content Container */}
        <motion.div
          ref={containerRef}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="relative w-full h-full flex items-center justify-center"
          onClick={(e) => {
            // Tap left/right to navigate
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              const clickX = e.clientX - rect.left;
              if (clickX < rect.width / 3) {
                goToPreviousStory();
              } else if (clickX > (rect.width * 2) / 3) {
                goToNextStory();
              } else {
                setIsPaused((prev) => !prev);
              }
            }
          }}
        >
          {/* Story Content */}
          <div className="relative w-full h-full max-w-lg mx-auto">
            {/* Background */}
            <div className="absolute inset-0">
              {currentStory.mediaType === 'VIDEO' ? (
                <video
                  ref={videoRef}
                  src={currentStory.mediaUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                />
              ) : currentStory.mediaType === 'TEXT' ? (
                <div
                  className="w-full h-full flex items-center justify-center p-8"
                  style={{ backgroundColor: currentStory.backgroundColor || '#3B82F6' }}
                >
                  <p
                    className="text-white text-2xl font-bold text-center leading-relaxed"
                    style={{
                      fontSize: currentStory.textStyle?.fontSize || 24,
                      fontWeight: currentStory.textStyle?.fontWeight || 'bold',
                      color: currentStory.textStyle?.color || 'white',
                    }}
                  >
                    {currentStory.textContent}
                  </p>
                </div>
              ) : (
                <img
                  src={currentStory.mediaUrl}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Text Overlay */}
              {currentStory.mediaType !== 'TEXT' && currentStory.textContent && (
                <div
                  className="absolute p-4"
                  style={{
                    left: currentStory.textPosition?.x || '50%',
                    top: currentStory.textPosition?.y || '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <p
                    className="text-white text-lg font-semibold drop-shadow-lg"
                    style={currentStory.textStyle || {}}
                  >
                    {currentStory.textContent}
                  </p>
                </div>
              )}

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
            </div>

            {/* Top Section - Progress & Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10">
              {/* Progress Bars */}
              <div className="flex gap-1 mb-4">
                {currentGroup.stories.map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden"
                  >
                    <motion.div
                      className="h-full bg-white rounded-full"
                      style={{
                        width:
                          idx < currentStoryIndex
                            ? '100%'
                            : idx === currentStoryIndex
                            ? `${progress}%`
                            : '0%',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* User Avatar with gradient ring */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
                      {currentGroup.user.profileImage ? (
                        <Image
                          src={currentGroup.user.profileImage}
                          alt={currentGroup.user.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white font-bold">
                            {currentGroup.user.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-white font-semibold text-sm">
                      {currentGroup.user.name}
                    </p>
                    <p className="text-white/60 text-xs">
                      {formatTimeAgo(new Date(currentStory.createdAt))}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Pause/Play */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPaused((prev) => !prev);
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
                  >
                    {isPaused ? (
                      <Play className="w-4 h-4 text-white" fill="white" />
                    ) : (
                      <Pause className="w-4 h-4 text-white" fill="white" />
                    )}
                  </button>

                  {/* Mute (for video) */}
                  {currentStory.mediaType === 'VIDEO' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted((prev) => !prev);
                      }}
                      className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  )}

                  {/* More Options */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(true);
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
                  >
                    <MoreHorizontal className="w-4 h-4 text-white" />
                  </button>

                  {/* Close */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose();
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Indicators */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <ChevronUp className="w-6 h-6 text-white/40 animate-pulse" />
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <ChevronDown className="w-6 h-6 text-white/40 animate-pulse" />
            </div>

            {/* Link Preview */}
            {currentStory.linkUrl && (
              <div className="absolute bottom-32 left-4 right-4 z-10">
                <a
                  href={currentStory.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2"
                >
                  <Link2 className="w-4 h-4 text-white" />
                  <span className="text-white text-sm truncate">
                    {currentStory.linkTitle || currentStory.linkUrl}
                  </span>
                </a>
              </div>
            )}

            {/* Bottom Section - Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              {/* View Count (for own stories) - updates live when others view */}
              {isOwnStory && (
                <div className="flex items-center gap-4 mb-4 text-white/80">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{currentViewsCount} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{currentStory.reactionsCount} reactions</span>
                  </div>
                </div>
              )}

              {/* Reply Input or Actions */}
              {!isOwnStory && (
                <div className="flex items-center gap-2">
                  {showReplyInput ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Send a message..."
                        className="flex-1 bg-white/10 backdrop-blur-md text-white placeholder-white/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') handleSendReply();
                          if (e.key === 'Escape') setShowReplyInput(false);
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendReply();
                        }}
                        className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center"
                      >
                        <Send className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReplyInput(true);
                          setIsPaused(true);
                        }}
                        className="flex-1 bg-white/10 backdrop-blur-md text-white/70 rounded-full px-4 py-2 text-sm text-left"
                      >
                        Reply to {currentGroup.user.name.split(' ')[0]}...
                      </button>

                      {/* Reaction Button */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReactions(!showReactions);
                            setIsPaused(true);
                          }}
                          className={`w-10 h-10 rounded-full ${
                            selectedReaction
                              ? 'bg-pink-500/30'
                              : 'bg-white/10'
                          } backdrop-blur-md flex items-center justify-center`}
                        >
                          {selectedReaction ? (
                            <span className="text-xl">{selectedReaction}</span>
                          ) : (
                            <Heart className="w-5 h-5 text-white" />
                          )}
                        </button>

                        {/* Reaction Picker */}
                        <AnimatePresence>
                          {showReactions && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: 10 }}
                              className="absolute bottom-12 right-0 bg-white/10 backdrop-blur-xl rounded-2xl p-2 flex gap-1"
                            >
                              {REACTIONS.map((reaction) => (
                                <motion.button
                                  key={reaction}
                                  whileHover={{ scale: 1.3 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReaction(reaction);
                                  }}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${
                                    selectedReaction === reaction
                                      ? 'bg-white/20'
                                      : ''
                                  }`}
                                >
                                  {reaction}
                                </motion.button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Share Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle share
                        }}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center"
                      >
                        <Share2 className="w-5 h-5 text-white" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Menu Modal */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/50 flex items-end justify-center"
              onClick={() => setShowMenu(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="w-full max-w-lg bg-neutral-900 rounded-t-3xl p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-1 bg-neutral-700 rounded-full mx-auto mb-4" />

                {isOwnStory && (
                  <>
                    <button
                      onClick={handleDeleteStory}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800 transition-colors text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Delete Story</span>
                    </button>
                    <button
                      onClick={handleArchiveStory}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800 transition-colors text-white"
                    >
                      <Archive className="w-5 h-5" />
                      <span>Save to Archive</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full mt-2 py-3 bg-neutral-800 rounded-xl text-white font-medium"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return '1d ago';
}

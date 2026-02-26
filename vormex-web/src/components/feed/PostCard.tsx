'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ExternalLink,
  FileText,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Flag,
  Copy,
  Pencil,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Post, PollOption } from '@/types/post';
import { toggleLike, votePoll, deletePost } from '@/lib/api/posts';
import { toggleSavePost } from '@/lib/api/saved';
import { 
  likePost as socketLikePost, 
  reactToPost as socketReactToPost,
  votePoll as socketVotePoll,
} from '@/lib/socket';
import { useAuth } from '@/lib/auth/useAuth';
import { 
  ReactionPicker, 
  ReactionSummaryDisplay, 
  getReactionConfig,
} from './ReactionPicker';
import { FormattedContent } from './FormattedContent';
import { EditPostModal } from './EditPostModal';
import { LikeListModal } from './LikeListModal';
import { ShareModal } from './ShareModal';
import ReportModal from '@/components/reports/ReportModal';
import type { ReactionType, ReactionSummary as ReactionSummaryType } from '@/types/post';

interface PostCardProps {
  post: Post;
  onLikeUpdate?: (postId: string, liked: boolean, count: number, reactionType?: ReactionType | null, reactionSummary?: ReactionSummaryType[]) => void;
  onPollUpdate?: (postId: string, options: PollOption[]) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string, updatedPost: Post) => void;
  onUnsave?: (postId: string) => void;
  onCommentClick?: () => void;
  highlightCommentId?: string;
}

export function PostCard({
  post,
  onLikeUpdate,
  onPollUpdate,
  onDelete,
  onEdit,
  onUnsave,
  onCommentClick,
}: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [sharesCount, setSharesCount] = useState(post.sharesCount);
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(post.userReactionType || null);
  const [reactionSummary, setReactionSummary] = useState<ReactionSummaryType[]>(post.reactionSummary || []);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showLikeListModal, setShowLikeListModal] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved ?? false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(post.userVotedOptionId ?? null);
  const [pollOptions, setPollOptions] = useState(post.pollOptions ?? []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMediaLightbox, setShowMediaLightbox] = useState(false);
  const [lightboxMediaType, setLightboxMediaType] = useState<'image' | 'video'>('image');
  
  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoInView, setIsVideoInView] = useState(false);
  
  const isOwnPost = user?.id === post.author.id;
  
  // Sync like state with real-time updates from parent
  useEffect(() => {
    setIsLiked(post.isLiked);
    setLikesCount(post.likesCount);
    setCommentsCount(post.commentsCount);
    setSharesCount(post.sharesCount);
    setCurrentReaction(post.userReactionType || null);
    setReactionSummary(post.reactionSummary || []);
  }, [post.isLiked, post.likesCount, post.commentsCount, post.sharesCount, post.userReactionType, post.reactionSummary]);
  
  // Sync poll options with real-time updates from parent
  useEffect(() => {
    if (post.pollOptions) {
      setPollOptions(post.pollOptions);
    }
  }, [post.pollOptions]);

  // Auto-play video when in view
  useEffect(() => {
    if (post.type !== 'VIDEO' || !videoRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVideoInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
          setIsPlaying(true);
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [post.type]);

  // Handle quick like (default LIKE reaction)
  const handleLike = async () => {
    if (currentReaction === 'LIKE') {
      // Remove reaction
      handleReaction('LIKE');
    } else {
      // Add LIKE reaction
      handleReaction('LIKE');
    }
  };

  // Handle reaction selection
  const handleReaction = async (reactionType: ReactionType) => {
    const wasLiked = isLiked;
    const oldReaction = currentReaction;
    const oldCount = likesCount;
    const oldSummary = reactionSummary;
    
    let newLiked: boolean;
    let newCount: number;
    let newReaction: ReactionType | null;
    
    if (currentReaction === reactionType) {
      // Remove reaction (clicking same reaction again)
      newLiked = false;
      newCount = likesCount - 1;
      newReaction = null;
    } else if (currentReaction) {
      // Change reaction (already reacted, changing type)
      newLiked = true;
      newCount = likesCount; // Count stays same
      newReaction = reactionType;
    } else {
      // Add new reaction
      newLiked = true;
      newCount = likesCount + 1;
      newReaction = reactionType;
    }
    
    // Calculate updated reaction summary
    let newSummary = [...reactionSummary];
    if (oldReaction && oldReaction !== reactionType) {
      // Decrement old reaction count
      newSummary = newSummary.map(s => 
        s.type === oldReaction ? { ...s, count: Math.max(0, s.count - 1) } : s
      ).filter(s => s.count > 0);
    }
    if (newReaction) {
      const existingIdx = newSummary.findIndex(s => s.type === newReaction);
      if (existingIdx >= 0) {
        newSummary[existingIdx] = { ...newSummary[existingIdx], count: newSummary[existingIdx].count + (oldReaction === newReaction ? 0 : 1) };
      } else if (!oldReaction || oldReaction !== reactionType) {
        newSummary.push({ type: newReaction, count: 1 });
      }
    } else if (oldReaction) {
      // Removing reaction entirely
      newSummary = newSummary.map(s => 
        s.type === oldReaction ? { ...s, count: Math.max(0, s.count - 1) } : s
      ).filter(s => s.count > 0);
    }
    
    // Optimistic update
    setIsLiked(newLiked);
    setLikesCount(newCount);
    setCurrentReaction(newReaction);
    setReactionSummary(newSummary);
    onLikeUpdate?.(post.id, newLiked, newCount, newReaction, newSummary);
    
    try {
      // Use WebSocket for real-time
      socketReactToPost(post.id, reactionType);
    } catch (error) {
      // Fallback to HTTP
      try {
        await toggleLike(post.id);
      } catch (err) {
        // Revert on error
        setIsLiked(wasLiked);
        setLikesCount(oldCount);
        setCurrentReaction(oldReaction);
        setReactionSummary(oldSummary);
      }
    }
  };

  // Handle poll vote
  const handlePollVote = async (optionId: string) => {
    if (selectedPollOption && !post.showResultsBeforeVote) return;
    
    setSelectedPollOption(optionId);
    
    // Optimistic update
    const updatedOptions = pollOptions.map(opt => ({
      ...opt,
      votes: opt.id === optionId ? opt.votes + 1 : opt.votes,
    }));
    const totalVotes = updatedOptions.reduce((sum, opt) => sum + opt.votes, 0);
    const optionsWithPercentage = updatedOptions.map(opt => ({
      ...opt,
      percentage: Math.round((opt.votes / totalVotes) * 100),
    }));
    setPollOptions(optionsWithPercentage);
    onPollUpdate?.(post.id, optionsWithPercentage);
    
    try {
      socketVotePoll(post.id, optionId);
    } catch (error) {
      try {
        await votePoll(post.id, optionId);
      } catch (err) {
        console.error('Error voting on poll:', err);
      }
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await deletePost(post.id);
      onDelete?.(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Handle share - open share modal
  const handleShare = () => {
    setShowShareModal(true);
  };

  // Handle save/unsave
  const handleSave = async () => {
    try {
      const response = await toggleSavePost(post.id);
      if (response && typeof response.saved === 'boolean') {
        setIsSaved(response.saved);
        if (!response.saved) onUnsave?.(post.id);
      } else {
        setIsSaved(!isSaved);
        if (isSaved) onUnsave?.(post.id);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      setIsSaved(!isSaved);
    }
  };

  // Render content based on post type
  const renderContent = () => {
    switch (post.type) {
      case 'IMAGE':
        return renderImageContent();
      case 'VIDEO':
        return renderVideoContent();
      case 'LINK':
        return renderLinkContent();
      case 'POLL':
        return renderPollContent();
      case 'ARTICLE':
        return renderArticleContent();
      case 'CELEBRATION':
        return renderCelebrationContent();
      case 'DOCUMENT':
        return renderDocumentContent();
      default:
        return null;
    }
  };

  // Image content with LinkedIn-style layout
  const renderImageContent = () => {
    const images = post.mediaUrls;
    if (!images || images.length === 0) return null;
    
    if (images.length === 1) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800">
          <button
            onClick={() => {
              setLightboxMediaType('image');
              setCurrentImageIndex(0);
              setShowMediaLightbox(true);
            }}
            className="w-full block cursor-zoom-in"
          >
            <img
              src={images[0]}
              alt=""
              className="w-full max-h-[600px] object-contain mx-auto"
              loading="lazy"
              style={{ display: 'block' }}
            />
          </button>
        </div>
      );
    }
    
    // LinkedIn-style grid: 1 big + remaining small
    const mainImage = images[currentImageIndex];
    const thumbnails = images.filter((_, i) => i !== currentImageIndex);
    
    return (
      <div className="mt-3 rounded-lg overflow-hidden">
        {/* Main Image */}
        <div className="relative bg-gray-100 dark:bg-neutral-800">
          <button
            onClick={() => {
              setLightboxMediaType('image');
              setShowMediaLightbox(true);
            }}
            className="w-full block cursor-zoom-in"
          >
            <img
              src={mainImage}
              alt=""
              className="w-full max-h-[500px] object-contain mx-auto"
              loading="lazy"
              style={{ display: 'block' }}
            />
          </button>
          
          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          
          {/* Image counter */}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/50 text-white text-xs">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
        
        {/* Thumbnails */}
        {thumbnails.length > 0 && (
          <div className="flex gap-1 mt-1 overflow-x-auto">
            {thumbnails.map((img, index) => {
              const actualIndex = index >= currentImageIndex ? index + 1 : index;
              return (
                <button
                  key={actualIndex}
                  onClick={() => setCurrentImageIndex(actualIndex)}
                  className="flex-shrink-0 w-16 h-16 rounded overflow-hidden opacity-70 hover:opacity-100 transition-opacity"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Video content with autoplay
  const renderVideoContent = () => {
    if (!post.videoUrl) return null;
    
    return (
      <div className="mt-3 rounded-lg overflow-hidden relative bg-black">
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setLightboxMediaType('video');
            setShowMediaLightbox(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setLightboxMediaType('video');
              setShowMediaLightbox(true);
            }
          }}
          className="w-full block cursor-zoom-in relative"
        >
          <video
            ref={videoRef}
            src={post.videoUrl}
            poster={post.videoThumbnail || undefined}
            className="w-full max-h-[500px] object-contain"
            loop
            muted={isMuted}
            playsInline
          />
        </div>
        
        {/* Video controls overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                if (isPlaying) {
                  videoRef.current.pause();
                } else {
                  videoRef.current.play();
                }
                setIsPlaying(!isPlaying);
              }
            }}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                videoRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Duration badge */}
        {post.videoDuration && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 text-white text-xs">
            {Math.floor(post.videoDuration / 60)}:{String(post.videoDuration % 60).padStart(2, '0')}
          </div>
        )}
      </div>
    );
  };

  // Link preview content
  const renderLinkContent = () => {
    if (!post.linkUrl) return null;
    
    return (
      <a
        href={post.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors"
      >
        {post.linkImage && (
          <img
            src={post.linkImage}
            alt=""
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        )}
        <div className="p-3 bg-gray-50 dark:bg-neutral-800/50">
          <p className="font-semibold text-gray-900 dark:text-white line-clamp-2">
            {post.linkTitle || post.linkUrl}
          </p>
          {post.linkDescription && (
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1 line-clamp-2">
              {post.linkDescription}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <ExternalLink className="w-3 h-3" />
            <span>
              {post.linkDomain || (post.linkUrl ? (() => {
                try {
                  return new URL(post.linkUrl).hostname;
                } catch {
                  return 'Link';
                }
              })() : 'Link')}
            </span>
          </div>
        </div>
      </a>
    );
  };

  // Poll content
  const renderPollContent = () => {
    if (!pollOptions || pollOptions.length === 0) return null;
    
    const totalVotes = pollOptions.reduce((sum, opt) => sum + opt.votes, 0);
    const hasVoted = selectedPollOption !== null || pollOptions.some(opt => opt.hasVoted);
    const showResults = hasVoted || post.showResultsBeforeVote || false;
    const isPollEnded = post.pollEndsAt ? new Date(post.pollEndsAt) < new Date() : false;
    
    return (
      <div className="mt-3 space-y-2">
        {pollOptions.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const isSelected = selectedPollOption === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => !hasVoted && !isPollEnded && handlePollVote(option.id)}
              disabled={hasVoted || isPollEnded}
              className={`w-full p-3 rounded-lg text-left transition-all relative overflow-hidden ${
                hasVoted || isPollEnded
                  ? 'cursor-default'
                  : 'hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer'
              } ${
                isSelected
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                  : 'border border-gray-200 dark:border-neutral-700'
              }`}
            >
              {/* Progress bar */}
              {showResults && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5 }}
                  className={`absolute inset-y-0 left-0 ${
                    isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-neutral-800'
                  }`}
                />
              )}
              
              <div className="relative flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">
                  {option.text}
                </span>
                {showResults && (
                  <span className="text-sm text-gray-500 dark:text-neutral-400">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-neutral-400 pt-2">
          <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          {post.pollEndsAt && (
            <span>
              {isPollEnded
                ? 'Poll ended'
                : `Ends ${formatDistanceToNow(new Date(post.pollEndsAt), { addSuffix: true })}`}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Article content
  const renderArticleContent = () => {
    return (
      <Link
        href={`/article/${post.id}`}
        className="mt-3 block rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors"
      >
        {post.articleCoverImage && (
          <img
            src={post.articleCoverImage}
            alt=""
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        )}
        <div className="p-4 bg-gray-50 dark:bg-neutral-800/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {post.articleTitle}
          </h3>
          {post.articleTags && post.articleTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.articleTags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {post.articleReadTime && (
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-2">
              {post.articleReadTime} min read
            </p>
          )}
        </div>
      </Link>
    );
  };

  // Celebration content
  const renderCelebrationContent = () => {
    const celebrationEmojis: Record<string, string> = {
      NEW_JOB: '🎉',
      PROMOTION: '🚀',
      GRADUATION: '🎓',
      CERTIFICATION: '📜',
      WORK_ANNIVERSARY: '🎊',
      BIRTHDAY: '🎂',
      JOB_CHANGE: '✨',
      NEW_POSITION: '🌟',
    };
    
    const emoji = post.celebrationType ? celebrationEmojis[post.celebrationType] || '🎉' : '🎉';
    
    return (
      <div className="mt-3 p-6 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700/50 text-center">
        <span className="text-5xl">{emoji}</span>
        <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
          {post.celebrationType?.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
        </p>
      </div>
    );
  };

  // Document content
  const renderDocumentContent = () => {
    if (!post.documentUrl) return null;
    
    return (
      <a
        href={post.documentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
      >
        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
          <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {post.documentName || 'Document'}
          </p>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            {post.documentType?.toUpperCase()} • {post.documentSize ? `${(post.documentSize / 1024 / 1024).toFixed(1)} MB` : ''}
            {post.documentPages ? ` • ${post.documentPages} pages` : ''}
          </p>
        </div>
        <ExternalLink className="w-5 h-5 text-gray-400" />
      </a>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-700">
            {post.author.profileImage ? (
              <img
                src={post.author.profileImage}
                alt={post.author.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">
                {post.author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white hover:underline">
              {post.author.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              {post.author.headline || `@${post.author.username}`}
            </p>
            <p className="text-xs text-gray-400 dark:text-neutral-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </Link>
        
        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-lg z-10">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
              >
                <Copy className="w-4 h-4" />
                Copy link
              </button>
              
              {isOwnPost && (
                <>
                  <button
                    onClick={() => {
                      setShowEditModal(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit post
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete post
                  </button>
                </>
              )}
              
              {!isOwnPost && (
                <button
                  onClick={() => {
                    setShowReportModal(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
                >
                  <Flag className="w-4 h-4" />
                  Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 pb-2">
        {post.content && (
          <FormattedContent 
            content={post.content} 
            className="text-gray-900 dark:text-white"
          />
        )}
        {renderContent()}
      </div>
      
      {/* Engagement Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 dark:text-neutral-400 border-t border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          {likesCount > 0 && (
            <ReactionSummaryDisplay 
              reactionSummary={reactionSummary}
              totalCount={likesCount}
              onClick={() => setShowLikeListModal(true)}
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          {commentsCount > 0 && (
            <button onClick={onCommentClick} className="hover:underline">
              {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-gray-100 dark:border-neutral-800">
        {/* Reaction Button with Picker */}
        <div 
          className="relative"
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => setShowReactionPicker(false)}
        >
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isLiked && currentReaction
                ? `${getReactionConfig(currentReaction).color} ${getReactionConfig(currentReaction).bgColor}`
                : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            {currentReaction ? (
              <>
                {React.createElement(getReactionConfig(currentReaction).icon, { 
                  className: `w-5 h-5 ${isLiked ? 'fill-current' : ''}` 
                })}
                <span className="text-sm font-medium">{getReactionConfig(currentReaction).label}</span>
              </>
            ) : (
              <>
                <ThumbsUp className="w-5 h-5" />
                <span className="text-sm font-medium">Like</span>
              </>
            )}
          </button>
          
          <ReactionPicker
            isOpen={showReactionPicker}
            currentReaction={currentReaction}
            onSelect={handleReaction}
            onClose={() => setShowReactionPicker(false)}
          />
        </div>
        
        <button
          onClick={onCommentClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Comment</span>
        </button>
        
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Share</span>
        </button>
        
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isSaved
              ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium hidden sm:inline">Save</span>
        </button>
      </div>

      {/* Like List Modal */}
      <LikeListModal
        isOpen={showLikeListModal}
        onClose={() => setShowLikeListModal(false)}
        postId={post.id}
        totalCount={likesCount}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onPostUpdated={(updatedPost) => {
          onEdit?.(post.id, updatedPost);
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="post"
        targetId={post.id}
        targetName={`Post by ${post.author.name}`}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post.id}
        postPreview={post.content || undefined}
        postAuthor={{
          name: post.author.name,
          username: post.author.username,
          profileImage: post.author.profileImage,
        }}
        postMediaUrl={post.mediaUrls?.[0] || post.videoUrl || null}
      />

      {/* Fullscreen Media Lightbox */}
      {showMediaLightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={() => setShowMediaLightbox(false)}
        >
          <button
            onClick={() => setShowMediaLightbox(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <div
            className="max-w-[95vw] max-h-[95vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxMediaType === 'image' && post.mediaUrls && post.mediaUrls.length > 0 ? (
              <div className="relative">
                <img
                  src={post.mediaUrls[currentImageIndex]}
                  alt=""
                  className="max-w-full max-h-[95vh] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
                {post.mediaUrls.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => (prev === 0 ? post.mediaUrls!.length - 1 : prev - 1));
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => (prev === post.mediaUrls!.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
                      {currentImageIndex + 1} / {post.mediaUrls.length}
                    </div>
                  </>
                )}
              </div>
            ) : lightboxMediaType === 'video' && post.videoUrl ? (
              <video
                src={post.videoUrl}
                controls
                autoPlay
                className="max-w-full max-h-[95vh]"
                onClick={(e) => e.stopPropagation()}
              />
            ) : null}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default PostCard;

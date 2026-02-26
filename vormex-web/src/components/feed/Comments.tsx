'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  X,
  CornerDownRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '@/types/post';
import { getComments, createComment as apiCreateComment, searchUsersForMention, toggleCommentLike } from '@/lib/api/posts';
import { joinPostRoom, leavePostRoom, getSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth/useAuth';
import type { MentionUser } from '@/types/post';

interface CommentsProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  highlightCommentId?: string;
  onCommentCountChange?: (count: number) => void;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  depth: number;
  highlightId?: string;
  onReply: (parentId: string, parentAuthor: string) => void;
}

function CommentItem({ comment, postId, depth, highlightId, onReply }: CommentItemProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [showReplies, setShowReplies] = useState(depth < 2);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(comment.replyCount > 0);
  const [replyCount, setReplyCount] = useState(comment.replyCount);
  
  const commentRef = useRef<HTMLDivElement>(null);
  const isHighlighted = highlightId === comment.id;

  // Sync with parent state when comment prop changes (from real-time updates)
  useEffect(() => {
    setIsLiked(comment.isLiked);
    setLikesCount(comment.likesCount);
  }, [comment.isLiked, comment.likesCount]);

  // Listen for real-time reply updates
  useEffect(() => {
    const socket = getSocket();
    
    const handleCommentCreated = (data: { postId: string; comment?: any; commentsCount: number }) => {
      // Skip if no comment data or not a reply to this comment
      if (!data.comment || data.postId !== postId || data.comment.parentId !== comment.id) return;
      
      // New reply to this comment
      setReplies(prev => {
        if (prev.some(r => r.id === data.comment.id)) return prev;
        return [data.comment, ...prev];
      });
      setReplyCount(prev => prev + 1);
      setHasMoreReplies(true);
    };
    
    const handleCommentLiked = (data: { commentId: string; userId: string; liked: boolean; likesCount: number }) => {
      // Update this comment's likes
      if (data.commentId === comment.id) {
        setLikesCount(data.likesCount);
        if (data.userId === user?.id) {
          setIsLiked(data.liked);
        }
      }
      // Update nested replies' likes
      setReplies(prev => prev.map(r => 
        r.id === data.commentId 
          ? { ...r, likesCount: data.likesCount, isLiked: data.userId === user?.id ? data.liked : r.isLiked }
          : r
      ));
    };
    
    socket?.on('comment:created', handleCommentCreated);
    socket?.on('comment:liked', handleCommentLiked);
    
    return () => {
      socket?.off('comment:created', handleCommentCreated);
      socket?.off('comment:liked', handleCommentLiked);
    };
  }, [postId, comment.id, user?.id]);

  // Scroll to highlighted comment
  useEffect(() => {
    if (isHighlighted && commentRef.current) {
      commentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);

  // Load replies
  const loadReplies = async () => {
    if (loadingReplies || replies.length >= comment.replyCount) return;
    
    setLoadingReplies(true);
    try {
      const response = await getComments(postId, comment.id, 1, 10);
      setReplies(response.comments);
      setHasMoreReplies(response.hasMore);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  // Handle like
  const handleLike = async () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    
    try {
      const res = await toggleCommentLike(postId, comment.id);
      if (res) {
        setIsLiked(res.liked);
        setLikesCount(res.likesCount);
      }
    } catch (error) {
      setIsLiked(!newLiked);
      setLikesCount(likesCount);
    }
  };

  // Parse content for mentions
  const parseContent = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <Link
            key={index}
            href={`/profile/${part.slice(1)}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {part}
          </Link>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      ref={commentRef}
      className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 dark:border-neutral-800 pl-4' : ''}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`py-3 transition-colors ${
          isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/20 -mx-2 px-2 rounded-lg' : ''
        }`}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <Link href={`/profile/${comment.author.username}`} className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-700">
              {comment.author.profileImage ? (
                <img
                  src={comment.author.profileImage}
                  alt={comment.author.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">
                  {comment.author.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Link>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-gray-100 dark:bg-neutral-800 rounded-2xl px-4 py-2">
              <Link
                href={`/profile/${comment.author.username}`}
                className="font-semibold text-sm text-gray-900 dark:text-white hover:underline"
              >
                {comment.author.name}
              </Link>
              <p className="text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">
                {parseContent(comment.content)}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-4 mt-1 ml-2 text-xs">
              <span className="text-gray-500 dark:text-neutral-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              
              <button
                onClick={handleLike}
                className={`font-semibold transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                }`}
              >
                Like{likesCount > 0 && ` (${likesCount})`}
              </button>
              
              <button
                onClick={() => onReply(comment.id, comment.author.username)}
                className="font-semibold text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 transition-colors"
              >
                Reply
              </button>
            </div>
            
            {/* Replies toggle */}
            {replyCount > 0 && (
              <button
                onClick={() => {
                  setShowReplies(!showReplies);
                  if (!showReplies && replies.length === 0) {
                    loadReplies();
                  }
                }}
                className="flex items-center gap-1 mt-2 ml-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <CornerDownRight className="w-3 h-3" />
                {showReplies ? 'Hide' : 'View'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
        
        {/* Replies */}
        <AnimatePresence>
          {showReplies && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              {loadingReplies && replies.length === 0 ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    postId={postId}
                    depth={depth + 1}
                    highlightId={highlightId}
                    onReply={onReply}
                  />
                ))
              )}
              
              {hasMoreReplies && replies.length > 0 && (
                <button
                  onClick={loadReplies}
                  disabled={loadingReplies}
                  className="ml-8 mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                >
                  {loadingReplies ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Load more replies'
                  )}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export function Comments({ postId, isOpen, onClose, highlightCommentId, onCommentCountChange }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  
  // Input state
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mention state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentions, setMentions] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Join post room for real-time updates
  useEffect(() => {
    if (isOpen) {
      joinPostRoom(postId);
      
      // Set up real-time comment listeners
      const socket = getSocket();
      
      const handleCommentCreated = (data: { postId: string; comment?: any; commentsCount: number }) => {
        if (data.postId !== postId) return;
        
        // Update comment count regardless of whether full comment data is present
        if (typeof data.commentsCount === 'number') {
          onCommentCountChange?.(data.commentsCount);
        }
        
        // If no comment data provided (global feed broadcast), just update the count
        if (!data.comment) return;
        
        // Add new comment to the list (avoid duplicates)
        setComments(prev => {
          // Check if comment already exists (from optimistic update or duplicate event)
          const exists = prev.some(c => c.id === data.comment.id);
          const hasTempComment = prev.some(c => c.id.startsWith('temp-'));
          
          if (exists) {
            // Comment already in list, no change needed
            return prev;
          }
          
          if (hasTempComment) {
            // Replace temp comment with real one
            return prev.map(c => c.id.startsWith('temp-') ? data.comment : c);
          }
          
          // Add to top if it's a new top-level comment
          if (!data.comment.parentId) {
            return [data.comment, ...prev];
          }
          return prev;
        });
      };
      
      const handleCommentLiked = (data: { commentId: string; userId: string; liked: boolean; likesCount: number }) => {
        // Update comment likes in real-time
        setComments(prev => prev.map(c => 
          c.id === data.commentId 
            ? { ...c, likesCount: data.likesCount, isLiked: data.userId === user?.id ? data.liked : c.isLiked }
            : c
        ));
      };
      
      socket?.on('comment:created', handleCommentCreated);
      socket?.on('comment:liked', handleCommentLiked);
      
      return () => {
        leavePostRoom(postId);
        socket?.off('comment:created', handleCommentCreated);
        socket?.off('comment:liked', handleCommentLiked);
      };
    }
  }, [isOpen, postId, user?.id, onCommentCountChange]);

  // Fetch comments
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchComments = async () => {
      setLoading(true);
      try {
        const response = await getComments(postId, undefined, 1, 20);
        setComments(response.comments);
        setHasMore(response.hasMore);
        setPage(1);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [isOpen, postId]);

  // Load more comments
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await getComments(postId, undefined, nextPage, 20);
      setComments(prev => [...prev, ...response.comments]);
      setHasMore(response.hasMore);
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more comments:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle reply click
  const handleReply = (parentId: string, username: string) => {
    setReplyingTo({ id: parentId, username });
    setNewComment(`@${username} `);
    setMentions([]);
    inputRef.current?.focus();
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
    setMentions([]);
  };

  // Search mentions
  const searchMentions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setMentionResults([]);
      setShowMentionDropdown(false);
      return;
    }
    
    try {
      const results = await searchUsersForMention(query);
      setMentionResults(results);
      setShowMentionDropdown(results.length > 0);
    } catch (error) {
      console.error('Error searching mentions:', error);
    }
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);
    
    // Detect @mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1);
      const spaceIndex = textAfterAt.indexOf(' ');
      const query = spaceIndex === -1 ? textAfterAt : '';
      
      if (query) {
        setMentionQuery(query);
        searchMentions(query);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Insert mention
  const insertMention = (mentionUser: MentionUser) => {
    const lastAtIndex = newComment.lastIndexOf('@');
    const updatedComment = newComment.slice(0, lastAtIndex) + `@${mentionUser.username} `;
    setNewComment(updatedComment);
    setMentions([...mentions, mentionUser.id]);
    setShowMentionDropdown(false);
    inputRef.current?.focus();
  };

  // Submit comment
  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const comment = await apiCreateComment(
        postId,
        newComment.trim(),
        replyingTo?.id,
        mentions
      );
      
      setComments(prev => {
        if (replyingTo) {
          return prev.map(c =>
            c.id === replyingTo.id
              ? { ...c, replyCount: (c.replyCount || 0) + 1 }
              : c
          );
        }
        const exists = prev.some(c => c.id === comment.id);
        if (exists) return prev;
        return [comment, ...prev];
      });
      
      onCommentCountChange?.(comments.length + 1);
      setNewComment('');
      setMentions([]);
      setReplyingTo(null);
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Panel */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-xl h-[80vh] sm:h-[70vh] sm:rounded-t-2xl sm:rounded-b-2xl bg-white dark:bg-neutral-900 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Comments List */}
          <div
            ref={commentsContainerRef}
            className="flex-1 overflow-y-auto p-4"
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-neutral-600 mb-2" />
                <p className="text-gray-500 dark:text-neutral-400">No comments yet</p>
                <p className="text-sm text-gray-400 dark:text-neutral-500">Be the first to comment!</p>
              </div>
            ) : (
              <>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    postId={postId}
                    depth={0}
                    highlightId={highlightCommentId}
                    onReply={handleReply}
                  />
                ))}
                
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    {loadingMore ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      'Load more comments'
                    )}
                  </button>
                )}
              </>
            )}
          </div>
          
          {/* Reply indicator */}
          {replyingTo && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-neutral-800/50 border-t border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-neutral-400">
                Replying to <span className="font-semibold text-gray-700 dark:text-neutral-300">@{replyingTo.username}</span>
              </span>
              <button onClick={cancelReply} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
            <div className="relative">
              {/* Mention Dropdown */}
              {showMentionDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-2 max-h-40 overflow-y-auto bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
                  {mentionResults.map((mentionUser) => (
                    <button
                      key={mentionUser.id}
                      onClick={() => insertMention(mentionUser)}
                      className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-600">
                        {mentionUser.profileImage && (
                          <img src={mentionUser.profileImage} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{mentionUser.name}</p>
                        <p className="text-xs text-gray-500">@{mentionUser.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-700 flex-shrink-0">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <textarea
                  ref={inputRef}
                  value={newComment}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Write a comment..."
                  rows={1}
                  className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 resize-none outline-none focus:ring-2 focus:ring-blue-500 max-h-24"
                  style={{ minHeight: '40px' }}
                />
                
                <button
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || isSubmitting}
                  className="p-2 rounded-full bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default Comments;

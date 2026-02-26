'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Heart, Send, Loader2, ChevronDown, Pin } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { reelsApi, ReelComment } from '@/lib/api/reels';
import { MentionInput } from './MentionInput';

interface ReelCommentsProps {
  reelId: string;
  isOpen: boolean;
  onClose: () => void;
  authorId: string;
}

export function ReelComments({ reelId, isOpen, onClose, authorId }: ReelCommentsProps) {
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentMentions, setCommentMentions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<ReelComment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [repliesData, setRepliesData] = useState<Record<string, ReelComment[]>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async (cursor?: string) => {
    try {
      setIsLoading(true);
      const response = (await reelsApi.getComments(reelId, { cursor, limit: 20 })) as unknown as {
        comments: ReelComment[];
        nextCursor: string | null;
        hasMore: boolean;
      };
      
      if (cursor) {
        setComments((prev) => [...prev, ...response.comments]);
      } else {
        setComments(response.comments);
      }
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [reelId]);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, fetchComments]);

  const fetchReplies = useCallback(async (parentId: string) => {
    try {
      const response = (await reelsApi.getComments(reelId, { parentId, limit: 10 })) as unknown as {
        comments: ReelComment[];
        nextCursor: string | null;
        hasMore: boolean;
      };
      setRepliesData((prev) => ({
        ...prev,
        [parentId]: response.comments,
      }));
    } catch (error) {
      console.error('Failed to fetch replies:', error);
    }
  }, [reelId]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = (await reelsApi.createComment(reelId, {
        content: newComment.trim(),
        parentId: replyTo?.id,
        mentions: commentMentions,
      })) as unknown as ReelComment;

      if (replyTo) {
        setRepliesData((prev) => ({
          ...prev,
          [replyTo.id]: [response, ...(prev[replyTo.id] || [])],
        }));
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, repliesCount: c.repliesCount + 1 }
              : c
          )
        );
      } else {
        setComments((prev) => [response, ...prev]);
      }

      setNewComment('');
      setCommentMentions([]);
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [reelId, newComment, commentMentions, replyTo, isSubmitting]);

  const handleCommentChange = useCallback((value: string, mentions: string[]) => {
    setNewComment(value);
    setCommentMentions(mentions);
  }, []);

  const handleLike = useCallback(async (commentId: string) => {
    try {
      const response = (await reelsApi.toggleCommentLike(reelId, commentId)) as unknown as {
        liked: boolean;
        likesCount: number;
      };
      
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, isLiked: response.liked, likesCount: response.likesCount }
            : c
        )
      );

      Object.keys(repliesData).forEach((parentId) => {
        setRepliesData((prev) => ({
          ...prev,
          [parentId]: prev[parentId].map((c) =>
            c.id === commentId
              ? { ...c, isLiked: response.liked, likesCount: response.likesCount }
              : c
          ),
        }));
      });
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }, [reelId, repliesData]);

  const handleReply = useCallback((comment: ReelComment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
  }, []);

  const toggleReplies = useCallback((commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
      if (!repliesData[commentId]) {
        fetchReplies(commentId);
      }
    }
    setExpandedReplies(newExpanded);
  }, [expandedReplies, repliesData, fetchReplies]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const renderComment = (comment: ReelComment, isReply = false) => (
    <div key={comment.id} className={cn("flex gap-3", isReply && "ml-12")}>
      <Link href={`/profile/${comment.author.id}`}>
        <img
          src={comment.author.profileImage || '/default-avatar.png'}
          alt={comment.author.name}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
      </Link>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/profile/${comment.author.id}`}
            className="font-semibold text-sm hover:underline"
          >
            {comment.author.username}
          </Link>
          {comment.author.id === authorId && (
            <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
              Creator
            </span>
          )}
          {comment.isPinned && (
            <Pin className="w-3 h-3 text-gray-400" />
          )}
          <span className="text-gray-500 text-xs">
            {formatTime(comment.createdAt)}
          </span>
        </div>
        
        <p className="text-sm mt-1 break-words">{comment.content}</p>
        
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => handleLike(comment.id)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <Heart
              className={cn(
                "w-4 h-4",
                comment.isLiked && "fill-red-500 text-red-500"
              )}
            />
            {comment.likesCount > 0 && comment.likesCount}
          </button>
          
          <button
            onClick={() => handleReply(comment)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Reply
          </button>
          
          {comment.isAuthorHeart && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <Heart className="w-3 h-3 fill-red-500" /> by creator
            </span>
          )}
        </div>
        
        {!isReply && comment.repliesCount > 0 && (
          <button
            onClick={() => toggleReplies(comment.id)}
            className="flex items-center gap-1 text-xs text-blue-500 mt-2 hover:underline"
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                expandedReplies.has(comment.id) && "rotate-180"
              )}
            />
            {expandedReplies.has(comment.id)
              ? 'Hide replies'
              : `View ${comment.repliesCount} ${comment.repliesCount === 1 ? 'reply' : 'replies'}`
            }
          </button>
        )}
        
        {expandedReplies.has(comment.id) && repliesData[comment.id] && (
          <div className="mt-3 space-y-4">
            {repliesData[comment.id].map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg h-[70vh] bg-white dark:bg-gray-900 rounded-t-3xl flex flex-col animate-slide-up mb-24">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Comments</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-6"
        >
          {isLoading && comments.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            <>
              {comments.map((comment) => renderComment(comment))}
              
              {hasMore && (
                <button
                  onClick={() => fetchComments(nextCursor || undefined)}
                  disabled={isLoading}
                  className="w-full py-2 text-sm text-blue-500 hover:underline disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Load more comments'
                  )}
                </button>
              )}
            </>
          )}
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {replyTo && (
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
              <span>Replying to @{replyTo.author.username}</span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
              <MentionInput
                value={newComment}
                onChange={handleCommentChange}
                placeholder={replyTo ? `Reply to @${replyTo.author.username}...` : "Add a comment..."}
                className="text-sm text-gray-900 dark:text-white"
                onSubmit={() => handleSubmit()}
                autoFocus={!!replyTo}
              />
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

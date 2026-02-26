'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PostCard } from '@/components/feed/PostCard';
import { Comments } from '@/components/feed/Comments';
import { getPost } from '@/lib/api/posts';
import { joinPostRoom, leavePostRoom } from '@/lib/socket';
import type { Post, PollOption } from '@/types/post';

function PostDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = params.id as string;
  const highlightCommentId = searchParams.get('comment') || undefined;
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(!!highlightCommentId);

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getPost(postId);
        setPost(data);
        
        // Join room for real-time updates
        joinPostRoom(postId);
      } catch (err: any) {
        console.error('Error fetching post:', err);
        setError(err.response?.data?.error || 'Post not found');
      } finally {
        setLoading(false);
      }
    };
    
    if (postId) {
      fetchPost();
    }
    
    return () => {
      if (postId) {
        leavePostRoom(postId);
      }
    };
  }, [postId]);

  // Auto-open comments if there's a highlight
  useEffect(() => {
    if (highlightCommentId && post) {
      setShowComments(true);
    }
  }, [highlightCommentId, post]);

  // Handle like update
  const handleLikeUpdate = (postId: string, liked: boolean, count: number) => {
    setPost(prev => prev ? { ...prev, isLiked: liked, likesCount: count } : null);
  };

  // Handle poll update
  const handlePollUpdate = (postId: string, options: PollOption[]) => {
    setPost(prev => prev ? { ...prev, pollOptions: options } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {error || 'Post not found'}
        </h1>
        <p className="text-gray-500 dark:text-neutral-400 mb-4">
          The post you're looking for doesn't exist or has been deleted.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto flex items-center gap-4 p-4">
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Post</h1>
        </div>
      </div>

      {/* Post Content */}
      <div className="max-w-2xl mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PostCard
            post={post}
            onLikeUpdate={handleLikeUpdate}
            onPollUpdate={handlePollUpdate}
            onCommentClick={() => setShowComments(true)}
          />
        </motion.div>
      </div>

      {/* Comments Panel */}
      <Comments
        postId={postId}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        highlightCommentId={highlightCommentId}
        onCommentCountChange={(count) => {
          setPost(prev => prev ? { ...prev, commentsCount: count } : null);
        }}
      />
    </div>
  );
}

export default function PostDetailPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      }>
        <PostDetailContent />
      </Suspense>
    </ProtectedRoute>
  );
}

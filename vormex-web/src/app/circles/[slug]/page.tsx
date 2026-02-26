'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/lib/auth/authContext';
import { circlesAPI, type Circle, type CircleMember, type CirclePost } from '@/lib/api/circles';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function CircleDetailContent() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const [circle, setCircle] = useState<(Circle & { topMembers: CircleMember[]; _count: Record<string, number> }) | null>(null);
  const [posts, setPosts] = useState<CirclePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'members' | 'about'>('posts');
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchCircle = useCallback(async () => {
    try {
      const data = await circlesAPI.getBySlug(slug as string);
      setCircle(data.circle);
    } catch (error) {
      console.error('Failed to fetch circle:', error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchPosts = useCallback(async () => {
    if (!circle) return;
    try {
      const data = await circlesAPI.getPosts(circle.id);
      setPosts(data.posts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  }, [circle]);

  const fetchMembers = useCallback(async () => {
    if (!circle) return;
    try {
      const data = await circlesAPI.getMembers(circle.id);
      setMembers(data.members);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }, [circle]);

  useEffect(() => { fetchCircle(); }, [fetchCircle]);
  useEffect(() => { if (circle && tab === 'posts') fetchPosts(); }, [circle, tab, fetchPosts]);
  useEffect(() => { if (circle && tab === 'members') fetchMembers(); }, [circle, tab, fetchMembers]);

  const handleJoin = async () => {
    if (!circle) return;
    try {
      await circlesAPI.join(circle.id);
      setCircle(prev => prev ? { ...prev, isMember: true, memberCount: prev.memberCount + 1 } : null);
    } catch (error: any) {
      if (error.response?.data?.requiresUpgrade) {
        alert('Upgrade to Vormex Pro for unlimited circles!');
      }
    }
  };

  const handleLeave = async () => {
    if (!circle) return;
    try {
      await circlesAPI.leave(circle.id);
      setCircle(prev => prev ? { ...prev, isMember: false, memberCount: prev.memberCount - 1 } : null);
    } catch (error) {
      console.error('Failed to leave circle:', error);
    }
  };

  const handlePost = async () => {
    if (!circle || !newPost.trim()) return;
    setPosting(true);
    try {
      const data = await circlesAPI.createPost(circle.id, { content: newPost });
      setPosts(prev => [data.post, ...prev]);
      setNewPost('');
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-3">🔍</span>
          <p className="font-medium text-neutral-700 dark:text-neutral-300">Circle not found</p>
          <button onClick={() => router.push('/circles')} className="mt-3 text-blue-500 text-sm font-medium">
            Browse circles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <button onClick={() => router.back()} className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 mb-3 flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            Back
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 flex items-center justify-center text-3xl flex-shrink-0">
              {circle.emoji || '🔵'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{circle.name}</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                {circle.memberCount} member{circle.memberCount !== 1 ? 's' : ''}
                {circle.campus && ` · ${circle.campus}`}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={circle.isMember ? handleLeave : handleJoin}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    circle.isMember
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-red-50 hover:text-red-500'
                      : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
                  }`}
                >
                  {circle.isMember ? 'Leave Circle' : 'Join Circle'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 border-b -mx-4 px-4">
            {(['posts', 'members', 'about'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all capitalize ${
                  tab === t
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {tab === 'posts' && (
          <div className="space-y-4">
            {/* Post composer */}
            {circle.isMember && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
                <textarea
                  placeholder="Share something with the circle..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="w-full resize-none bg-transparent text-sm placeholder:text-neutral-400 focus:outline-none min-h-[80px]"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handlePost}
                    disabled={!newPost.trim() || posting}
                    className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold disabled:opacity-50 hover:bg-blue-600 transition-colors"
                  >
                    {posting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-3xl block mb-2">💬</span>
                <p className="text-sm text-neutral-500">No posts yet. Be the first to share!</p>
              </div>
            ) : (
              posts.map(post => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      {post.author?.profileImage ? (
                        <img src={post.author.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-bold">{post.author?.name?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{post.author?.name}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{post.content}</p>
                </motion.div>
              ))
            )}
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-2">
            {(members.length > 0 ? members : circle.topMembers || []).map(member => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => router.push(`/profile/${member.username}`)}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  {member.profileImage ? (
                    <img src={member.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-sm font-bold">{member.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">{member.name}</p>
                  <p className="text-xs text-neutral-500">{member.headline || member.college || `@${member.username}`}</p>
                </div>
                {member.role !== 'member' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold capitalize">
                    {member.role}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'about' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">About</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
              {circle.description || 'No description yet.'}
            </p>
            
            {circle.tags?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-neutral-500 uppercase mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {circle.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">{circle.memberCount}</p>
                <p className="text-xs text-neutral-500">Members</p>
              </div>
              <div>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">{circle.postsCount}</p>
                <p className="text-xs text-neutral-500">Posts</p>
              </div>
              <div>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">{circle._count?.challenges || 0}</p>
                <p className="text-xs text-neutral-500">Challenges</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CircleDetailPage() {
  return (
    <ProtectedRoute>
      <CircleDetailContent />
    </ProtectedRoute>
  );
}

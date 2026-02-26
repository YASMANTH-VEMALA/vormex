'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/lib/auth/authContext';
import { circlesAPI, type Circle } from '@/lib/api/circles';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🌍' },
  { id: 'coding', label: 'Coding', emoji: '💻' },
  { id: 'web_dev', label: 'Web Dev', emoji: '🌐' },
  { id: 'mobile_dev', label: 'Mobile', emoji: '📱' },
  { id: 'ai_ml', label: 'AI/ML', emoji: '🤖' },
  { id: 'business', label: 'Business', emoji: '🚀' },
  { id: 'design', label: 'Design', emoji: '🎨' },
  { id: 'competitive_programming', label: 'CP', emoji: '🏆' },
  { id: 'data_science', label: 'Data', emoji: '📊' },
  { id: 'devops', label: 'DevOps', emoji: '☁️' },
  { id: 'cybersecurity', label: 'Security', emoji: '🔒' },
  { id: 'career', label: 'Career', emoji: '💼' },
  { id: 'content_creation', label: 'Content', emoji: '🎬' },
  { id: 'research', label: 'Research', emoji: '🔬' },
];

function CircleCard({ circle, onJoin, onLeave }: {
  circle: Circle;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer group"
      onClick={() => router.push(`/circles/${circle.slug}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950 flex items-center justify-center text-2xl">
            {circle.emoji || '🔵'}
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-blue-500 transition-colors">
              {circle.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {circle.memberCount} member{circle.memberCount !== 1 ? 's' : ''}
              {circle.campus && ` · ${circle.campus}`}
            </p>
          </div>
        </div>
      </div>

      {circle.description && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
          {circle.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {circle.tags?.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            circle.isMember ? onLeave(circle.id) : onJoin(circle.id);
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            circle.isMember
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30'
              : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/20'
          }`}
        >
          {circle.isMember ? 'Joined' : 'Join'}
        </button>
      </div>
    </motion.div>
  );
}

function CirclesContent() {
  const { user } = useAuthContext();
  const [tab, setTab] = useState<'discover' | 'my'>('discover');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [circles, setCircles] = useState<Circle[]>([]);
  const [myCircles, setMyCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCircles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (category !== 'all') params.category = category;
      if (search) params.search = search;
      const data = await circlesAPI.discover(params);
      setCircles(data.circles);
    } catch (error) {
      console.error('Failed to fetch circles:', error);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  const fetchMyCircles = useCallback(async () => {
    try {
      const data = await circlesAPI.getMyCircles();
      setMyCircles(data.circles);
    } catch (error) {
      console.error('Failed to fetch my circles:', error);
    }
  }, []);

  useEffect(() => { fetchCircles(); }, [fetchCircles]);
  useEffect(() => { if (tab === 'my') fetchMyCircles(); }, [tab, fetchMyCircles]);

  const handleJoin = async (circleId: string) => {
    try {
      await circlesAPI.join(circleId);
      setCircles(prev => prev.map(c =>
        c.id === circleId ? { ...c, isMember: true, memberCount: c.memberCount + 1 } : c
      ));
      fetchMyCircles();
    } catch (error: any) {
      if (error.response?.data?.requiresUpgrade) {
        alert('Free plan allows up to 3 circles. Upgrade to Vormex Pro for unlimited circles!');
      }
    }
  };

  const handleLeave = async (circleId: string) => {
    try {
      await circlesAPI.leave(circleId);
      setCircles(prev => prev.map(c =>
        c.id === circleId ? { ...c, isMember: false, memberCount: c.memberCount - 1 } : c
      ));
      setMyCircles(prev => prev.filter(c => c.id !== circleId));
    } catch (error) {
      console.error('Failed to leave circle:', error);
    }
  };

  const displayCircles = tab === 'my' ? myCircles : circles;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">Circles</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Join communities that match your interests
          </p>

          {/* Tabs */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 mt-4">
            <button
              onClick={() => setTab('discover')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'discover'
                  ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-neutral-500'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setTab('my')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'my'
                  ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-neutral-500'
              }`}
            >
              My Circles ({myCircles.length})
            </button>
          </div>

          {/* Search */}
          {tab === 'discover' && (
            <input
              type="text"
              placeholder="Search circles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mt-3 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
          )}

          {/* Category filters */}
          {tab === 'discover' && (
            <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 -mx-1 px-1 custom-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === cat.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Circles grid */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-32" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-20" />
                  </div>
                </div>
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-full mb-2" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : displayCircles.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">{tab === 'my' ? '📭' : '🔍'}</span>
            <p className="font-medium text-neutral-700 dark:text-neutral-300">
              {tab === 'my' ? "You haven't joined any circles yet" : 'No circles found'}
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              {tab === 'my' ? 'Discover and join circles that match your interests' : 'Try a different search or category'}
            </p>
            {tab === 'my' && (
              <button
                onClick={() => setTab('discover')}
                className="mt-4 px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
              >
                Discover Circles
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {displayCircles.map(circle => (
                <CircleCard
                  key={circle.id}
                  circle={circle}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CirclesPage() {
  return (
    <ProtectedRoute>
      <CirclesContent />
    </ProtectedRoute>
  );
}

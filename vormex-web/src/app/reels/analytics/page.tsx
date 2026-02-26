'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  BarChart3,
  TrendingUp,
  Loader2,
  Film,
} from 'lucide-react';
import apiClient from '@/lib/api/client';

interface CreatorAnalytics {
  totalReels: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  avgWatchTimeMs: number;
  avgCompletionRate: number;
  recentViews: number;
  topReels: { id: string; viewsCount: number; likesCount: number; commentsCount: number; createdAt: string }[];
}

export default function ReelAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/reels/analytics/creator', {
          params: { days },
        });
        setAnalytics(response as unknown as CreatorAnalytics);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const formatDuration = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Reel Analytics
            </h1>
            <div className="w-10" />
          </div>

          <div className="flex gap-2 mt-4">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  days === d ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {analytics && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <Eye className="w-5 h-5" />
                  <span>Total Views</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalViews)}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <Film className="w-5 h-5" />
                  <span>Total Reels</span>
                </div>
                <p className="text-2xl font-bold">{analytics.totalReels}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <Heart className="w-5 h-5" />
                  <span>Total Likes</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalLikes)}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <MessageCircle className="w-5 h-5" />
                  <span>Comments</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalComments)}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <Share2 className="w-5 h-5" />
                  <span>Shares</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalShares)}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/60 mb-1">
                  <Bookmark className="w-5 h-5" />
                  <span>Saves</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalSaves)}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-white/60 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span>Performance</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/60">Avg. Watch Time</p>
                  <p className="text-lg font-semibold">{formatDuration(analytics.avgWatchTimeMs)}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Completion Rate</p>
                  <p className="text-lg font-semibold">
                    {((analytics.avgCompletionRate || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Views (last {days}d)</p>
                  <p className="text-lg font-semibold">{formatNumber(analytics.recentViews)}</p>
                </div>
              </div>
            </div>

            {analytics.topReels.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Top Performing Reels</h2>
                <div className="space-y-2">
                  {analytics.topReels.map((reel, i) => (
                    <button
                      key={reel.id}
                      onClick={() => router.push(`/reels/${reel.id}`)}
                      className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left"
                    >
                      <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {formatNumber(reel.viewsCount)} views
                        </p>
                        <p className="text-sm text-white/60">
                          {formatNumber(reel.likesCount)} likes · {formatNumber(reel.commentsCount)} comments
                        </p>
                      </div>
                      <span className="text-white/60 text-sm">
                        {new Date(reel.createdAt).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

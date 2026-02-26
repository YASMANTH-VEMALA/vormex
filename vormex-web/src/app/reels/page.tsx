'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Compass, BarChart3, FileVideo } from 'lucide-react';
import { ReelsFeed } from '@/components/reels';
import { cn } from '@/lib/utils';

type FeedMode = 'foryou' | 'following';

export default function ReelsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<FeedMode>('foryou');

  const handleCreateClick = useCallback(() => {
    router.push('/reels/create');
  }, [router]);

  const handleTrendingClick = useCallback(() => {
    router.push('/reels/trending');
  }, [router]);

  return (
    <div className="relative min-h-screen w-full bg-black">
      <div className="absolute top-0 left-0 right-0 z-20 pt-4 px-4 pb-2 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-white text-xl font-bold">Reels</h1>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white/10 rounded-full p-1">
              <button
                onClick={() => setMode('foryou')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  mode === 'foryou'
                    ? "bg-white text-black"
                    : "text-white hover:text-white/80"
                )}
              >
                For You
              </button>
              <button
                onClick={() => setMode('following')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  mode === 'following'
                    ? "bg-white text-black"
                    : "text-white hover:text-white/80"
                )}
              >
                Following
              </button>
            </div>
            
            <button
              onClick={handleTrendingClick}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Trending"
            >
              <Compass className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => router.push('/reels/analytics')}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Analytics"
            >
              <BarChart3 className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => router.push('/reels/drafts')}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Drafts"
            >
              <FileVideo className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleCreateClick}
              className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
              title="Create Reel"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <ReelsFeed mode={mode} />
    </div>
  );
}

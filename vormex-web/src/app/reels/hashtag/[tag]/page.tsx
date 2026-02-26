'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Hash, Loader2 } from 'lucide-react';
import { useHashtagReels } from '@/hooks/reels';
import { ReelCard } from '@/components/reels';

export default function HashtagReelsPage() {
  const params = useParams();
  const router = useRouter();
  const hashtag = decodeURIComponent(params.tag as string);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  
  const { reels, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useHashtagReels(hashtag);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);

      if (newIndex >= reels.length - 3 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [activeIndex, reels.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white gap-4">
        <p>Failed to load reels</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white text-black rounded-full font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white gap-4">
        <Hash className="w-16 h-16 text-gray-500" />
        <p className="text-xl">No reels with #{hashtag}</p>
        <button
          onClick={() => router.push('/reels')}
          className="px-6 py-2 bg-white text-black rounded-full font-medium"
        >
          Go to Reels
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black">
      <div className="absolute top-0 left-0 right-0 z-20 pt-4 px-4 pb-2 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold flex items-center gap-1">
              <Hash className="w-5 h-5" />
              {hashtag}
            </h1>
            <p className="text-white/60 text-sm">{reels.length} reels</p>
          </div>
        </div>
      </div>

      <div
        className="h-screen w-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide"
        onScroll={handleScroll}
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            className="h-screen w-full snap-start snap-always"
          >
            <ReelCard
              reel={reel}
              isActive={index === activeIndex}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(!isMuted)}
            />
          </div>
        ))}

        {isFetchingNextPage && (
          <div className="h-screen w-full flex items-center justify-center bg-black">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

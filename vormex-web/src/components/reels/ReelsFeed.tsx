'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { ReelCard } from './ReelCard';
import { reelsApi, Reel, ReelsFeedResponse } from '@/lib/api/reels';

interface ReelsFeedProps {
  mode?: 'foryou' | 'following';
  initialReels?: Reel[];
}

export function ReelsFeed({ mode = 'foryou', initialReels }: ReelsFeedProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRefs = useRef<Map<string, IntersectionObserver>>(new Map());

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['reels-feed', mode],
    queryFn: async ({ pageParam }) => {
      const response = await reelsApi.getFeed({ cursor: pageParam, limit: 10, mode });
      return response as unknown as ReelsFeedResponse;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5,
    initialData: initialReels
      ? {
          pages: [{ reels: initialReels, nextCursor: null, hasMore: false }],
          pageParams: [undefined],
        }
      : undefined,
  });

  const reels = data?.pages.flatMap((p) => p.reels) ?? [];

  useEffect(() => {
    const preloadReels = reels.slice(activeIndex + 1, activeIndex + 4);
    preloadReels.forEach((reel) => {
      if (reel.hlsUrl) {
        fetch(reel.hlsUrl).catch(() => {});
      }
      if (reel.thumbnailUrl) {
        const img = new Image();
        img.src = reel.thumbnailUrl;
      }
    });
  }, [activeIndex, reels]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleFirstInteraction = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

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
        <p className="text-xl">No reels yet</p>
        <p className="text-gray-400">Be the first to create one!</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen w-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide"
      onClick={handleFirstInteraction}
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
            onMuteToggle={handleMuteToggle}
          />
        </div>
      ))}

      {isFetchingNextPage && (
        <div className="h-screen w-full flex items-center justify-center bg-black">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { reelsApi, Reel } from '@/lib/api/reels';

interface UseReelPreloadOptions {
  reels: Reel[];
  activeIndex: number;
  preloadCount?: number;
}

export function useReelPreload({
  reels,
  activeIndex,
  preloadCount = 3,
}: UseReelPreloadOptions) {
  const preloadedUrls = useRef<Set<string>>(new Set());
  const preloadedImages = useRef<Set<string>>(new Set());

  const preloadHls = useCallback(async (url: string) => {
    if (preloadedUrls.current.has(url)) return;
    
    try {
      await fetch(url, { method: 'HEAD' });
      preloadedUrls.current.add(url);
    } catch (error) {
      // Ignore errors
    }
  }, []);

  const preloadThumbnail = useCallback((url: string) => {
    if (preloadedImages.current.has(url)) return;
    
    const img = new Image();
    img.src = url;
    img.onload = () => {
      preloadedImages.current.add(url);
    };
  }, []);

  useEffect(() => {
    const reelsToPreload = reels.slice(activeIndex + 1, activeIndex + 1 + preloadCount);

    reelsToPreload.forEach((reel) => {
      if (reel.hlsUrl) {
        preloadHls(reel.hlsUrl);
      }
      if (reel.thumbnailUrl) {
        preloadThumbnail(reel.thumbnailUrl);
      }
    });
  }, [activeIndex, reels, preloadCount, preloadHls, preloadThumbnail]);

  const preloadReel = useCallback(async (reelId: string) => {
    try {
      const data = await reelsApi.getPreloadData(reelId);
      const preloadData = data as unknown as { hlsUrl: string; thumbnailUrl: string };
      if (preloadData.hlsUrl) {
        preloadHls(preloadData.hlsUrl);
      }
      if (preloadData.thumbnailUrl) {
        preloadThumbnail(preloadData.thumbnailUrl);
      }
    } catch (error) {
      // Ignore errors
    }
  }, [preloadHls, preloadThumbnail]);

  const clearCache = useCallback(() => {
    preloadedUrls.current.clear();
    preloadedImages.current.clear();
  }, []);

  return {
    preloadReel,
    clearCache,
    preloadedCount: preloadedUrls.current.size,
  };
}

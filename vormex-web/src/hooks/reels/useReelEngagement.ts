'use client';

import { useState, useCallback } from 'react';
import { reelsApi, Reel } from '@/lib/api/reels';

interface UseReelEngagementReturn {
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
  savesCount: number;
  toggleLike: () => Promise<void>;
  toggleSave: () => Promise<void>;
  share: (type?: string) => Promise<void>;
  isLiking: boolean;
  isSaving: boolean;
  isSharing: boolean;
}

export function useReelEngagement(reel: Reel): UseReelEngagementReturn {
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [isSaved, setIsSaved] = useState(reel.isSaved);
  const [likesCount, setLikesCount] = useState(reel.likesCount);
  const [savesCount, setSavesCount] = useState(reel.savesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const toggleLike = useCallback(async () => {
    if (isLiking) return;

    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setIsLiking(true);

    try {
      const response = (await reelsApi.toggleLike(reel.id)) as unknown as { liked: boolean; likesCount: number };
      setIsLiked(response.liked);
      setLikesCount(response.likesCount);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  }, [reel.id, isLiked, likesCount, isLiking]);

  const toggleSave = useCallback(async () => {
    if (isSaving) return;

    const prevSaved = isSaved;
    const prevCount = savesCount;

    setIsSaved(!prevSaved);
    setSavesCount(prevSaved ? prevCount - 1 : prevCount + 1);
    setIsSaving(true);

    try {
      const response = (await reelsApi.toggleSave(reel.id)) as unknown as { saved: boolean; savesCount: number };
      setIsSaved(response.saved);
      setSavesCount(response.savesCount);
    } catch (error) {
      console.error('Failed to toggle save:', error);
      setIsSaved(prevSaved);
      setSavesCount(prevCount);
    } finally {
      setIsSaving(false);
    }
  }, [reel.id, isSaved, savesCount, isSaving]);

  const share = useCallback(async (type: string = 'copy_link') => {
    if (isSharing) return;

    setIsSharing(true);

    try {
      const url = `${window.location.origin}/reels/${reel.id}`;

      if (type === 'native' && navigator.share) {
        await navigator.share({
          title: reel.title || 'Check out this reel',
          text: reel.caption || '',
          url,
        });
        await reelsApi.share(reel.id, { shareType: 'external' });
      } else {
        await navigator.clipboard.writeText(url);
        await reelsApi.share(reel.id, { shareType: 'copy_link' });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to share:', error);
      }
    } finally {
      setIsSharing(false);
    }
  }, [reel.id, reel.title, reel.caption, isSharing]);

  return {
    isLiked,
    isSaved,
    likesCount,
    savesCount,
    toggleLike,
    toggleSave,
    share,
    isLiking,
    isSaving,
    isSharing,
  };
}

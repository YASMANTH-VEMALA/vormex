'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useAuthContext } from '@/lib/auth/authContext';
import { cn } from '@/lib/utils';
import { ReelPlayer } from './ReelPlayer';
import { ReelActions } from './ReelActions';
import { ReelInfo } from './ReelInfo';
import { ReelComments } from './ReelComments';
import { ReelShareSheet } from './ReelShareSheet';
import { ReelPoll } from './ReelPoll';
import { ReelQuiz } from './ReelQuiz';
import { ReelCodeSnippet } from './ReelCodeSnippet';
import { reelsApi, Reel } from '@/lib/api/reels';

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
}

export function ReelCard({ reel, isActive, isMuted, onMuteToggle }: ReelCardProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const isAuthor = user?.id === reel.author.id;
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [localReel, setLocalReel] = useState(reel);
  const viewTracked = useRef(false);
  const watchStartTime = useRef<number | null>(null);

  useEffect(() => {
    setLocalReel(reel);
  }, [reel]);

  useEffect(() => {
    if (isActive && !viewTracked.current) {
      watchStartTime.current = Date.now();
    } else if (!isActive && viewTracked.current) {
      viewTracked.current = false;
      watchStartTime.current = null;
    }
  }, [isActive]);

  const handleProgress = useCallback((progress: number, watchTimeMs: number) => {
    if (!viewTracked.current && watchTimeMs >= 3000) {
      viewTracked.current = true;
      reelsApi.trackView(reel.id, {
        watchTimeMs,
        completed: false,
        source: 'feed',
      }).catch(console.error);
    }
  }, [reel.id]);

  const handleComplete = useCallback(() => {
    if (watchStartTime.current) {
      const totalWatchTime = Date.now() - watchStartTime.current;
      reelsApi.trackView(reel.id, {
        watchTimeMs: totalWatchTime,
        completed: true,
        source: 'feed',
      }).catch(console.error);
    }
  }, [reel.id]);

  const handleTap = useCallback(() => {
  }, []);

  const handleDoubleTap = useCallback(async () => {
    if (!localReel.isLiked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);

      try {
        const response = (await reelsApi.toggleLike(reel.id)) as unknown as { liked: boolean; likesCount: number };
        setLocalReel((prev) => ({
          ...prev,
          isLiked: response.liked,
          likesCount: response.likesCount,
        }));
      } catch (error) {
        console.error('Failed to like:', error);
      }
    }
  }, [reel.id, localReel.isLiked]);

  const handleCommentClick = useCallback(() => {
    setShowComments(true);
  }, []);

  const handleShareClick = useCallback(() => {
    setShowShare(true);
  }, []);

  const handleHashtagClick = useCallback((hashtag: string) => {
    router.push(`/reels/hashtag/${hashtag}`);
  }, [router]);

  const handleAudioClick = useCallback(() => {
    if (reel.audio) {
      router.push(`/reels/audio/${reel.audio.id}`);
    }
  }, [router, reel.audio]);

  const handleLikeUpdate = useCallback((liked: boolean, count: number) => {
    setLocalReel((prev) => ({
      ...prev,
      isLiked: liked,
      likesCount: count,
    }));
  }, []);

  const handleSaveUpdate = useCallback((saved: boolean, count: number) => {
    setLocalReel((prev) => ({
      ...prev,
      isSaved: saved,
      savesCount: count,
    }));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this reel?')) return;
    try {
      await reelsApi.deleteReel(reel.id);
      router.push('/reels');
    } catch (error) {
      console.error('Failed to delete reel:', error);
    }
  }, [reel.id, router]);

  return (
    <div className="relative h-full w-full bg-black">
      <ReelPlayer
        hlsUrl={reel.hlsUrl}
        mp4Url={reel.videoUrl}
        thumbnailUrl={reel.thumbnailUrl}
        isActive={isActive}
        isMuted={isMuted}
        onProgress={handleProgress}
        onComplete={handleComplete}
        onTap={handleTap}
        onDoubleTap={handleDoubleTap}
        onMuteToggle={onMuteToggle}
      />

      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart
            className="w-24 h-24 text-red-500 fill-red-500 animate-heart-burst"
          />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex items-end justify-between gap-4">
          <ReelInfo
            reel={localReel}
            onHashtagClick={handleHashtagClick}
            onAudioClick={handleAudioClick}
          />

          <ReelActions
            reel={localReel}
            isMuted={isMuted}
            onMuteToggle={onMuteToggle}
            onCommentClick={handleCommentClick}
            onShareClick={handleShareClick}
            onLikeUpdate={handleLikeUpdate}
            onSaveUpdate={handleSaveUpdate}
            onDelete={handleDelete}
            isAuthor={isAuthor}
          />
        </div>
      </div>

      {localReel.pollQuestion && localReel.pollOptions && (
        <div className="absolute top-1/2 left-4 right-20 -translate-y-1/2">
          <ReelPoll
            reelId={reel.id}
            question={localReel.pollQuestion}
            options={localReel.pollOptions}
            userVotedOption={localReel.userVotedOption}
            endsAt={localReel.pollEndsAt}
          />
        </div>
      )}

      {localReel.quizQuestion && localReel.quizOptions && (
        <div className="absolute top-1/2 left-4 right-20 -translate-y-1/2">
          <ReelQuiz
            reelId={reel.id}
            question={localReel.quizQuestion}
            options={localReel.quizOptions}
          />
        </div>
      )}

      {localReel.codeSnippet && (
        <div className="absolute top-20 left-4 right-20 max-h-[40vh] overflow-auto">
          <ReelCodeSnippet
            code={localReel.codeSnippet}
            language={localReel.codeLanguage}
            fileName={localReel.codeFileName}
          />
        </div>
      )}

      <ReelComments
        reelId={reel.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        authorId={reel.author.id}
      />

      <ReelShareSheet
        reel={localReel}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
    </div>
  );
}

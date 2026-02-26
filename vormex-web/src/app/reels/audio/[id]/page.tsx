'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Music, Loader2, Bookmark, BookmarkCheck, Play } from 'lucide-react';
import { useAudioReels } from '@/hooks/reels';
import { ReelCard } from '@/components/reels';
import { audioApi, Audio } from '@/lib/api/reels';

export default function AudioReelsPage() {
  const params = useParams();
  const router = useRouter();
  const audioId = params.id as string;
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showFeed, setShowFeed] = useState(false);
  const [audio, setAudio] = useState<Audio | null>(null);
  const [audioLoading, setAudioLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  
  const { reels, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useAudioReels(audioId);

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        setAudioLoading(true);
        const data = (await audioApi.getAudio(audioId)) as unknown as Audio;
        setAudio(data);
        setIsSaved(data.isSaved || false);
      } catch (err) {
        console.error('Failed to fetch audio:', err);
      } finally {
        setAudioLoading(false);
      }
    };

    if (audioId) {
      fetchAudio();
    }
  }, [audioId]);

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

  const toggleSave = async () => {
    try {
      const result = (await audioApi.toggleSave(audioId)) as unknown as { saved: boolean };
      setIsSaved(result.saved);
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  if (audioLoading || isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (isError || !audio) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white gap-4">
        <Music className="w-16 h-16 text-gray-500" />
        <p className="text-xl">Audio not found</p>
        <button
          onClick={() => router.push('/reels')}
          className="px-6 py-2 bg-white text-black rounded-full font-medium"
        >
          Go to Reels
        </button>
      </div>
    );
  }

  if (!showFeed) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="pt-20 pb-8 px-6 flex flex-col items-center">
          <div className="w-48 h-48 rounded-xl overflow-hidden mb-6 bg-neutral-800">
            {audio.albumArt ? (
              <Image
                src={audio.albumArt}
                alt={audio.title}
                width={192}
                height={192}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-16 h-16 text-neutral-600" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-center mb-1">{audio.title}</h1>
          <p className="text-white/60 mb-2">{audio.artist}</p>
          
          {audio.genre && (
            <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/80 mb-4">
              {audio.genre}
            </span>
          )}

          <p className="text-white/50 text-sm mb-6">
            {audio.usageCount.toLocaleString()} reels
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => setShowFeed(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition-colors"
            >
              <Play className="w-5 h-5" />
              Watch Reels
            </button>

            <button
              onClick={toggleSave}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors"
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-5 h-5 fill-white" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="w-5 h-5" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>

        {reels.length > 0 && (
          <div className="px-4 pb-8">
            <h2 className="text-lg font-semibold mb-4">Reels with this sound</h2>
            <div className="grid grid-cols-3 gap-1">
              {reels.slice(0, 9).map((reel) => (
                <button
                  key={reel.id}
                  onClick={() => {
                    setActiveIndex(reels.findIndex(r => r.id === reel.id));
                    setShowFeed(true);
                  }}
                  className="aspect-[9/16] bg-neutral-800 rounded overflow-hidden relative group"
                >
                  {reel.thumbnailUrl && (
                    <Image
                      src={reel.thumbnailUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-1 left-1 text-xs text-white font-medium drop-shadow-lg">
                    {reel.viewsCount.toLocaleString()} views
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-black">
      <div className="absolute top-0 left-0 right-0 z-20 pt-4 px-4 pb-2 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFeed(false)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded bg-neutral-800 overflow-hidden flex-shrink-0">
              {audio.albumArt ? (
                <Image
                  src={audio.albumArt}
                  alt={audio.title}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-neutral-600" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-semibold truncate">{audio.title}</h1>
              <p className="text-white/60 text-sm truncate">{audio.artist}</p>
            </div>
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

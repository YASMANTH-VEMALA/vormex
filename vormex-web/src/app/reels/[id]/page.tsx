'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ReelCard } from '@/components/reels';
import { reelsApi, Reel } from '@/lib/api/reels';

export default function SingleReelPage() {
  const params = useParams();
  const router = useRouter();
  const reelId = params.id as string;
  
  const [reel, setReel] = useState<Reel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const fetchReel = async () => {
      try {
        setIsLoading(true);
        const data = (await reelsApi.getReel(reelId)) as unknown as Reel;
        setReel(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch reel:', err);
        setError('Reel not found');
      } finally {
        setIsLoading(false);
      }
    };

    if (reelId) {
      fetchReel();
    }
  }, [reelId]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (error || !reel) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white gap-4">
        <p className="text-xl">{error || 'Reel not found'}</p>
        <button
          onClick={() => router.push('/reels')}
          className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-white/90"
        >
          Go to Reels
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-black">
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </button>

      <ReelCard
        reel={reel}
        isActive={true}
        isMuted={isMuted}
        onMuteToggle={() => setIsMuted(!isMuted)}
      />
    </div>
  );
}

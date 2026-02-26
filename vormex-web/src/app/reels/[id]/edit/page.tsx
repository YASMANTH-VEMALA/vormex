'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ReelEdit } from '@/components/reels';
import { reelsApi, Reel } from '@/lib/api/reels';

export default function EditReelPage() {
  const params = useParams();
  const router = useRouter();
  const reelId = params.id as string;
  const [reel, setReel] = useState<Reel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReel = async () => {
      try {
        const data = (await reelsApi.getReel(reelId)) as unknown as Reel;
        setReel(data);
      } catch (error) {
        console.error('Failed to fetch reel:', error);
      } finally {
        setLoading(false);
      }
    };

    if (reelId) fetchReel();
  }, [reelId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (!reel) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <p>Reel not found</p>
        <button
          onClick={() => router.push('/reels')}
          className="px-6 py-2 bg-white text-black rounded-full"
        >
          Go to Reels
        </button>
      </div>
    );
  }

  return (
    <ReelEdit
      reel={reel}
      isOpen={true}
      onClose={() => router.push(`/reels/${reelId}`)}
      onSave={(updated) => {
        setReel(updated);
        router.push(`/reels/${reelId}`);
      }}
    />
  );
}

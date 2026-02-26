'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Loader2,
  Film,
  MoreVertical,
  Play,
  Trash2,
  Send,
  Edit,
} from 'lucide-react';
import { reelsApi, Reel } from '@/lib/api/reels';

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const response = (await reelsApi.getDrafts()) as unknown as { reels: Reel[] };
        setDrafts(response.reels || []);
      } catch (error) {
        console.error('Failed to fetch drafts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, []);

  const handlePublish = async (reelId: string) => {
    try {
      await reelsApi.publishDraft(reelId);
      setDrafts((prev) => prev.filter((r) => r.id !== reelId));
      router.push(`/reels/${reelId}`);
    } catch (error) {
      console.error('Failed to publish:', error);
    }
    setMenuOpen(null);
  };

  const handleDelete = async (reelId: string) => {
    try {
      await reelsApi.deleteReel(reelId);
      setDrafts((prev) => prev.filter((r) => r.id !== reelId));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
    setMenuOpen(null);
  };

  const handleEdit = (reelId: string) => {
    router.push(`/reels/${reelId}/edit`);
    setMenuOpen(null);
  };

  if (loading) {
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Film className="w-6 h-6" />
              Drafts
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {drafts.length === 0 ? (
          <div className="text-center py-16">
            <Film className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-xl text-white/60 mb-2">No drafts yet</p>
            <p className="text-white/40 text-sm mb-6">
              Save reels as drafts while creating to finish later
            </p>
            <button
              onClick={() => router.push('/reels/create')}
              className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-white/90"
            >
              Create Reel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {drafts.map((reel) => (
              <div
                key={reel.id}
                className="relative aspect-[9/16] bg-neutral-800 rounded-xl overflow-hidden group"
              >
                {reel.thumbnailUrl ? (
                  <Image
                    src={reel.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-12 h-12 text-neutral-600" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white font-medium line-clamp-2 text-sm mb-2">
                    {reel.title || reel.caption || 'Untitled'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePublish(reel.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-white text-black rounded-lg text-sm font-medium"
                    >
                      <Send className="w-4 h-4" />
                      Publish
                    </button>
                    <button
                      onClick={() => setMenuOpen(menuOpen === reel.id ? null : reel.id)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {menuOpen === reel.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(null)}
                    />
                    <div className="absolute right-2 top-14 z-50 bg-neutral-800 rounded-xl shadow-xl py-2 min-w-[140px]">
                      <button
                        onClick={() => handleEdit(reel.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-left"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handlePublish(reel.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-left"
                      >
                        <Send className="w-4 h-4" />
                        Publish
                      </button>
                      <button
                        onClick={() => handleDelete(reel.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-500/20 text-red-400 text-left"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

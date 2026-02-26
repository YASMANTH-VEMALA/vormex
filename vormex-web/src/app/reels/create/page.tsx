'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ReelCreate } from '@/components/reels';

function CreateReelContent() {
  const router = useRouter();
  return <ReelCreate onClose={() => router.push('/reels')} />;
}

export default function CreateReelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}>
      <CreateReelContent />
    </Suspense>
  );
}

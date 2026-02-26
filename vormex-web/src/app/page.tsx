'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Feed } from '@/components/feed';
import { getFeedTheme } from '@/lib/utils/feedTheme';

export default function Home() {
  const [feedTheme, setFeedTheme] = useState<'default' | 'grid'>('default');

  useEffect(() => {
    setFeedTheme(getFeedTheme());
    const handleStorage = () => setFeedTheme(getFeedTheme());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isGrid = feedTheme === 'grid';

  return (
    <ProtectedRoute>
      <div
        className={`min-h-screen ${isGrid ? 'relative' : 'bg-gray-50 dark:bg-neutral-950'}`}
      >
        {isGrid && (
          <>
            {/* Light: sharp grid at top, fades to smooth at bottom */}
            <div
              className="fixed inset-0 -z-10 bg-gray-50 dark:hidden"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
                maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 85%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 85%)',
              }}
            />
            {/* Dark: sharp grid at top, fades to smooth at bottom */}
            <div
              className="fixed inset-0 -z-10 hidden dark:block bg-neutral-950"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
                maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 85%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 85%)',
              }}
            />
          </>
        )}
        <div className={isGrid ? 'relative' : ''}>
          <Feed />
        </div>
      </div>
    </ProtectedRoute>
  );
}

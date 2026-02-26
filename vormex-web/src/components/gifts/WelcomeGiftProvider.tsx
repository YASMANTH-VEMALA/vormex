'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { WelcomeGiftModal } from './WelcomeGiftModal';
import type { GiftVariant } from './GiftCard';

export function WelcomeGiftProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, updateUser } = useAuth();
  const [showGift, setShowGift] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (loading || !isAuthenticated || !user) {
      return;
    }
    if (user.hasClaimedWelcomeGift) {
      setHasChecked(true);
      return;
    }
    setShowGift(true);
    setHasChecked(true);
  }, [user, isAuthenticated, loading]);

  const handleClose = () => {
    setShowGift(false);
  };

  const handleClaimSuccess = (profileRing: GiftVariant) => {
    updateUser({
      ...user!,
      profileRing,
      hasClaimedWelcomeGift: true,
    });
    setShowGift(false);
  };

  return (
    <>
      {children}
      <WelcomeGiftModal
        isOpen={showGift}
        onClose={handleClose}
        onClaimSuccess={handleClaimSuccess}
      />
    </>
  );
}

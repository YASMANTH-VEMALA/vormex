'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GiftCard, type GiftVariant } from './GiftCard';
import { claimWelcomeGift } from '@/lib/api/profile';
import { useAuth } from '@/lib/auth/useAuth';
import { Button } from '@/components/ui/Button';
import './gift-card.css';

interface GiftClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profileRing: GiftVariant) => void;
}

export function GiftClaimModal({ isOpen, onClose, onSuccess }: GiftClaimModalProps) {
  const { user, updateUser } = useAuth();
  const [selectedRing, setSelectedRing] = useState<GiftVariant | null>(null);
  const [applying, setApplying] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);

  const firePartyConfetti = useCallback(() => {
    if (confettiFired) return;
    setConfettiFired(true);

    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0.2, y: 0.8 },
        colors: ['#dd8448', '#3b82f6', '#22c55e', '#eab308'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 0.8, y: 0.8 },
        colors: ['#dd8448', '#3b82f6', '#22c55e', '#eab308'],
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#dd8448', '#3b82f6', '#22c55e', '#eab308', '#ec4899'],
      });
    }, 300);
  }, [confettiFired]);

  useEffect(() => {
    if (isOpen) {
      firePartyConfetti();
    } else {
      setConfettiFired(false);
      setSelectedRing(null);
    }
  }, [isOpen, firePartyConfetti]);

  const handleApply = async () => {
    if (!selectedRing) return;
    setApplying(true);
    try {
      const result = await claimWelcomeGift(selectedRing);
      if (user) {
        updateUser({ ...user, profileRing: result.profileRing ?? selectedRing, hasClaimedWelcomeGift: result.hasClaimedWelcomeGift ?? true });
      }
      onSuccess(selectedRing);
      onClose();
      // Full page navigation ensures auth and profile refetch with latest data
      window.location.href = '/profile';
      return;
    } catch (err) {
      console.error('Failed to claim gift:', err);
      alert('Failed to apply frame. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* SVG Filters for animated cards */}
          <svg className="absolute w-0 h-0" aria-hidden="true">
            <defs>
              <filter
                id="gift-filter-original"
                colorInterpolationFilters="sRGB"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
                <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                  <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>
                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
                <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                  <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>
                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise3" seed="2" />
                <feOffset in="noise3" dx="0" dy="0" result="offsetNoise3">
                  <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>
                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise4" seed="2" />
                <feOffset in="noise4" dx="0" dy="0" result="offsetNoise4">
                  <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>
                <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
                <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
                <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
                <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
              </filter>
              <filter
                id="gift-filter-hue"
                colorInterpolationFilters="sRGB"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="7" />
                <feColorMatrix type="hueRotate" result="pt1">
                  <animate attributeName="values" values="0;360;" dur="0.6s" repeatCount="indefinite" calcMode="paced" />
                </feColorMatrix>
                <feComposite />
                <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="7" seed="5" />
                <feColorMatrix type="hueRotate" result="pt2">
                  <animate attributeName="values" values="0; 333; 199; 286; 64; 168; 256; 157; 360;" dur="5s" repeatCount="indefinite" calcMode="paced" />
                </feColorMatrix>
                <feBlend in="pt1" in2="pt2" mode="normal" result="combinedNoise" />
                <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
              </filter>
            </defs>
          </svg>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Choose Profile Frame</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-neutral-400 mb-6">
              Choose one profile frame to apply to your avatar. It will be visible to everyone who visits your profile!
            </p>
            <div className="flex flex-row gap-6 justify-center items-stretch mb-6 flex-wrap">
              <div className="scale-[0.45] origin-center">
                <GiftCard
                  variant="original"
                  isSelectable
                  selected={selectedRing === 'original'}
                  onClick={() => setSelectedRing('original')}
                />
              </div>
              <div className="scale-[0.45] origin-center">
                <GiftCard
                  variant="hue"
                  isSelectable
                  selected={selectedRing === 'hue'}
                  onClick={() => setSelectedRing('hue')}
                />
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-800"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleApply}
                disabled={!selectedRing || applying}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {applying ? 'Applying...' : 'Apply to Profile'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

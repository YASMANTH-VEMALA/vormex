'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GiftCard, type GiftVariant } from './GiftCard';
import { GiftClaimModal } from './GiftClaimModal';
import { Button } from '@/components/ui/Button';
import './gift-card.css';

interface WelcomeGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimSuccess: (profileRing: GiftVariant) => void;
  hasClaimed?: boolean;
}

const VARIANTS: GiftVariant[] = ['original', 'hue'];

export function WelcomeGiftModal({ isOpen, onClose, onClaimSuccess, hasClaimed }: WelcomeGiftModalProps) {
  const router = useRouter();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [previewVariant] = useState<GiftVariant>(() => VARIANTS[Math.floor(Math.random() * VARIANTS.length)]);

  const handleClaim = () => {
    setShowClaimModal(true);
  };

  const handleClaimSuccess = (profileRing: GiftVariant) => {
    onClaimSuccess(profileRing);
    setShowClaimModal(false);
    onClose();
  };

  if (!isOpen) return null;

  if (hasClaimed) {
    if (showClaimModal) {
      return (
        <GiftClaimModal
          isOpen={true}
          onClose={() => setShowClaimModal(false)}
          onSuccess={(ring) => { onClaimSuccess(ring); setShowClaimModal(false); onClose(); }}
        />
      );
    }
    return (
      <>
        <AnimatePresence>
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <motion.div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="absolute w-0 h-0" aria-hidden="true">
                <defs>
                  <filter id="gift-filter-original" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
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
                  <filter id="gift-filter-hue" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
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
              <h2 className="text-xl font-bold text-white mb-2">Profile Frames</h2>
              <p className="text-neutral-400 mb-6">Choose a frame for your profile picture. The electric card style will appear around your avatar.</p>
              <div className="flex flex-row gap-6 justify-center items-stretch mb-6 flex-wrap">
                <div className="scale-[0.45] origin-center">
                  <GiftCard
                    variant="original"
                    isSelectable
                    selected={false}
                    onClick={() => setShowClaimModal(true)}
                  />
                </div>
                <div className="scale-[0.45] origin-center">
                  <GiftCard
                    variant="hue"
                    isSelectable
                    selected={false}
                    onClick={() => setShowClaimModal(true)}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={onClose} className="border-neutral-600 text-neutral-300 hover:bg-neutral-800">
                  Close
                </Button>
                <Button onClick={() => setShowClaimModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Change Frame
                </Button>
                <Button onClick={() => { onClose(); router.push('/profile'); }} className="bg-neutral-700 hover:bg-neutral-600 text-white">
                  View Profile
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
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
            className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl p-6"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* SVG Filters for animated card */}
            <svg className="absolute w-0 h-0" aria-hidden="true">
              <defs>
                <filter id="gift-filter-original" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
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
                <filter id="gift-filter-hue" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
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
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Vormex!</h2>
              <p className="text-neutral-400">
                You&apos;ve received a profile frame — a glowing ring around your avatar.
              </p>
            </div>
            <div className="flex justify-center mb-6 scale-[0.4] origin-center">
              <GiftCard variant={previewVariant} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-800"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleClaim}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold"
              >
                Claim Gift
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <GiftClaimModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onSuccess={handleClaimSuccess}
      />
    </>
  );
}

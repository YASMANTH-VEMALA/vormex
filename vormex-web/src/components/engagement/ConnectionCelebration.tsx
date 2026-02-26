'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Flame, Zap } from 'lucide-react';
import { getConnectionCelebration, type CelebrationData } from '@/lib/api/engagement';

/**
 * ConnectionCelebration - Enhanced connection confirmation overlay
 * Supports confetti animation and streak reward display
 */

interface ConnectionCelebrationProps {
  connectionId: string | null;
  onClose: () => void;
}

export default function ConnectionCelebration({ connectionId, onClose }: ConnectionCelebrationProps) {
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  const fireConfetti = useCallback(async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      // Burst from both sides
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.25, y: 0.6 },
        colors: ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'],
      });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.75, y: 0.6 },
        colors: ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'],
      });
    } catch {
      // canvas-confetti not available, skip silently
    }
  }, []);

  useEffect(() => {
    if (!connectionId) return;

    const fetchCelebration = async () => {
      try {
        const data = await getConnectionCelebration(connectionId);
        if (data) {
          setCelebration(data);
          if (data.showConfetti) {
            setTimeout(fireConfetti, 300);
          }
          setTimeout(() => {
            onClose();
          }, 5000);
        }
      } catch (error) {
        console.error('Failed to fetch celebration:', error);
      }
    };

    fetchCelebration();
  }, [connectionId, onClose, fireConfetti]);

  if (!connectionId || !celebration) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-neutral-900 rounded-xl p-6 max-w-xs w-full mx-4 shadow-lg border border-gray-200 dark:border-neutral-800 text-center relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-0.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-300 dark:text-neutral-500" />
          </button>

          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
            className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center"
          >
            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
          </motion.div>

          {/* Profile */}
          <div className="flex items-center justify-center mb-3">
            {celebration.otherUser.profileImage ? (
              <img
                src={celebration.otherUser.profileImage}
                alt={celebration.otherUser.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-neutral-800 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-gray-500 dark:text-neutral-400 text-lg font-semibold border-2 border-white dark:border-neutral-800 shadow-sm">
                {celebration.otherUser.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Message */}
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            {celebration.celebrationMessage}
          </h2>

          {celebration.mutualConnections > 0 && (
            <p className="text-xs text-gray-400 dark:text-neutral-500 mb-3">
              {celebration.mutualConnections} mutual connection{celebration.mutualConnections > 1 ? 's' : ''}
            </p>
          )}

          {/* Streak & reward info */}
          {celebration.showConfetti && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-3 mb-3 px-3 py-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg"
            >
              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <Flame className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Streak extended!</span>
              </div>
            </motion.div>
          )}

          <button
            onClick={onClose}
            className="mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors"
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

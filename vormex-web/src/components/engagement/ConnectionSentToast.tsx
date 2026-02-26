'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface ConnectionSentToastProps {
  show: boolean;
  recipientName?: string;
  onClose: () => void;
}

/**
 * ConnectionSentToast - Animated toast that appears when a connection request is sent
 * Provides satisfying visual feedback (the "Reward" in the Habit Loop)
 */
export default function ConnectionSentToast({ show, recipientName, onClose }: ConnectionSentToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose(), 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 rounded-xl px-5 py-3 shadow-lg border border-gray-200 dark:border-neutral-700">
            {/* Animated checkmark circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.15 }}
              className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0"
            >
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" strokeWidth={3} />
              </motion.div>
            </motion.div>

            {/* Text */}
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Connection request sent!
              </p>
              {recipientName && (
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                  {recipientName} will be notified
                </p>
              )}
            </div>

            {/* Decorative sparkle dots */}
            {[...Array(3)].map((_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
                transition={{
                  delay: 0.4 + i * 0.15,
                  duration: 0.6,
                  ease: 'easeOut',
                }}
                className="absolute w-1.5 h-1.5 rounded-full bg-blue-400"
                style={{
                  top: `${15 + i * 20}%`,
                  right: `${5 + i * 8}%`,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

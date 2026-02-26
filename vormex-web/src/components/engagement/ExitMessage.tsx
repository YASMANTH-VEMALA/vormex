'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getSessionSummary, type SessionSummary } from '@/lib/api/engagement';

/**
 * ExitMessage - Clean toast-style session summary
 * Subtle, professional design that doesn't feel intrusive
 */
export default function ExitMessage() {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showExitMessage = useCallback(async () => {
    try {
      const data = await getSessionSummary();
      setSummary(data);
      setIsVisible(true);
    } catch (error) {
      console.error('Failed to fetch session summary:', error);
    }
  }, []);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        showExitMessage();
      }
    };

    const resetInactivity = () => {
      clearTimeout(inactivityTimer);
      setIsVisible(false);
      inactivityTimer = setTimeout(() => {
        showExitMessage();
      }, 5 * 60 * 1000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousemove', resetInactivity);
    document.addEventListener('touchstart', resetInactivity);

    resetInactivity();

    return () => {
      clearTimeout(inactivityTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mousemove', resetInactivity);
      document.removeEventListener('touchstart', resetInactivity);
    };
  }, [showExitMessage]);

  if (!summary) return null;

  const hasStats = summary.connectionsAccepted > 0 || summary.newPosts > 0 || summary.messagesCount > 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
        >
          <div className="bg-white dark:bg-neutral-900 rounded-xl px-4 py-3.5 shadow-lg border border-gray-200 dark:border-neutral-700 relative">
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-2.5 right-2.5 p-0.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-300 dark:text-neutral-500" />
            </button>

            <p className="text-sm text-gray-900 dark:text-white pr-6 leading-relaxed">
              {summary.message}
            </p>

            {hasStats && (
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-neutral-500">
                {summary.connectionsAccepted > 0 && (
                  <span>{summary.connectionsAccepted} connection{summary.connectionsAccepted > 1 ? 's' : ''}</span>
                )}
                {summary.newPosts > 0 && (
                  <span>{summary.newPosts} post{summary.newPosts > 1 ? 's' : ''}</span>
                )}
                {summary.messagesCount > 0 && (
                  <span>{summary.messagesCount} message{summary.messagesCount > 1 ? 's' : ''}</span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

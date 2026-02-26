'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, BellRing } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationPromptProps {
  userId: string | undefined;
}

/**
 * NotificationPrompt — asks user to enable push notifications
 * Shows after 3rd visit if not already granted/dismissed.
 * Also renders foreground notification toasts.
 */
export function NotificationPrompt({ userId }: NotificationPromptProps) {
  const {
    isSupported,
    isPermissionGranted,
    isTokenRegistered,
    isLoading,
    foregroundNotification,
    requestPermission,
    dismissNotification,
  } = usePushNotifications(userId);

  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!isSupported || isPermissionGranted || !userId) return;

    // Show prompt after 3rd visit or 10s delay
    const dismissed = localStorage.getItem('push_prompt_dismissed');
    if (dismissed) return;

    const visits = parseInt(localStorage.getItem('visit_count') || '0', 10) + 1;
    localStorage.setItem('visit_count', visits.toString());

    if (visits >= 3) {
      const timer = setTimeout(() => setShowPrompt(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, isPermissionGranted, userId]);

  const handleEnable = async () => {
    await requestPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('push_prompt_dismissed', new Date().toISOString());
  };

  return (
    <>
      {/* Permission Prompt */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <BellRing className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Stay in the loop 🔔
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                    Get notified when someone views your profile, accepts your connection, or when your streak is at risk.
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Not now
                </button>
                <button
                  onClick={handleEnable}
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {isLoading ? 'Enabling...' : 'Enable'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Foreground Notification Toast */}
      <AnimatePresence>
        {foregroundNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-[100] w-80 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden cursor-pointer"
            onClick={dismissNotification}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {foregroundNotification.notification?.title || 'Vormex'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 line-clamp-2 mt-0.5">
                    {foregroundNotification.notification?.body || ''}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification();
                  }}
                  className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>
            {/* Auto-dismiss progress bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-0.5 bg-blue-500"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

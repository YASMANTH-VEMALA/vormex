'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Info } from 'lucide-react';
import { getConnectionLimit, type ConnectionLimit } from '@/lib/api/engagement';

/**
 * ConnectionLimitBanner - Subtle info bar for daily connection limits
 * Professional, non-alarming design
 */
export default function ConnectionLimitBanner() {
  const [limit, setLimit] = useState<ConnectionLimit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLimit = async () => {
      try {
        const data = await getConnectionLimit();
        setLimit(data);
      } catch (error) {
        console.error('Failed to fetch connection limit:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLimit();
  }, []);

  if (loading || !limit) return null;
  if (limit.remaining > 5) return null;

  const isDepleted = limit.remaining === 0;

  const resetTime = new Date(limit.resetsAt);
  const now = new Date();
  const hoursUntilReset = Math.max(1, Math.ceil((resetTime.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800"
    >
      <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <p className="flex-1 text-xs text-gray-600 dark:text-neutral-400">
        {isDepleted
          ? 'Daily connection limit reached'
          : `${limit.remaining} connection request${limit.remaining !== 1 ? 's' : ''} remaining today`}
      </p>
      {isDepleted && (
        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-neutral-500 flex-shrink-0">
          <Clock className="w-3 h-3" />
          Resets in {hoursUntilReset}h
        </span>
      )}
    </motion.div>
  );
}

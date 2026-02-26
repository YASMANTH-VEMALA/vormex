'use client';

import { motion } from 'framer-motion';
import { X, Eye } from 'lucide-react';
import Link from 'next/link';
import type { ViewerData } from '@/lib/api/variable-rewards';

interface SocialProofCardProps {
  viewers: ViewerData[];
  onDismiss: () => void;
}

/**
 * SocialProofCard — "People are checking you out!" viewer notification
 * Purple gradient with overlapping viewer avatars
 */
export function SocialProofCard({ viewers, onDismiss }: SocialProofCardProps) {
  if (!viewers.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="relative overflow-hidden rounded-xl border border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
            <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
              {viewers.length} Profile View{viewers.length > 1 ? 's' : ''} 👀
            </p>
            <p className="text-[11px] text-purple-600/70 dark:text-purple-400/70">
              People are interested in you
            </p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
          <X className="w-4 h-4 text-purple-400" />
        </button>
      </div>

      {/* Overlapping avatars */}
      <div className="px-4 py-3">
        <div className="flex items-center">
          {viewers.slice(0, 4).map((viewer, i) => (
            <motion.div
              key={viewer.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
              style={{ marginLeft: i === 0 ? 0 : -8, zIndex: viewers.length - i }}
            >
              <Link href={`/profile/${viewer.username}`}>
                {viewer.profileImage ? (
                  <img
                    src={viewer.profileImage}
                    alt={viewer.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-neutral-900"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300 text-sm font-semibold ring-2 ring-white dark:ring-neutral-900">
                    {viewer.name.charAt(0)}
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
          {viewers.length > 4 && (
            <div
              className="relative w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center ring-2 ring-white dark:ring-neutral-900"
              style={{ marginLeft: -8, zIndex: 0 }}
            >
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-300">
                +{viewers.length - 4}
              </span>
            </div>
          )}
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-neutral-300">
              <span className="font-semibold">{viewers[0].name}</span>
              {viewers.length > 1 && (
                <span className="text-gray-500 dark:text-neutral-400">
                  {' '}and {viewers.length - 1} other{viewers.length > 2 ? 's' : ''}
                </span>
              )}
            </p>
            {viewers[0].college && (
              <p className="text-[11px] text-purple-500 dark:text-purple-400 truncate">{viewers[0].college}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <Link
          href="/profile"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          See All Views
        </Link>
      </div>
    </motion.div>
  );
}

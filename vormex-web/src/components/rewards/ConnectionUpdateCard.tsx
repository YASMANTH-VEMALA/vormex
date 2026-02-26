'use client';

import { motion } from 'framer-motion';
import { X, UserCheck, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import type { ConnectionUpdateData } from '@/lib/api/variable-rewards';

interface ConnectionUpdateCardProps {
  data: ConnectionUpdateData;
  onDismiss: () => void;
}

/**
 * ConnectionUpdateCard — Recent accepts + new requests
 * Blue gradient with overlapping user avatars
 */
export function ConnectionUpdateCard({ data, onDismiss }: ConnectionUpdateCardProps) {
  if (!data.hasUpdates) return null;

  const totalUpdates = data.recentAccepts.length + data.newRequests.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/40"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Connection Updates 🤝
            </p>
            <p className="text-[11px] text-blue-600/70 dark:text-blue-400/70">
              {totalUpdates} new update{totalUpdates > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
          <X className="w-4 h-4 text-blue-400" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Recent Accepts */}
        {data.recentAccepts.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <UserCheck className="w-3.5 h-3.5 text-green-500" />
              <p className="text-xs font-medium text-green-600 dark:text-green-400">
                {data.recentAccepts.length} accepted your request
              </p>
            </div>
            <div className="flex items-center">
              {data.recentAccepts.slice(0, 3).map((user, i) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className="relative"
                  style={{ marginLeft: i === 0 ? 0 : -6, zIndex: 3 - i }}
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-neutral-900"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center text-green-700 dark:text-green-300 text-xs font-semibold ring-2 ring-white dark:ring-neutral-900">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </Link>
              ))}
              <p className="ml-2 text-xs text-gray-600 dark:text-neutral-400">
                {data.recentAccepts[0].name}
                {data.recentAccepts.length > 1 && ` +${data.recentAccepts.length - 1}`}
              </p>
            </div>
          </div>
        )}

        {/* New Requests */}
        {data.newRequests.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <UserPlus className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {data.newRequests.length} want to connect
              </p>
            </div>
            <div className="flex items-center">
              {data.newRequests.slice(0, 3).map((user, i) => (
                <div
                  key={user.id}
                  className="relative"
                  style={{ marginLeft: i === 0 ? 0 : -6, zIndex: 3 - i }}
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-neutral-900"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs font-semibold ring-2 ring-white dark:ring-neutral-900">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
              <p className="ml-2 text-xs text-gray-600 dark:text-neutral-400">
                {data.newRequests[0].name}
                {data.newRequests.length > 1 && ` +${data.newRequests.length - 1}`}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <Link
          href="/connections"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Users className="w-4 h-4" />
          View All
        </Link>
      </div>
    </motion.div>
  );
}

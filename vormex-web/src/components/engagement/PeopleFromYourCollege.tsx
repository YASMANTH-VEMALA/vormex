'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ChevronRight, Check, Loader2 } from 'lucide-react';
import { getPeopleFromSameCollege } from '@/lib/api/people';
import { sendConnectionRequest } from '@/lib/api/connections';
import Link from 'next/link';
import type { PersonCard } from '@/lib/api/people';

/**
 * PeopleFromYourCollege - "People from your college" card for home feed.
 * Shows users from the same campus (case-insensitive, e.g. NIAT / niat).
 */
export default function PeopleFromYourCollege() {
  const [people, setPeople] = useState<PersonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const res = await getPeopleFromSameCollege(8);
        setPeople(res.people ?? []);
      } catch (error) {
        console.error('Failed to fetch people from college:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPeople();
  }, []);

  const handleConnect = async (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (connectingIds.has(userId) || connectedIds.has(userId)) return;

    setConnectingIds((prev) => new Set([...prev, userId]));
    try {
      await sendConnectionRequest(userId);
      setConnectedIds((prev) => new Set([...prev, userId]));
    } catch (error) {
      console.error('Failed to send connection request:', error);
    } finally {
      setConnectingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden animate-pulse">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
          <div className="h-4 w-44 bg-gray-200 dark:bg-neutral-700 rounded" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-neutral-800">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
                <div className="h-3 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
              </div>
              <div className="h-8 w-20 bg-gray-200 dark:bg-neutral-700 rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
        <div className="h-10 bg-gray-100 dark:bg-neutral-800/50" />
      </div>
    );
  }

  if (people.length === 0) return null;

  const ConnectButton = ({ userId }: { userId: string }) => {
    const isConnecting = connectingIds.has(userId);
    const isConnected = connectedIds.has(userId);

    if (isConnected) {
      return (
        <span className="flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-full flex-shrink-0">
          <Check className="w-3 h-3" />
          Sent
        </span>
      );
    }

    return (
      <button
        onClick={(e) => handleConnect(e, userId)}
        disabled={isConnecting}
        className="flex items-center gap-1 px-3 py-1.5 border border-blue-500 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex-shrink-0 disabled:opacity-50"
      >
        {isConnecting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <UserPlus className="w-3 h-3" />
        )}
        Connect
      </button>
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          People from your college
        </h3>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-neutral-800">
        {people.map((person) => (
          <Link
            key={person.id}
            href={`/profile/${person.username}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            {person.profileImage ? (
              <img
                src={person.profileImage}
                alt={person.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-gray-500 dark:text-neutral-400 text-sm font-semibold flex-shrink-0">
                {person.name.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {person.name}
                </p>
                {person.isOnline && (
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                )}
              </div>
              {person.headline && (
                <p className="text-xs text-gray-500 dark:text-neutral-400 truncate mt-0.5">
                  {person.headline}
                </p>
              )}
              {person.college && (
                <p className="text-xs text-gray-400 dark:text-neutral-500 truncate mt-0.5">
                  {person.college}
                </p>
              )}
            </div>

            <ConnectButton userId={person.id} />
          </Link>
        ))}
      </div>

      <Link
        href="/find-people?tab=college"
        className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors border-t border-gray-100 dark:border-neutral-800"
      >
        See all from your campus <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

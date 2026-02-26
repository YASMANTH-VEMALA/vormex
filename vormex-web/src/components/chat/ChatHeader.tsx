'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';
import ReportModal from '@/components/reports/ReportModal';
import { MoreVertical, Flag, UserX, Bell, BellOff } from 'lucide-react';

interface ChatHeaderProps {
  user: {
    id: string;
    name: string;
    username: string;
    profileImage?: string | null;
    isOnline?: boolean;
    lastActiveAt?: string | null;
  };
  conversationId: string;
  onBack?: () => void;
  onInfo?: () => void;
}

export default function ChatHeader({ user, conversationId, onBack, onInfo }: ChatHeaderProps) {
  const [isOnline, setIsOnline] = useState(user.isOnline || false);
  const [lastActive, setLastActive] = useState(user.lastActiveAt);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for online/offline status
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleOnline = (data: { userId: string }) => {
      if (data.userId === user.id) {
        setIsOnline(true);
      }
    };

    const handleOffline = (data: { userId: string }) => {
      if (data.userId === user.id) {
        setIsOnline(false);
        setLastActive(new Date().toISOString());
      }
    };

    // Handle immediate status update when joining chat
    const handleStatus = (data: { userId: string; isOnline: boolean }) => {
      if (data.userId === user.id) {
        setIsOnline(data.isOnline);
        if (!data.isOnline) {
          setLastActive(new Date().toISOString());
        }
      }
    };

    socket.on('user:online', handleOnline);
    socket.on('user:offline', handleOffline);
    socket.on('user:status', handleStatus);

    return () => {
      socket.off('user:online', handleOnline);
      socket.off('user:offline', handleOffline);
      socket.off('user:status', handleStatus);
    };
  }, [user.id]);

  // Update initial state when user prop changes
  useEffect(() => {
    setIsOnline(user.isOnline || false);
    setLastActive(user.lastActiveAt);
  }, [user.isOnline, user.lastActiveAt]);

  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Back button (mobile) */}
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full md:hidden"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Avatar */}
      <Link href={`/profile/${user.username}`} className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        {/* Online indicator */}
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
        )}
      </Link>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <Link 
          href={`/profile/${user.username}`}
          className="font-semibold text-gray-900 dark:text-white hover:underline truncate block"
        >
          {user.name}
        </Link>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isOnline ? (
            <span className="text-green-600 dark:text-green-400">Online</span>
          ) : lastActive ? (
            `Last seen ${formatDistanceToNow(new Date(lastActive), { addSuffix: true })}`
          ) : (
            `@${user.username}`
          )}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Voice call (future) */}
        <button
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          title="Voice call (coming soon)"
          disabled
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>

        {/* Video call (future) */}
        <button
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          title="Video call (coming soon)"
          disabled
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Info button */}
        {onInfo && (
          <button
            onClick={onInfo}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title="Chat info"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}

        {/* More options menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            title="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
              <button
                onClick={() => {
                  setShowReportModal(true);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Flag className="w-4 h-4" />
                Report User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="chat"
        targetId={conversationId}
        targetName={user.name}
        conversationId={conversationId}
        reportedUserId={user.id}
      />
    </div>
  );
}

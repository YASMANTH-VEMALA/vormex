'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/useAuth';
import { ChatList } from '@/components/chat';
import { initializeSocket, getSocket } from '@/lib/socket';
import { getUnreadCount, Conversation } from '@/lib/api/chat';
import Link from 'next/link';

interface MessagesLayoutProps {
  children: React.ReactNode;
}

export default function MessagesLayout({ children }: MessagesLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Extract conversation ID from pathname
  const conversationId = pathname?.startsWith('/messages/') 
    ? pathname.split('/messages/')[1] 
    : undefined;
  const isConversationView = !!conversationId;

  // Initialize socket and fetch unread count
  useEffect(() => {
    if (user?.id) {
      initializeSocket();
      
      // Fetch unread count
      getUnreadCount().then(res => {
        setUnreadCount(res.unreadCount);
      }).catch(console.error);
    }
  }, [user?.id]);

  // Listen for new message notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNotification = () => {
      getUnreadCount().then(res => {
        setUnreadCount(res.unreadCount);
      }).catch(console.error);
    };

    socket.on('chat:notification', handleNotification);

    return () => {
      socket.off('chat:notification', handleNotification);
    };
  }, []);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    router.push(`/messages/${conv.id}`, { scroll: false });
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          {/* h-screen minus bottom nav height (pb-24 = 96px) */}
          <div className="flex h-[calc(100vh-96px)]">
            {/* Sidebar - Chat List - ALWAYS MOUNTED, never remounts */}
            <div className={`${isConversationView ? 'hidden md:flex' : 'flex'} w-full md:w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col`}>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Messages
                    {unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-sm rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </h1>
                  <Link
                    href="/find-people"
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                    title="New conversation"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Link>
                </div>
                
                {/* Search */}
                <div className="mt-4 relative">
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-800 rounded-full border-0 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500"
                  />
                  <svg 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Chat list - this component stays mounted across route changes */}
              <ChatList 
                selectedConversationId={conversationId}
                onSelectConversation={handleSelectConversation}
                currentUserId={user?.id}
              />
            </div>

            {/* Main Content Area - children will be the page content */}
            <div className={`${isConversationView ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white dark:bg-gray-900 h-full overflow-hidden`}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

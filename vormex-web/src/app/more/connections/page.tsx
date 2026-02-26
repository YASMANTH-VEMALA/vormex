'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Send,
  Check,
  X,
  Loader2,
  Search,
  MessageSquare,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  getConnections,
  getPendingRequests,
  getSentRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  type Connection,
  type ConnectionsResponse,
} from '@/lib/api/connections';
import { cn } from '@/lib/utils';

type Tab = 'connections' | 'pending' | 'sent';

export default function ConnectionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'connections') {
        const data = await getConnections(1, 50);
        setConnections(data.connections || []);
      } else if (activeTab === 'pending') {
        const data = await getPendingRequests(1, 50);
        setPendingRequests(data.connections || []);
        setPendingCount(data.total || 0);
      } else if (activeTab === 'sent') {
        const data = await getSentRequests(1, 50);
        setSentRequests(data.connections || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Reset to empty arrays on error
      if (activeTab === 'connections') setConnections([]);
      else if (activeTab === 'pending') setPendingRequests([]);
      else if (activeTab === 'sent') setSentRequests([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Fetch pending count on mount
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const data = await getPendingRequests(1, 1);
        setPendingCount(data.total);
      } catch (error) {
        console.error('Failed to fetch pending count:', error);
      }
    };
    fetchPendingCount();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle accept connection request
  const handleAccept = async (connectionId: string) => {
    setActionLoading(connectionId);
    try {
      await acceptConnectionRequest(connectionId);
      setPendingRequests(prev => prev.filter(c => c.id !== connectionId));
      setPendingCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to accept request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject connection request
  const handleReject = async (connectionId: string) => {
    setActionLoading(connectionId);
    try {
      await rejectConnectionRequest(connectionId);
      setPendingRequests(prev => prev.filter(c => c.id !== connectionId));
      setPendingCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle cancel sent request
  const handleCancel = async (connectionId: string) => {
    setActionLoading(connectionId);
    try {
      await cancelConnectionRequest(connectionId);
      setSentRequests(prev => prev.filter(c => c.id !== connectionId));
    } catch (error) {
      console.error('Failed to cancel request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle remove connection
  const handleRemove = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return;
    setActionLoading(connectionId);
    try {
      await removeConnection(connectionId);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
    } catch (error) {
      console.error('Failed to remove connection:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter connections based on search
  const filteredConnections = connections.filter(c =>
    c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    {
      id: 'pending' as Tab,
      label: 'Requests',
      icon: UserPlus,
      count: pendingCount,
    },
    {
      id: 'connections' as Tab,
      label: 'Connections',
      icon: Users,
    },
    {
      id: 'sent' as Tab,
      label: 'Sent',
      icon: Send,
    },
  ];

  const renderConnectionCard = (connection: Connection, type: 'connection' | 'pending' | 'sent') => {
    const isLoading = actionLoading === connection.id;
    const profileUrl = `/profile/${connection.user.id}`;
    
    return (
      <motion.div
        key={connection.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800"
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Link href={profileUrl} className="cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity">
              {connection.user.profileImage ? (
                <img
                  src={connection.user.profileImage}
                  alt={connection.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {connection.user.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={profileUrl} className="cursor-pointer">
              <h3 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
                {connection.user.name}
              </h3>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              @{connection.user.username || 'user'}
            </p>
            {connection.user.headline && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                {connection.user.headline}
              </p>
            )}
            {connection.message && type === 'pending' && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic bg-gray-50 dark:bg-neutral-800 p-2 rounded-lg">
                "{connection.message}"
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              <Clock className="w-3 h-3 inline mr-1" />
              {new Date(connection.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {type === 'pending' && (
              <>
                <button
                  onClick={() => handleAccept(connection.id)}
                  disabled={isLoading}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full transition-colors"
                  title="Accept"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleReject(connection.id)}
                  disabled={isLoading}
                  className="p-2 bg-gray-200 hover:bg-gray-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
                  title="Decline"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}

            {type === 'sent' && (
              <button
                onClick={() => handleCancel(connection.id)}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-300 dark:border-neutral-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Cancel'
                )}
              </button>
            )}

            {type === 'connection' && (
              <>
                <Link
                  href={`/messages?userId=${connection.user.id}`}
                  className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full transition-colors"
                  title="Message"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => handleRemove(connection.id)}
                  disabled={isLoading}
                  className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Remove connection"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <UserX className="w-5 h-5" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderEmptyState = (type: Tab) => {
    const states = {
      pending: {
        icon: UserPlus,
        title: 'No pending requests',
        description: 'When someone sends you a connection request, it will appear here.',
      },
      connections: {
        icon: Users,
        title: 'No connections yet',
        description: 'Start connecting with other developers to grow your network!',
      },
      sent: {
        icon: Send,
        title: 'No sent requests',
        description: 'Connection requests you send will appear here.',
      },
    };

    const state = states[type];
    const Icon = state.icon;

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {state.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          {state.description}
        </p>
        {type === 'connections' && (
          <Link
            href="/find-people"
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Find People
          </Link>
        )}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/more')}
                className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Connections
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors',
                      isActive
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search (for connections tab) */}
        {activeTab === 'connections' && (
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search connections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-neutral-800 border border-transparent focus:border-blue-500 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {activeTab === 'pending' && (
                  (pendingRequests?.length || 0) > 0 ? (
                    pendingRequests.map(c => renderConnectionCard(c, 'pending'))
                  ) : (
                    renderEmptyState('pending')
                  )
                )}

                {activeTab === 'connections' && (
                  (filteredConnections?.length || 0) > 0 ? (
                    filteredConnections.map(c => renderConnectionCard(c, 'connection'))
                  ) : searchQuery ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No connections match your search
                    </div>
                  ) : (
                    renderEmptyState('connections')
                  )
                )}

                {activeTab === 'sent' && (
                  (sentRequests?.length || 0) > 0 ? (
                    sentRequests.map(c => renderConnectionCard(c, 'sent'))
                  ) : (
                    renderEmptyState('sent')
                  )
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

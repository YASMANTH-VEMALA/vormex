'use client';

import { useState, useEffect, useCallback, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Users,
  UserCheck,
  Loader2,
  Search,
  MessageSquare,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUserConnections, type Connection } from '@/lib/api/connections';
import { getFollowers, getFollowing, type FollowWithUser } from '@/lib/api/follow';
import { getProfile } from '@/lib/api/profile';
import { cn } from '@/lib/utils';

type Tab = 'connections' | 'followers' | 'following';

interface UserInfo {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
}

function UserNetworkPageInner({ userId }: { userId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'connections';
  
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [followers, setFollowers] = useState<FollowWithUser[]>([]);
  const [following, setFollowing] = useState<FollowWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const profile = await getProfile(userId);
        setUserInfo({
          id: profile.user.id,
          name: profile.user.name,
          username: profile.user.username,
          profileImage: profile.user.avatar,
        });
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
    fetchUserInfo();
  }, [userId]);

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'connections') {
        const data = await getUserConnections(userId, 1, 50);
        setConnections(data.connections || []);
      } else if (activeTab === 'followers') {
        const data = await getFollowers(userId, 1, 50);
        setFollowers(data.followers || []);
      } else if (activeTab === 'following') {
        const data = await getFollowing(userId, 1, 50);
        setFollowing(data.following || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (activeTab === 'connections') setConnections([]);
      else if (activeTab === 'followers') setFollowers([]);
      else if (activeTab === 'following') setFollowing([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL when tab changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.push(`/profile/${userId}/network?tab=${tab}`, { scroll: false });
  };

  // Filter data based on search
  const filteredConnections = connections.filter(
    (c) =>
      c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowers = followers.filter(
    (f) =>
      f.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowing = following.filter(
    (f) =>
      f.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'connections' as const, label: 'Connections', icon: Users },
    { id: 'followers' as const, label: 'Followers', icon: UserCheck },
    { id: 'following' as const, label: 'Following', icon: UserCheck },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {userInfo?.name || 'User'}'s Network
              </h1>
              {userInfo?.username && (
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  @{userInfo.username}
                </p>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-neutral-800 rounded-lg mb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all',
                    isActive
                      ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'connections' && (
                  <div className="space-y-2">
                    {filteredConnections.length === 0 ? (
                      <EmptyState
                        icon={Users}
                        title="No connections"
                        description="This user doesn't have any connections yet."
                      />
                    ) : (
                      filteredConnections.map((connection) => (
                        <UserCard
                          key={connection.id}
                          user={connection.user}
                          subtitle={connection.user.headline || connection.user.college}
                        />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'followers' && (
                  <div className="space-y-2">
                    {filteredFollowers.length === 0 ? (
                      <EmptyState
                        icon={UserCheck}
                        title="No followers"
                        description="This user doesn't have any followers yet."
                      />
                    ) : (
                      filteredFollowers.map((follow) => (
                        <UserCard
                          key={follow.id}
                          user={follow.user}
                          subtitle={follow.user.headline || follow.user.college}
                        />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'following' && (
                  <div className="space-y-2">
                    {filteredFollowing.length === 0 ? (
                      <EmptyState
                        icon={UserCheck}
                        title="Not following anyone"
                        description="This user isn't following anyone yet."
                      />
                    ) : (
                      filteredFollowing.map((follow) => (
                        <UserCard
                          key={follow.id}
                          user={follow.user}
                          subtitle={follow.user.headline || follow.user.college}
                        />
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function UserNetworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = use(params);
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    }>
      <UserNetworkPageInner userId={userId} />
    </Suspense>
  );
}

/* ════════════════════════════════════════════════════════════════════════════════
   USER CARD COMPONENT
════════════════════════════════════════════════════════════════════════════════ */
interface UserCardProps {
  user: {
    id: string;
    username: string;
    name: string;
    profileImage: string | null;
    headline?: string | null;
    college?: string | null;
    isOnline?: boolean;
  };
  subtitle?: string | null;
}

function UserCard({ user, subtitle }: UserCardProps) {
  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
    >
      {/* Avatar */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-neutral-800">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-medium text-gray-500 dark:text-neutral-400">
              {user.name?.charAt(0)}
            </div>
          )}
        </div>
        {user.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 dark:text-white truncate">
          {user.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-neutral-400 truncate">
          @{user.username}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-neutral-400 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════════════════════════════════════════
   EMPTY STATE COMPONENT
════════════════════════════════════════════════════════════════════════════════ */
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-neutral-400">
        {description}
      </p>
    </div>
  );
}

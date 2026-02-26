'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Linkedin,
  Github,
  Globe,
  Edit2,
  UserPlus,
  UserMinus,
  UserCheck,
  MessageCircle,
  CheckCircle2,
  Share2,
  MoreHorizontal,
  Camera,
  Briefcase,
  GraduationCap,
  ExternalLink,
  Copy,
  Check,
  Clock,
  X,
  Users,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getOrCreateConversation } from '@/lib/api/chat';
import { getConnectionStatus, sendConnectionRequest, cancelConnectionRequest, removeConnection, acceptConnectionRequest } from '@/lib/api/connections';
import { followUser, unfollowUser, getFollowStatus, getMutualInfo, type MutualInfo } from '@/lib/api/follow';
import ConnectionSentToast from '@/components/engagement/ConnectionSentToast';
import type { ProfileUser, ProfileStats } from '@/types/profile';

interface ProfileHeaderProps {
  user: ProfileUser;
  stats: ProfileStats;
  isOwner: boolean;
  onEditProfile?: () => void;
  onEditBanner?: () => void;
  onEditAvatar?: () => void;
}

export function ProfileHeader({
  user,
  stats,
  isOwner,
  onEditProfile,
  onEditBanner,
  onEditAvatar,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // Connection & Follow state
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'connected' | 'blocked'>('none');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedBy, setIsFollowedBy] = useState(false);
  const [mutualInfo, setMutualInfo] = useState<MutualInfo | null>(null);
  const [loadingConnection, setLoadingConnection] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [showConnectMenu, setShowConnectMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Fetch connection and follow status on mount
  useEffect(() => {
    if (!isOwner) {
      fetchRelationshipStatus();
    }
  }, [user.id, isOwner]);

  const fetchRelationshipStatus = async () => {
    try {
      // Use allSettled so one failing API (e.g. DB unreachable) doesn't break the whole profile
      const [connResult, followResult, mutualResult] = await Promise.allSettled([
        getConnectionStatus(user.id),
        getFollowStatus(user.id),
        getMutualInfo(user.id),
      ]);

      if (connResult.status === 'fulfilled') {
        setConnectionStatus(connResult.value.status);
        setConnectionId(connResult.value.connectionId || null);
      } else {
        console.warn('Failed to fetch connection status:', connResult.reason);
      }

      if (followResult.status === 'fulfilled') {
        setIsFollowing(followResult.value.isFollowing);
        setIsFollowedBy(followResult.value.isFollowedBy);
      } else {
        console.warn('Failed to fetch follow status:', followResult.reason);
      }

      if (mutualResult.status === 'fulfilled') {
        setMutualInfo(mutualResult.value);
      } else {
        console.warn('Failed to fetch mutual info:', mutualResult.reason);
      }
    } catch (error) {
      console.error('Failed to fetch relationship status:', error);
    }
  };

  // Start a conversation with this user
  const handleStartChat = async () => {
    try {
      setStartingChat(true);
      const conversation = await getOrCreateConversation(user.id);
      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setStartingChat(false);
    }
  };

  // Handle connection request
  const handleConnect = async () => {
    try {
      setLoadingConnection(true);
      const result = await sendConnectionRequest(user.id);
      setConnectionStatus('pending_sent');
      setConnectionId(result.connection.id);
      setShowToast(true);
    } catch (error) {
      console.error('Failed to send connection request:', error);
    } finally {
      setLoadingConnection(false);
    }
  };

  // Cancel connection request
  const handleCancelRequest = async () => {
    if (!connectionId) return;
    try {
      setLoadingConnection(true);
      await cancelConnectionRequest(connectionId);
      setConnectionStatus('none');
      setConnectionId(null);
      setShowConnectMenu(false);
    } catch (error) {
      console.error('Failed to cancel request:', error);
    } finally {
      setLoadingConnection(false);
    }
  };

  // Remove connection
  const handleRemoveConnection = async () => {
    if (!connectionId) return;
    try {
      setLoadingConnection(true);
      await removeConnection(connectionId);
      setConnectionStatus('none');
      setConnectionId(null);
      setShowConnectMenu(false);
    } catch (error) {
      console.error('Failed to remove connection:', error);
    } finally {
      setLoadingConnection(false);
    }
  };

  // Accept connection request
  const handleAcceptRequest = async () => {
    if (!connectionId) return;
    try {
      setLoadingConnection(true);
      await acceptConnectionRequest(connectionId);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to accept request:', error);
    } finally {
      setLoadingConnection(false);
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    try {
      setLoadingFollow(true);
      if (isFollowing) {
        await unfollowUser(user.id);
        setIsFollowing(false);
      } else {
        await followUser(user.id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setLoadingFollow(false);
    }
  };

  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Copy profile URL
  const handleCopyLink = () => {
    const url = `${window.location.origin}/profile/${user.username || user.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowShareMenu(false);
    }, 2000);
  };

  return (
    <div className="bg-white dark:bg-neutral-950">
      {/* ══════════════════════════════════════════════════════════════════════════
          BANNER SECTION - LinkedIn Style with Customizable Cover
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 w-full">
        {user.bannerImageUrl ? (
          <img
            src={user.bannerImageUrl}
            alt="Cover photo"
            className="w-full h-full object-cover"
          />
        ) : (
          /* Professional gradient default - subtle and clean */
          <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800" />
        )}

        {/* Edit banner button (owner only) */}
        {isOwner && (
          <button
            onClick={onEditBanner}
            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm text-gray-700 dark:text-neutral-200 text-sm font-medium hover:bg-white dark:hover:bg-neutral-800 transition-all shadow-lg border border-gray-200/50 dark:border-neutral-700/50"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Edit cover</span>
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          MAIN PROFILE CARD - Clean, Spacious Layout
      ══════════════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 -mt-16 sm:-mt-20">
          {/* Profile content wrapper with generous padding */}
          <div className="px-4 sm:px-8 lg:px-10 pt-20 sm:pt-4 pb-6">

            {/* Top section: Avatar + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

              {/* ───────────────────────────────────────────────────────────────────
                  PROFILE AVATAR - Large, LinkedIn-style positioning
              ─────────────────────────────────────────────────────────────────── */}
              <div className="absolute -top-14 sm:relative sm:top-0 left-4 sm:left-0 sm:-mt-24 flex-shrink-0">
                <div className="relative">
                  {/* Avatar with electric profile frame (matches gift card design) */}
                  <div className="relative">
                    {user.profileRing ? (
                      <div
                        className="w-28 h-28 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full p-[6px] animate-[profile-frame-spin_8s_linear_infinite]"
                        style={{
                          background: user.profileRing === 'original'
                            ? 'conic-gradient(from 0deg, #dd8448, #f59e0b, #dd8448, #b45309, #dd8448)'
                            : 'conic-gradient(from 0deg, #3b82f6, #60a5fa, #2563eb, #1d4ed8, #3b82f6)',
                          boxShadow: user.profileRing === 'original'
                            ? '0 0 24px rgba(221,132,72,0.8), 0 0 48px rgba(221,132,72,0.4)'
                            : '0 0 24px rgba(59,130,246,0.8), 0 0 48px rgba(59,130,246,0.4)',
                        }}
                      >
                        <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-neutral-900 shadow-inner">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                              <span className="text-4xl sm:text-6xl font-bold text-white">
                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-28 h-28 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full overflow-hidden border-4 border-white dark:border-neutral-900 shadow-xl bg-white dark:bg-neutral-900">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                            <span className="text-4xl sm:text-6xl font-bold text-white">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Verified badge */}
                  {user.verified && (
                    <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-blue-600 rounded-full p-1 sm:p-1.5 border-2 border-white dark:border-neutral-900 shadow-md">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}

                  {/* Edit avatar button (owner only) */}
                  {isOwner && (
                    <button
                      onClick={onEditAvatar}
                      className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 p-1.5 sm:p-2 rounded-full bg-white dark:bg-neutral-800 shadow-md border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────────────
                  ACTION BUTTONS - High contrast, LinkedIn-style
              ─────────────────────────────────────────────────────────────────── */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 sm:pb-2">
                {isOwner ? (
                  <>
                    <Button
                      onClick={onEditProfile}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit profile
                    </Button>

                    {/* Share dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="p-2.5 rounded-full border-2 border-gray-300 dark:border-neutral-600 text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:border-gray-400 dark:hover:border-neutral-500 transition-all"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>

                      <AnimatePresence>
                        {showShareMenu && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 z-50"
                          >
                            <button
                              onClick={handleCopyLink}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                              {copied ? 'Link copied!' : 'Copy profile link'}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <>
                    {/* ═══════════════════════════════════════════════════════════════
                        CONNECT BUTTON - LinkedIn-style with states
                    ═══════════════════════════════════════════════════════════════ */}
                    <div className="relative">
                      {connectionStatus === 'none' && (
                        <Button
                          onClick={handleConnect}
                          disabled={loadingConnection}
                          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all text-sm"
                        >
                          {loadingConnection ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                          Connect
                        </Button>
                      )}

                      {connectionStatus === 'pending_sent' && (
                        <>
                          <Button
                            onClick={() => setShowConnectMenu(!showConnectMenu)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 rounded-full font-semibold transition-all text-sm hover:bg-gray-200 dark:hover:bg-neutral-700"
                          >
                            <Clock className="w-4 h-4" />
                            Pending
                          </Button>
                          <AnimatePresence>
                            {showConnectMenu && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                className="absolute left-0 mt-2 w-48 py-2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 z-50"
                              >
                                <button
                                  onClick={handleCancelRequest}
                                  disabled={loadingConnection}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                                >
                                  <X className="w-4 h-4" />
                                  Cancel request
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}

                      {connectionStatus === 'pending_received' && (
                        <Button
                          onClick={handleAcceptRequest}
                          disabled={loadingConnection}
                          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold transition-all text-sm"
                        >
                          {loadingConnection ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                          Accept Request
                        </Button>
                      )}

                      {connectionStatus === 'connected' && (
                        <>
                          <Button
                            onClick={() => setShowConnectMenu(!showConnectMenu)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-full font-semibold transition-all text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                          >
                            <UserCheck className="w-4 h-4" />
                            Connected
                          </Button>
                          <AnimatePresence>
                            {showConnectMenu && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                className="absolute left-0 mt-2 w-48 py-2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-700 z-50"
                              >
                                <button
                                  onClick={handleRemoveConnection}
                                  disabled={loadingConnection}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                                >
                                  <UserMinus className="w-4 h-4" />
                                  Remove connection
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════
                        FOLLOW BUTTON - Twitter-style instant toggle
                    ═══════════════════════════════════════════════════════════════ */}
                    <Button
                      onClick={handleFollowToggle}
                      disabled={loadingFollow}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all text-sm ${isFollowing
                          ? 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:border-red-700 dark:hover:text-red-400'
                          : 'bg-transparent border-2 border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:border-gray-400 dark:hover:border-neutral-500'
                        }`}
                    >
                      {loadingFollow ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isFollowing ? (
                        <UserCheck className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>

                    {/* MESSAGE BUTTON */}
                    <Button
                      onClick={handleStartChat}
                      disabled={startingChat}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 rounded-full font-semibold transition-all text-sm hover:bg-gray-200 dark:hover:bg-neutral-700"
                    >
                      {startingChat ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      Message
                    </Button>

                    <button className="p-2.5 rounded-full border-2 border-gray-300 dark:border-neutral-600 text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════
                USER INFORMATION - Clear Typography Hierarchy
            ═══════════════════════════════════════════════════════════════════════ */}
            <div className="mt-6 sm:mt-8">
              {/* Name Row */}
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {user.name}
                </h1>
                {user.isOpenToOpportunities && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    #OpenToWork
                  </span>
                )}
              </div>

              {/* Headline - Prominent */}
              {user.headline && (
                <p className="mt-2 text-lg text-gray-700 dark:text-neutral-200 font-medium leading-relaxed">
                  {user.headline}
                </p>
              )}

              {/* Location & Education - Lighter weight */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-neutral-400">
                {user.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {user.location}
                  </span>
                )}
                {user.college && (
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    {user.college}
                  </span>
                )}
                {user.branch && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    {user.branch}
                  </span>
                )}
              </div>

              {/* Social Links - Integrated inline */}
              {(user.linkedinUrl || user.githubProfileUrl || user.portfolioUrl) && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {user.linkedinUrl && (
                    <a
                      href={user.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {user.githubProfileUrl && (
                    <a
                      href={user.githubProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-neutral-300 hover:underline font-medium"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {user.portfolioUrl && (
                    <a
                      href={user.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                    >
                      <Globe className="w-4 h-4" />
                      Portfolio
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════
                STATS SECTION - Single, Clean, Number-Focused
            ═══════════════════════════════════════════════════════════════════════ */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 dark:border-neutral-800">
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 sm:gap-6 md:gap-8">
                <StatItem
                  value={formatNumber(stats.connectionsCount)}
                  label="connections"
                  isClickable
                  onClick={() => router.push(`/profile/${user.id}/network?tab=connections`)}
                />
                <StatItem
                  value={formatNumber(stats.followersCount)}
                  label="followers"
                  isClickable
                  onClick={() => router.push(`/profile/${user.id}/network?tab=followers`)}
                />
                <StatItem
                  value={formatNumber(stats.totalPosts)}
                  label="posts"
                />
                <StatItem
                  value={formatNumber(stats.totalArticles)}
                  label="articles"
                />
                <StatItem
                  value={formatNumber(stats.totalLikesReceived)}
                  label="likes"
                />
                {!isOwner && stats.replyRate !== undefined && (
                  <StatItem
                    value={`${stats.replyRate}%`}
                    label="reply rate"
                  />
                )}
              </div>

              {/* Gamification - Subtle, Professional */}
              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Level indicator */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                      {stats.level}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm">
                    <span className="text-gray-500 dark:text-neutral-400">Lvl</span>
                    <span className="text-gray-400 dark:text-neutral-500 mx-0.5 sm:mx-1">·</span>
                    <span className="text-gray-700 dark:text-neutral-300 font-medium">
                      {stats.xp.toLocaleString()} XP
                    </span>
                  </div>
                </div>

                {/* Streak indicator */}
                {stats.currentStreak > 0 && (
                  <Link
                    href="/streaks"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm hover:opacity-80 transition-opacity"
                  >
                    <span className="text-orange-500">🔥</span>
                    <span className="text-gray-700 dark:text-neutral-300 font-medium">
                      {stats.currentStreak} day streak
                    </span>
                  </Link>
                )}

                {/* Active days */}
                <div className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
                  {stats.totalActiveDays} active days
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════════════
                  MUTUAL CONNECTIONS & FOLLOWERS - LinkedIn style
              ═══════════════════════════════════════════════════════════════════════ */}
              {!isOwner && mutualInfo && (mutualInfo.mutualConnectionsCount > 0 || mutualInfo.mutualFollowersCount > 0) && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-neutral-800">
                  {/* Mutual Connections */}
                  {mutualInfo.mutualConnectionsCount > 0 && (
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
                      <div className="flex items-center gap-1">
                        {/* Avatar stack */}
                        <div className="flex -space-x-2 mr-2">
                          {mutualInfo.mutualConnections.slice(0, 3).map((connection, idx) => (
                            <div
                              key={connection.id}
                              className="w-6 h-6 rounded-full border-2 border-white dark:border-neutral-900 overflow-hidden bg-gray-200 dark:bg-neutral-700"
                              style={{ zIndex: 3 - idx }}
                            >
                              {connection.profileImage ? (
                                <img
                                  src={connection.profileImage}
                                  alt={connection.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-500 dark:text-neutral-400">
                                  {connection.name?.charAt(0)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-neutral-400">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {mutualInfo.mutualConnections[0]?.name}
                          </span>
                          {mutualInfo.mutualConnectionsCount > 1 && (
                            <> and <span className="font-medium text-gray-900 dark:text-white">{mutualInfo.mutualConnectionsCount - 1} other{mutualInfo.mutualConnectionsCount > 2 ? 's' : ''}</span></>
                          )}
                          {' '}mutual connection{mutualInfo.mutualConnectionsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mutual Followers */}
                  {mutualInfo.mutualFollowersCount > 0 && (
                    <div className={`flex items-center gap-3 ${mutualInfo.mutualConnectionsCount > 0 ? 'mt-3' : ''}`}>
                      <UserPlus className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
                      <div className="flex items-center gap-1">
                        {/* Avatar stack */}
                        <div className="flex -space-x-2 mr-2">
                          {mutualInfo.mutualFollowers.slice(0, 3).map((follower, idx) => (
                            <div
                              key={follower.id}
                              className="w-6 h-6 rounded-full border-2 border-white dark:border-neutral-900 overflow-hidden bg-gray-200 dark:bg-neutral-700"
                              style={{ zIndex: 3 - idx }}
                            >
                              {follower.profileImage ? (
                                <img
                                  src={follower.profileImage}
                                  alt={follower.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-500 dark:text-neutral-400">
                                  {follower.name?.charAt(0)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-neutral-400">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {mutualInfo.mutualFollowers[0]?.name}
                          </span>
                          {mutualInfo.mutualFollowersCount > 1 && (
                            <> and <span className="font-medium text-gray-900 dark:text-white">{mutualInfo.mutualFollowersCount - 1} other{mutualInfo.mutualFollowersCount > 2 ? 's' : ''}</span></>
                          )}
                          {' '}also follow{mutualInfo.mutualFollowersCount === 1 ? 's' : ''} this user
                        </span>
                      </div>
                    </div>
                  )}

                  {/* "Follows you" indicator */}
                  {isFollowedBy && (
                    <div className={`flex items-center gap-2 ${(mutualInfo.mutualConnectionsCount > 0 || mutualInfo.mutualFollowersCount > 0) ? 'mt-3' : ''}`}>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        Follows you
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* "Follows you" indicator (when no mutual info) */}
              {!isOwner && isFollowedBy && (!mutualInfo || (mutualInfo.mutualConnectionsCount === 0 && mutualInfo.mutualFollowersCount === 0)) && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-neutral-800">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    Follows you
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConnectionSentToast
        show={showToast}
        recipientName={user.name}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════════
   STAT ITEM COMPONENT - Minimal, Number-Focused
════════════════════════════════════════════════════════════════════════════════ */
interface StatItemProps {
  value: string;
  label: string;
  isClickable?: boolean;
  onClick?: () => void;
}

function StatItem({ value, label, isClickable, onClick }: StatItemProps) {
  const baseClasses = "flex items-center gap-1";
  const clickableClasses = isClickable
    ? "cursor-pointer hover:underline decoration-blue-500 underline-offset-2"
    : "";

  return (
    <div 
      className={`${baseClasses} ${clickableClasses}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
        {value}
      </span>
      <span className="text-[10px] sm:text-sm text-gray-500 dark:text-neutral-400">
        {label}
      </span>
    </div>
  );
}

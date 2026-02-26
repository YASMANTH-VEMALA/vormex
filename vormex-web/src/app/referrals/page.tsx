'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Copy, 
  Check,
  ChevronLeft,
  Users,
  Zap,
  Trophy,
  Share2,
  Link2,
  Crown,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as referralsAPI from '@/lib/api/referrals';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  completedReferrals?: number;
  activeReferrals?: number;
  pendingReferrals?: number;
  totalXPEarned?: number;
  totalXpEarned?: number;
  currentMilestone?: number;
  nextMilestone?: number;
  milestonesCompleted?: number;
  milestones?: {
    signups: number;
    profileCompleted: number;
    firstPosts: number;
    connections: number;
  };
}

interface ReferralMilestone {
  count: number;
  reward: number;
  completed: boolean;
}

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    name: string;
    profileImage?: string;
  };
  referralCount: number;
}

const milestones: ReferralMilestone[] = [
  { count: 1, reward: 100, completed: false },
  { count: 5, reward: 250, completed: false },
  { count: 10, reward: 500, completed: false },
  { count: 25, reward: 1000, completed: false },
  { count: 50, reward: 2500, completed: false },
  { count: 100, reward: 5000, completed: false }
];

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, leaderboardRes] = await Promise.all([
        referralsAPI.getReferralStats(),
        referralsAPI.getReferralLeaderboard()
      ]);
      setStats(statsRes || null);
      setLeaderboard(leaderboardRes || []);
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLink = () => {
    if (stats?.referralCode) {
      const link = `${window.location.origin}/signup?ref=${stats.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getMilestoneProgress = () => {
    if (!stats) return milestones;
    const completed = stats.completedReferrals ?? stats.activeReferrals ?? 0;
    return milestones.map(m => ({
      ...m,
      completed: completed >= m.count
    }));
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-neutral-600 border-t-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-20">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Link href="/more" className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Invite Friends</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Earn XP for every friend who joins
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code Card */}
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-200 dark:border-neutral-800">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Gift className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Your Referral Code</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Share this code with friends</p>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-lg px-4 py-3 font-mono text-lg text-center text-gray-900 dark:text-white">
                {stats?.referralCode || 'Loading...'}
              </div>
              <button
                onClick={copyCode}
                className="p-3 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>

            <button
              onClick={copyLink}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Copy Invite Link
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Total</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.totalReferrals || 0}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Check className="w-4 h-4" />
                <span className="text-xs">Completed</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.completedReferrals || 0}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs">XP Earned</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.totalXPEarned || 0}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex gap-1 bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Milestones', icon: Target },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'leaderboard')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Referral Milestones
              </h3>
              {getMilestoneProgress().map((milestone, index) => (
                <motion.div
                  key={milestone.count}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white dark:bg-neutral-900 rounded-xl p-4 border ${
                    milestone.completed 
                      ? 'border-green-300 dark:border-green-700' 
                      : 'border-gray-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      milestone.completed
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-gray-100 dark:bg-neutral-800'
                    }`}>
                      {milestone.completed ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Gift className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className={`font-medium ${
                        milestone.completed 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        Refer {milestone.count} {milestone.count === 1 ? 'friend' : 'friends'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {milestone.completed ? 'Completed' : `${stats?.completedReferrals || 0} / ${milestone.count}`}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className={milestone.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                        +{milestone.reward}
                      </span>
                    </div>
                  </div>
                  
                  {!milestone.completed && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, ((stats?.completedReferrals || 0) / milestone.count) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Leaderboard</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No referrals yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 flex items-center gap-4"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        entry.rank === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        entry.rank === 2 ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                        entry.rank === 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400'
                      }`}>
                        {entry.rank <= 3 ? <Crown className="w-4 h-4" /> : entry.rank}
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
                        {entry.user.profileImage ? (
                          <img src={entry.user.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {entry.user.name?.charAt(0) || entry.user.username?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {entry.user.name || entry.user.username}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{entry.user.username}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">{entry.referralCount}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

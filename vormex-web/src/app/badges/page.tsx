'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Award, 
  Trophy, 
  Target,
  ChevronLeft,
  CheckCircle,
  Lock,
  Zap,
  Users,
  FileText,
  Heart,
  Flame,
  Github,
  Gift,
  Code,
  User,
  Crown
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as badgesAPI from '@/lib/api/badges';
import type { BadgeProgress as ApiBadgeProgress, LeaderboardEntry as ApiLeaderboardEntry } from '@/lib/api/badges';

interface BadgeProgress {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  rarity: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
}

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    name: string;
    profileImage?: string;
  };
  badgeCount: number;
}

type TabType = 'progress' | 'unlocked' | 'leaderboard';

const categoryIcons: Record<string, React.ReactNode> = {
  profile: <User className="w-4 h-4" />,
  social: <Users className="w-4 h-4" />,
  content: <FileText className="w-4 h-4" />,
  engagement: <Heart className="w-4 h-4" />,
  streaks: <Flame className="w-4 h-4" />,
  skills: <Target className="w-4 h-4" />,
  github: <Github className="w-4 h-4" />,
  referrals: <Gift className="w-4 h-4" />,
  challenges: <Code className="w-4 h-4" />,
  special: <Award className="w-4 h-4" />
};

const rarityStyles: Record<string, { border: string; bg: string; text: string }> = {
  common: { border: 'border-gray-300 dark:border-neutral-600', bg: 'bg-gray-100 dark:bg-neutral-800', text: 'text-gray-600 dark:text-gray-400' },
  rare: { border: 'border-blue-400 dark:border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  epic: { border: 'border-purple-400 dark:border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  legendary: { border: 'border-amber-400 dark:border-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' }
};

export default function BadgesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [progressRes, leaderboardRes] = await Promise.all([
        badgesAPI.getBadgeProgress(),
        badgesAPI.getBadgeLeaderboard()
      ]);
      // Map API response to local BadgeProgress type
      const mappedProgress: BadgeProgress[] = (progressRes || []).map((p: ApiBadgeProgress) => ({
        id: p.badge.id,
        slug: p.badge.slug,
        name: p.badge.name,
        description: p.badge.description,
        icon: p.badge.icon,
        category: p.badge.category,
        xpReward: p.badge.xpReward,
        rarity: p.badge.rarity,
        unlocked: p.unlocked,
        unlockedAt: p.unlockedAt || null,
        progress: p.progress,
      }));
      setBadgeProgress(mappedProgress);
      setLeaderboard((leaderboardRes || []) as LeaderboardEntry[]);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(badgeProgress.map(b => b.category))];
  const filteredBadges = selectedCategory === 'all' 
    ? badgeProgress 
    : badgeProgress.filter(b => b.category === selectedCategory);
  
  const unlockedBadges = filteredBadges.filter(b => b.unlocked);
  const lockedBadges = filteredBadges.filter(b => !b.unlocked);

  const totalUnlocked = badgeProgress.filter(b => b.unlocked).length;
  const totalXP = badgeProgress.filter(b => b.unlocked).reduce((sum, b) => sum + b.xpReward, 0);

  const getRarityStyle = (rarity: string) => rarityStyles[rarity] || rarityStyles.common;

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
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Achievements</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {totalUnlocked} of {badgeProgress.length} badges unlocked
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-xs">Unlocked</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalUnlocked}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs">XP Earned</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalXP}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs">Progress</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {badgeProgress.length > 0 ? Math.round((totalUnlocked / badgeProgress.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1 bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg">
            {[
              { id: 'progress', label: 'All Badges', icon: Target },
              { id: 'unlocked', label: 'Unlocked', icon: CheckCircle },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-4">
          {(activeTab === 'progress' || activeTab === 'unlocked') && (
            <>
              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {cat !== 'all' && categoryIcons[cat]}
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {activeTab === 'progress' ? (
                <>
                  {unlockedBadges.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Unlocked ({unlockedBadges.length})
                      </h3>
                      <div className="space-y-2">
                        {unlockedBadges.map((badge) => (
                          <BadgeCard key={badge.id} badge={badge} getRarityStyle={getRarityStyle} />
                        ))}
                      </div>
                    </div>
                  )}

                  {lockedBadges.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        In Progress ({lockedBadges.length})
                      </h3>
                      <div className="space-y-2">
                        {lockedBadges.map((badge) => (
                          <BadgeCard key={badge.id} badge={badge} getRarityStyle={getRarityStyle} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {unlockedBadges.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Award className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No badges yet</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Complete activities to earn badges</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {unlockedBadges.map((badge) => (
                        <BadgeCard key={badge.id} badge={badge} getRarityStyle={getRarityStyle} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'leaderboard' && (
            <>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Leaderboard</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No data available yet</p>
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
                        <Award className="w-4 h-4" />
                        <span className="font-semibold">{entry.badgeCount}</span>
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

function BadgeCard({ 
  badge, 
  getRarityStyle 
}: { 
  badge: BadgeProgress; 
  getRarityStyle: (rarity: string) => { border: string; bg: string; text: string };
}) {
  const style = getRarityStyle(badge.rarity);
  const icon = categoryIcons[badge.category] || <Award className="w-5 h-5" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-neutral-900 rounded-xl p-4 border ${
        badge.unlocked ? style.border : 'border-gray-200 dark:border-neutral-800'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          badge.unlocked ? style.bg : 'bg-gray-100 dark:bg-neutral-800'
        }`}>
          <div className={badge.unlocked ? style.text : 'text-gray-400 dark:text-gray-500'}>
            {icon}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={`font-medium ${
                badge.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {badge.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {badge.description}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm shrink-0">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-gray-600 dark:text-gray-400">{badge.xpReward}</span>
            </div>
          </div>
          
          {!badge.unlocked && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{badge.progress.current} / {badge.progress.target}</span>
                <span>{badge.progress.percentage}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${badge.progress.percentage}%` }}
                />
              </div>
            </div>
          )}
          
          {badge.unlocked && badge.unlockedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

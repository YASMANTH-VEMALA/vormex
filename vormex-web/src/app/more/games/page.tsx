'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Zap,
  Brain,
  Keyboard,
  Code,
  TrendingUp,
  Star,
  Flame,
  Gift,
  Medal,
  Target,
  Gamepad2,
  Clock,
  Users,
  Sparkles,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getMyGameStats, getLeaderboard, LeaderboardEntry } from '@/lib/api/games';

interface GameCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgGradient: string;
  xpReward: string;
  difficulty?: string;
  badge?: string;
}

export default function GamesPage() {
  const [totalXp, setTotalXp] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStreak, setDailyStreak] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, leaderboardData] = await Promise.all([
          getMyGameStats(),
          getLeaderboard('all', 'alltime', 5),
        ]);
        setTotalXp(statsData.stats?.currentXpBalance || 0);
        setDailyStreak(statsData.stats?.currentStreak || 0);
        setLeaderboard(leaderboardData.leaderboard || []);
      } catch (error) {
        console.error('Failed to fetch games data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const games: GameCard[] = [
    {
      id: 'trivia',
      title: 'Daily Trivia',
      description: 'Test your tech knowledge with daily questions',
      icon: Brain,
      href: '/more/games/trivia',
      color: 'text-purple-500',
      bgGradient: 'from-purple-500/20 to-pink-500/20',
      xpReward: '10-50 XP',
      difficulty: 'Varies',
      badge: 'Daily',
    },
    {
      id: 'wordle',
      title: 'Tech Wordle',
      description: 'Guess the tech term in 6 tries',
      icon: Target,
      href: '/more/games/wordle',
      color: 'text-green-500',
      bgGradient: 'from-green-500/20 to-emerald-500/20',
      xpReward: '20-100 XP',
      difficulty: 'Medium',
      badge: 'Daily',
    },
    {
      id: 'typing',
      title: 'Typing Race',
      description: 'Test your typing speed with code snippets',
      icon: Keyboard,
      href: '/more/games/typing',
      color: 'text-blue-500',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      xpReward: '15-75 XP',
      difficulty: 'All Levels',
      badge: 'Multiplayer',
    },
    {
      id: 'coding',
      title: 'Coding Puzzles',
      description: 'Solve algorithmic challenges',
      icon: Code,
      href: '/more/games/coding',
      color: 'text-orange-500',
      bgGradient: 'from-orange-500/20 to-amber-500/20',
      xpReward: '50-200 XP',
      difficulty: 'Hard',
    },
    {
      id: 'startup',
      title: 'Startup Simulator',
      description: 'Build your tech empire from scratch',
      icon: TrendingUp,
      href: '/more/games/startup',
      color: 'text-rose-500',
      bgGradient: 'from-rose-500/20 to-red-500/20',
      xpReward: '10-500 XP',
      difficulty: 'Strategy',
      badge: 'New',
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/more"
                className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-purple-500" />
                  Games & XP
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Play games, earn XP, climb leaderboards
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* XP Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 p-6 text-white"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total XP</p>
                  <p className="text-4xl font-bold mt-1">
                    {isLoading ? '...' : totalXp.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Zap className="w-8 h-8" />
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-300" />
                  <span className="text-sm">
                    <span className="font-semibold">{dailyStreak}</span> Day Streak
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Medal className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm">
                    <span className="font-semibold">5</span> Games Available
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Daily Bonus</p>
                  <p className="font-semibold text-gray-900 dark:text-white">+50 XP</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">XP Store</p>
                  <p className="font-semibold text-gray-900 dark:text-white">Coming Soon</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Games Grid */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Play & Earn
            </h2>
            <div className="space-y-3">
              {games.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={game.href}
                    className="block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all hover:shadow-lg group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${game.bgGradient}`}>
                        <game.icon className={`w-6 h-6 ${game.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {game.title}
                          </h3>
                          {game.badge && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              game.badge === 'New' 
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                : game.badge === 'Daily'
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {game.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {game.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {game.xpReward}
                        </p>
                        <p className="text-xs text-gray-400">{game.difficulty}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Leaderboard Preview */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top Players
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : leaderboard.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Be the first to earn XP!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.user.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                          : index === 1
                          ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                          : index === 2
                          ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                        {entry.user.name?.charAt(0).toUpperCase() || entry.user.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {entry.user.name || entry.user.username || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.gamesPlayed} games played
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-purple-600 dark:text-purple-400">
                          {entry.xp.toLocaleString()} XP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* How XP Works */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              How XP Works
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">1</span>
                </div>
                <p>Play daily games to earn XP based on your performance</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">2</span>
                </div>
                <p>Maintain your daily streak for bonus XP multipliers</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <p>Climb the leaderboard and compete with other users</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">4</span>
                </div>
                <p>Redeem XP for rewards in the XP Store (coming soon!)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

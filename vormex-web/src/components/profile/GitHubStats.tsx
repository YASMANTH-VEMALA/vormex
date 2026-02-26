'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Github,
  Star,
  GitFork,
  Users,
  ExternalLink,
  RefreshCw,
  Unplug,
  Code2,
  BookMarked,
  X,
  Calendar,
  Eye,
  FileCode,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { GitHubProfile } from '@/types/profile';

interface GitHubStatsProps {
  github: GitHubProfile;
  isOwner: boolean;
  onSync?: () => Promise<void>;
  onConnect?: () => void;
  onDisconnect?: () => Promise<void>;
}

// Vibrant color palette for languages
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#cc342d',
  PHP: '#4F5D95',
  Swift: '#FA7343',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Other: '#8b949e',
};

// Generate mock sparkline data for demo purposes
const generateSparklineData = (value: number, trend: 'up' | 'down' | 'stable' = 'up') => {
  const points = 12;
  const data = [];
  let current = value * 0.7;

  for (let i = 0; i < points; i++) {
    const variation = (Math.random() - 0.5) * (value * 0.15);
    if (trend === 'up') {
      current += (value * 0.3) / points + variation;
    } else if (trend === 'down') {
      current -= (value * 0.2) / points - variation;
    } else {
      current += variation;
    }
    data.push({ value: Math.max(0, Math.round(current)) });
  }

  return data;
};

// Generate repo activity data for commit graph
const generateRepoActivityData = () => {
  const data = [];
  for (let i = 1; i <= 12; i++) {
    data.push({
      week: i,
      commits: Math.floor(Math.random() * 30) + 5,
    });
  }
  return data;
};

// Generate weekly activity data for additions/deletions
const generateWeeklyActivityData = () => {
  const data = [];
  for (let i = 0; i < 8; i++) {
    data.push({
      week: i,
      additions: Math.floor(Math.random() * 500) + 50,
      deletions: Math.floor(Math.random() * 200) + 10,
    });
  }
  return data;
};

interface TopRepo {
  name: string;
  description?: string;
  url: string;
  stars: number;
  forks: number;
  language?: string;
  updatedAt?: string;
  topics?: string[];
  isPrivate?: boolean;
  size?: number;
  openIssues?: number;
  watchers?: number;
}

export function GitHubStats({
  github,
  isOwner,
  onSync,
  onConnect,
  onDisconnect,
}: GitHubStatsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<TopRepo | null>(null);

  const handleSync = async () => {
    if (!onSync) return;
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  // Not connected state
  if (!github.connected) {
    return (
      <Card className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub
          </h2>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
            <Github className="w-8 h-8 text-gray-500 dark:text-neutral-500" />
          </div>
          <p className="text-gray-600 dark:text-neutral-400 mb-4">
            {isOwner
              ? 'Connect your GitHub account to showcase your repositories and contributions.'
              : 'GitHub account not connected.'}
          </p>
          {isOwner && onConnect && (
            <Button
              onClick={onConnect}
              className="bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-900 dark:text-white"
            >
              <Github className="w-4 h-4 mr-2" />
              Connect GitHub
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const stats = github.stats;
  if (!stats) {
    return (
      <Card className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub
          </h2>
        </div>
        <p className="text-gray-600 dark:text-neutral-400">No GitHub stats available yet.</p>
      </Card>
    );
  }

  // Prepare language data for pie chart
  const languageData = Object.entries(stats.topLanguages || {})
    .map(([name, data]) => ({
      name,
      value: data.percentage,
      color: LANGUAGE_COLORS[name] || LANGUAGE_COLORS['Other'],
    }))
    .slice(0, 6);

  return (
    <Card className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Github className="w-4 h-4 sm:w-5 sm:h-5" />
          GitHub
          {github.username && (
            <a
              href={github.profileUrl || `https://github.com/${github.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-gray-600 dark:text-neutral-400 hover:text-blue-400 flex items-center gap-1 ml-1 sm:ml-2"
            >
              @{github.username}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </h2>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSync}
              disabled={isSyncing}
              className="text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
              title="Sync GitHub stats"
            >
              <RefreshCw
                className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
              />
            </Button>
            {onDisconnect && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDisconnect}
                className="text-gray-600 dark:text-neutral-400 hover:text-red-400"
                title="Disconnect GitHub"
              >
                <Unplug className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stats Grid with Sparklines */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatItemWithSparkline
          icon={<BookMarked className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />}
          label="Repositories"
          value={stats.totalPublicRepos}
          color="#3b82f6"
          trend="up"
        />
        <StatItemWithSparkline
          icon={<Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />}
          label="Total Stars"
          value={stats.totalStars}
          color="#f59e0b"
          trend="up"
        />
        <StatItemWithSparkline
          icon={<GitFork className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />}
          label="Total Forks"
          value={stats.totalForks}
          color="#a855f7"
          trend="stable"
        />
        <StatItemWithSparkline
          icon={<Users className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />}
          label="Followers"
          value={stats.followers}
          color="#10b981"
          trend="up"
        />
      </div>

      {/* Languages Chart & Top Repos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Language Breakdown with Pie Chart */}
        {languageData.length > 0 && (
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-neutral-400 mb-2 sm:mb-3 flex items-center gap-2">
              <Code2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Top Languages
            </h3>
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Pie/Donut Chart */}
              <div className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languageData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={48}
                      strokeWidth={2}
                      stroke="transparent"
                    >
                      {languageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-gray-900 dark:bg-neutral-800 px-3 py-2 rounded-lg shadow-lg">
                              <p className="text-white text-sm font-medium">
                                {payload[0].name}
                              </p>
                              <p className="text-gray-300 text-xs">
                                {(payload[0].value as number)?.toFixed(1)}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Language List */}
              <div className="flex-1 space-y-2">
                {languageData.slice(0, 5).map((lang) => (
                  <div key={lang.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: lang.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-neutral-300 flex-1 truncate">
                      {lang.name}
                    </span>
                    <span className="text-sm tabular-nums text-gray-500 dark:text-neutral-500">
                      {lang.value.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Repos - Now with Modal */}
        {stats.topRepos && stats.topRepos.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-neutral-400 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Top Repositories
            </h3>
            <div className="space-y-3">
              {stats.topRepos.slice(0, 3).map((repo, index) => (
                <motion.button
                  key={repo.name}
                  onClick={() => setSelectedRepo(repo as TopRepo)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg border border-gray-200 dark:border-neutral-700/50 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 dark:text-white font-medium truncate flex items-center gap-2">
                        <BookMarked className="w-4 h-4 text-gray-400 dark:text-neutral-500 flex-shrink-0 group-hover:text-blue-500 transition-colors" />
                        {repo.name}
                      </h4>
                      {repo.description && (
                        <p className="text-gray-500 dark:text-neutral-400 text-sm mt-1 line-clamp-1">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <Eye className="w-4 h-4 text-gray-400 dark:text-neutral-600 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-neutral-500">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              LANGUAGE_COLORS[repo.language] ||
                              LANGUAGE_COLORS['Other'],
                          }}
                        />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {repo.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3 h-3" />
                      {repo.forks}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Last Synced */}
      {github.lastSyncedAt && (
        <p className="text-xs text-gray-500 dark:text-neutral-500 mt-4 text-right">
          Last synced:{' '}
          {new Date(github.lastSyncedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      {/* Repository Details Modal */}
      <Dialog.Root open={!!selectedRepo} onOpenChange={(open) => !open && setSelectedRepo(null)}>
        <AnimatePresence>
          {selectedRepo && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', duration: 0.3 }}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-neutral-800 overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-800/50 border-b border-gray-200 dark:border-neutral-800 px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 flex items-center justify-center shadow-sm">
                          <BookMarked className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
                        </div>
                        <div>
                          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                            {selectedRepo.name}
                          </Dialog.Title>
                          <p className="text-sm text-gray-500 dark:text-neutral-400">
                            {github.username}/{selectedRepo.name}
                          </p>
                        </div>
                      </div>
                      <Dialog.Close asChild>
                        <button
                          className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                          aria-label="Close"
                        >
                          <X className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
                        </button>
                      </Dialog.Close>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Description */}
                    {selectedRepo.description && (
                      <div>
                        <p className="text-gray-700 dark:text-neutral-300 leading-relaxed">
                          {selectedRepo.description}
                        </p>
                      </div>
                    )}

                    {/* Activity Graph */}
                    <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                          Commit Activity
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-neutral-500">
                          Last 12 weeks
                        </span>
                      </div>
                      <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={generateRepoActivityData()}>
                            <defs>
                              <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="commits"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              fill="url(#commitGradient)"
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-gray-900 dark:bg-neutral-700 px-3 py-2 rounded-lg shadow-lg">
                                      <p className="text-white text-sm font-medium">
                                        Week {label}
                                      </p>
                                      <p className="text-gray-300 text-xs">
                                        {payload[0].value} commits
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Weekly Activity Bars */}
                    <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                          Weekly Activity
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-neutral-500">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Additions
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            Deletions
                          </span>
                        </div>
                      </div>
                      <div className="h-16">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={generateWeeklyActivityData()} barGap={0}>
                            <Bar dataKey="additions" fill="#10b981" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="deletions" fill="#f87171" radius={[2, 2, 0, 0]} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-gray-900 dark:bg-neutral-700 px-3 py-2 rounded-lg shadow-lg">
                                      <p className="text-emerald-400 text-xs">+{payload[0]?.value} additions</p>
                                      <p className="text-red-400 text-xs">-{payload[1]?.value} deletions</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                        <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-1">
                          <Star className="w-4 h-4" />
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedRepo.stars}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-neutral-500">Stars</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                        <div className="flex items-center justify-center gap-1.5 text-purple-500 mb-1">
                          <GitFork className="w-4 h-4" />
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedRepo.forks}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-neutral-500">Forks</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                        <div className="flex items-center justify-center gap-1.5 text-blue-500 mb-1">
                          <Eye className="w-4 h-4" />
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedRepo.watchers || selectedRepo.stars}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-neutral-500">Watchers</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      {selectedRepo.language && (
                        <div className="flex items-center gap-3 text-sm">
                          <FileCode className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-neutral-400">Language:</span>
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  LANGUAGE_COLORS[selectedRepo.language] ||
                                  LANGUAGE_COLORS['Other'],
                              }}
                            />
                            <span className="text-gray-900 dark:text-white font-medium">
                              {selectedRepo.language}
                            </span>
                          </span>
                        </div>
                      )}
                      {selectedRepo.updatedAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-neutral-400">Last updated:</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {new Date(selectedRepo.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Topics */}
                    {selectedRepo.topics && selectedRepo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedRepo.topics.slice(0, 6).map((topic) => (
                          <span
                            key={topic}
                            className="px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-800/50 border-t border-gray-200 dark:border-neutral-800">
                    <a
                      href={selectedRepo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      Open Repository
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </Card>
  );
}

interface StatItemWithSparklineProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}

function StatItemWithSparkline({ icon, label, value, color, trend = 'stable' }: StatItemWithSparklineProps) {
  const sparklineData = generateSparklineData(value, trend);

  return (
    <div className="p-2 sm:p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg sm:rounded-xl border border-gray-200 dark:border-neutral-700/50 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {icon}
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-neutral-500 font-medium">{label}</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-1.5 sm:gap-2">
        <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
          {value.toLocaleString()}
        </p>
        {/* Sparkline - Hidden on very small screens */}
        <div className="hidden xs:block w-12 sm:w-16 h-6 sm:h-8 opacity-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

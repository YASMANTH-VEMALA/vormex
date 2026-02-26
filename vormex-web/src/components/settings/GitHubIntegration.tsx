'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Github,
  Loader2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Check,
  X,
  Star,
  GitFork,
  Users,
  BookOpen,
  Settings,
  Unlink,
} from 'lucide-react';
import {
  startGitHubOAuth,
  getGitHubStats,
  syncGitHubStats,
  disconnectGitHub,
  type GitHubConnection,
} from '@/lib/api/integrations';

export function GitHubIntegration() {
  const [connection, setConnection] = useState<GitHubConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch GitHub connection status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getGitHubStats();
        setConnection(data);
      } catch (err: any) {
        // Not connected is expected
        if (err.response?.status !== 404) {
          console.error('Failed to fetch GitHub status:', err);
        }
        setConnection({ connected: false, username: null, stats: null, lastSyncedAt: null });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // Handle connect
  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const { authUrl } = await startGitHubOAuth();
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start GitHub OAuth');
      setConnecting(false);
    }
  };

  // Handle sync
  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await syncGitHubStats();
      setConnection((prev) =>
        prev
          ? {
              ...prev,
              stats: result.stats,
              lastSyncedAt: result.syncedAt,
            }
          : null
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sync GitHub stats');
    } finally {
      setSyncing(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) {
      return;
    }

    setDisconnecting(true);
    try {
      await disconnectGitHub();
      setConnection({ connected: false, username: null, stats: null, lastSyncedAt: null });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to disconnect GitHub');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 dark:bg-white rounded-lg">
              <Github className="w-5 h-5 text-white dark:text-gray-900" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                GitHub
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {connection?.connected
                  ? `Connected as @${connection.username}`
                  : 'Connect your GitHub account'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              connection?.connected
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400'
            }`}
          >
            {connection?.connected ? 'Connected' : 'Not Connected'}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {!connection?.connected ? (
          // Not Connected State
          <div className="text-center py-6">
            <p className="text-gray-600 dark:text-neutral-300 mb-4">
              Connect your GitHub account to display your contributions,
              repositories, and coding stats on your profile.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {connecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Github className="w-5 h-5" />
              )}
              Connect GitHub
            </button>
          </div>
        ) : (
          // Connected State - Show Stats
          <div className="space-y-4">
            {/* Quick Stats */}
            {connection.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 text-center">
                  <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {connection.stats.totalPublicRepos}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Repos
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 text-center">
                  <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {connection.stats.totalStars}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Stars
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 text-center">
                  <GitFork className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {connection.stats.totalForks}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Forks
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 text-center">
                  <Users className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {connection.stats.followers}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Followers
                  </p>
                </div>
              </div>
            )}

            {/* Top Languages */}
            {connection.stats?.topLanguages &&
              Object.keys(connection.stats.topLanguages).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Top Languages
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(connection.stats.topLanguages)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([lang, bytes]) => (
                        <span
                          key={lang}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                        >
                          {lang}
                        </span>
                      ))}
                  </div>
                </div>
              )}

            {/* Top Repos */}
            {connection.stats?.topRepos && connection.stats.topRepos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Top Repositories
                </h4>
                <div className="space-y-2">
                  {connection.stats.topRepos.slice(0, 3).map((repo) => (
                    <a
                      key={repo.name}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {repo.name}
                          </p>
                          {repo.description && (
                            <p className="text-sm text-gray-500 dark:text-neutral-400 truncate">
                              {repo.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          {repo.language && (
                            <span className="text-xs text-gray-500 dark:text-neutral-400">
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Star className="w-3 h-3" />
                            {repo.stars}
                          </span>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Last Synced */}
            {connection.lastSyncedAt && (
              <p className="text-xs text-gray-400 dark:text-neutral-500">
                Last synced:{' '}
                {new Date(connection.lastSyncedAt).toLocaleString()}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
                />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
              >
                {disconnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlink className="w-4 h-4" />
                )}
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

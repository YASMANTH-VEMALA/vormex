// Integrations API - GitHub and other external integrations

import apiClient from './client';

// ============================================
// Types
// ============================================

export interface GitHubStats {
  totalPublicRepos: number;
  totalStars: number;
  totalForks: number;
  followers: number;
  following: number;
  topLanguages: Record<string, number>;
  topRepos: Array<{
    name: string;
    description: string | null;
    stars: number;
    forks: number;
    language: string | null;
    url: string;
  }>;
}

export interface GitHubConnection {
  connected: boolean;
  username: string | null;
  stats: GitHubStats | null;
  lastSyncedAt: string | null;
}

// ============================================
// GitHub API Functions
// ============================================

/**
 * Start GitHub OAuth flow
 * Returns URL to redirect user to
 */
export async function startGitHubOAuth(): Promise<{ authUrl: string }> {
  return apiClient.get('/integrations/github/start');
}

/**
 * Get GitHub connection status and stats
 */
export async function getGitHubStats(): Promise<GitHubConnection> {
  return apiClient.get('/integrations/github/stats');
}

/**
 * Manually sync GitHub stats
 */
export async function syncGitHubStats(): Promise<{
  message: string;
  stats: GitHubStats;
  syncedAt: string;
}> {
  return apiClient.post('/integrations/github/sync');
}

/**
 * Disconnect GitHub account
 */
export async function disconnectGitHub(): Promise<{ message: string }> {
  return apiClient.post('/integrations/github/disconnect');
}

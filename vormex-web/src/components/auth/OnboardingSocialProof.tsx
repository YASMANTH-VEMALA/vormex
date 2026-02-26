'use client';

import { useState, useEffect } from 'react';
import { getOnboardingStats, type OnboardingStats } from '@/lib/api/social-proof';

/**
 * OnboardingSocialProof — Social proof banner for auth pages
 * Shows live user stats to encourage signups/logins
 * Mirrors Android's OnboardingSocialProof.kt
 */
export function OnboardingSocialProof() {
  const [stats, setStats] = useState<OnboardingStats | null>(null);

  useEffect(() => {
    getOnboardingStats()
      .then(setStats)
      .catch(() => {}); // silent fail — decorative only
  }, []);

  if (!stats) return null;

  const formatNumber = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="onboarding-social-proof">
      {/* Active now pulse */}
      {stats.activeToday > 0 && (
        <div className="social-proof-live">
          <span className="live-dot" />
          <span className="live-text">
            {formatNumber(stats.activeToday)} active today
          </span>
        </div>
      )}

      {/* Stats pills */}
      <div className="social-proof-stats">
        <div className="stat-pill">
          <span className="stat-icon">👥</span>
          <span className="stat-value">{formatNumber(stats.totalUsers)}</span>
          <span className="stat-label">Students</span>
        </div>
        <div className="stat-pill">
          <span className="stat-icon">🎓</span>
          <span className="stat-value">{formatNumber(stats.totalColleges)}</span>
          <span className="stat-label">Colleges</span>
        </div>
        <div className="stat-pill">
          <span className="stat-icon">🤝</span>
          <span className="stat-value">{formatNumber(stats.totalConnections)}</span>
          <span className="stat-label">Connections</span>
        </div>
      </div>
    </div>
  );
}

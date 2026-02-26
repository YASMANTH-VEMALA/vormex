'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStreaks, getWeeklyGoals, type StreakData, type WeeklyGoals } from '@/lib/api/engagement';
import { type RewardData } from '@/components/engagement/RewardPopup';

/**
 * useRewards - Hook that checks for milestone achievements and queues reward popups
 * Mirrors Android's FeedRewardRepository logic
 */

const REWARDS_SHOWN_KEY = 'vormex_rewards_shown';

function getShownRewards(): Set<string> {
  try {
    const stored = localStorage.getItem(REWARDS_SHOWN_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markRewardShown(id: string) {
  try {
    const shown = getShownRewards();
    shown.add(id);
    // Keep only last 100 to avoid localStorage bloat
    const arr = Array.from(shown).slice(-100);
    localStorage.setItem(REWARDS_SHOWN_KEY, JSON.stringify(arr));
  } catch {
    // localStorage not available
  }
}

export function useRewards(userId?: string) {
  const [rewards, setRewards] = useState<RewardData[]>([]);

  useEffect(() => {
    if (!userId) return;

    const checkMilestones = async () => {
      const shown = getShownRewards();
      const newRewards: RewardData[] = [];

      try {
        const [streakData, goalsData] = await Promise.all([
          getStreaks().catch(() => null),
          getWeeklyGoals().catch(() => null),
        ]);

        // Streak milestones (3, 5, 7, 10, 14, 21, 30, 50, 100 days)
        if (streakData) {
          const milestones = [3, 5, 7, 10, 14, 21, 30, 50, 100];
          const streaks = [
            { key: 'connection', value: streakData.connectionStreak, label: 'Networking' },
            { key: 'login', value: streakData.loginStreak, label: 'Login' },
            { key: 'posting', value: streakData.postingStreak, label: 'Posting' },
            { key: 'messaging', value: streakData.messagingStreak, label: 'Messaging' },
          ];

          for (const s of streaks) {
            for (const m of milestones) {
              if (s.value === m) {
                const id = `streak_${s.key}_${m}`;
                if (!shown.has(id)) {
                  newRewards.push({
                    id,
                    type: 'streak_milestone',
                    title: `${m}-Day ${s.label} Streak! 🔥`,
                    message: `You've been consistent for ${m} days straight.`,
                    value: `${m} days`,
                    subtext: 'Keep it going!',
                    showConfetti: m >= 7,
                  });
                }
              }
            }
          }
        }

        // Weekly goals completed
        if (goalsData?.isCompleted) {
          const weekId = `weekly_goals_${new Date().toISOString().slice(0, 10)}`;
          if (!shown.has(weekId)) {
            newRewards.push({
              id: weekId,
              type: 'weekly_goal_complete',
              title: 'Weekly Goals Complete! 🎯',
              message: 'You crushed all your goals this week.',
              subtext: 'New goals reset next Monday',
              showConfetti: true,
            });
          }
        }

        // Limit to 2 popups per session
        setRewards(newRewards.slice(0, 2));
      } catch (error) {
        console.error('Failed to check milestones:', error);
      }
    };

    // Delay the check to not compete with feed loading
    const timer = setTimeout(checkMilestones, 3000);
    return () => clearTimeout(timer);
  }, [userId]);

  const dismissReward = useCallback((id: string) => {
    markRewardShown(id);
    setRewards(prev => prev.filter(r => r.id !== id));
  }, []);

  return { rewards, dismissReward };
}

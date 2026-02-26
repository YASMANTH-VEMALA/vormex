'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getRewardData,
  markRewardShown,
  type RewardDataResponse,
  type RewardCardType,
} from '@/lib/api/variable-rewards';

export interface ActiveRewardCard {
  type: RewardCardType;
  data: RewardDataResponse;
  position: number; // insert after this post index
}

/**
 * useVariableRewards — fetches reward data and determines which cards
 * to inject into the feed at variable-ratio positions.
 * Mirrors Android's RewardViewModel reward injection logic.
 */
export function useVariableRewards(userId: string | undefined) {
  const [rewardData, setRewardData] = useState<RewardDataResponse | null>(null);
  const [activeCards, setActiveCards] = useState<ActiveRewardCard[]>([]);
  const [shownCardTypes, setShownCardTypes] = useState<Set<string>>(new Set());
  const fetchedRef = useRef(false);

  const fetchRewards = useCallback(async () => {
    if (!userId || fetchedRef.current) return;
    fetchedRef.current = true;

    try {
      const data = await getRewardData();
      setRewardData(data);

      // Determine which cards to show (variable-ratio: not all at once)
      const available: { type: RewardCardType; priority: number }[] = [];

      if (data.hasNewMatches && data.matches.length > 0)
        available.push({ type: 'MATCH_BURST', priority: 1 });
      if (data.hasTrendingSpike && data.trendingData?.hasSpike)
        available.push({ type: 'TRENDING', priority: 2 });
      if (data.hasHiddenGems && data.hiddenGems.length > 0)
        available.push({ type: 'HIDDEN_GEM', priority: 3 });
      if (data.hasNewMilestones && data.milestones.length > 0)
        available.push({ type: 'MILESTONE', priority: 0 }); // highest priority
      if (data.hasNewOpportunities && data.opportunities.length > 0)
        available.push({ type: 'OPPORTUNITY', priority: 5 });
      if (data.hasNewViewers && data.viewers.length > 0)
        available.push({ type: 'SOCIAL_PROOF', priority: 4 });
      if (data.canGetSurpriseBoost && data.surpriseBoostData?.eligible)
        available.push({ type: 'SURPRISE_BOOST', priority: 0 });
      if (data.hasConnectionUpdates && data.connectionUpdates?.hasUpdates)
        available.push({ type: 'CONNECTION_UPDATE', priority: 2 });

      // Sort by priority, pick up to 3 cards per session (variable ratio)
      available.sort((a, b) => a.priority - b.priority);
      const maxCards = Math.min(available.length, 3);
      const selected = available.slice(0, maxCards);

      // Assign positions: after post 3, 7, 12 (variable spacing)
      const positions = [3, 7, 12];
      const cards: ActiveRewardCard[] = selected.map((s, i) => ({
        type: s.type,
        data,
        position: positions[i] || positions[positions.length - 1] + (i * 4),
      }));

      // Check localStorage for already-shown deduplication
      const shownKey = `rewards_shown_${new Date().toISOString().slice(0, 10)}`;
      const alreadyShown = new Set<string>(
        JSON.parse(localStorage.getItem(shownKey) || '[]')
      );
      const filtered = cards.filter(c => !alreadyShown.has(c.type));
      setActiveCards(filtered);
      setShownCardTypes(alreadyShown);
    } catch (err) {
      console.error('Failed to fetch reward data:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const dismissCard = useCallback(async (type: RewardCardType, itemIds: string[] = []) => {
    setActiveCards(prev => prev.filter(c => c.type !== type));

    // Persist to localStorage
    const shownKey = `rewards_shown_${new Date().toISOString().slice(0, 10)}`;
    const current = new Set<string>(
      JSON.parse(localStorage.getItem(shownKey) || '[]')
    );
    current.add(type);
    localStorage.setItem(shownKey, JSON.stringify([...current]));

    // Notify backend
    try {
      await markRewardShown(type, itemIds);
    } catch {
      // silent — non-critical
    }
  }, []);

  return { rewardData, activeCards, dismissCard };
}

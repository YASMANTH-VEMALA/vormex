'use client';

import { AnimatePresence } from 'framer-motion';
import type { ActiveRewardCard } from '@/hooks/useVariableRewards';
import type { RewardCardType } from '@/lib/api/variable-rewards';
import { MatchBurstCard } from './MatchBurstCard';
import { TrendingCard } from './TrendingCard';
import { HiddenGemCard } from './HiddenGemCard';
import { MilestoneCard } from './MilestoneCard';
import { OpportunityCard } from './OpportunityCard';
import { SocialProofCard } from './SocialProofCard';
import { SurpriseBoostCard } from './SurpriseBoostCard';
import { ConnectionUpdateCard } from './ConnectionUpdateCard';

interface RewardCardRendererProps {
  card: ActiveRewardCard;
  onDismiss: (type: RewardCardType, itemIds?: string[]) => void;
}

/**
 * RewardCardRenderer — renders the correct reward card based on type
 * Mirrors Android's `when(reward.type)` switch pattern
 */
export function RewardCardRenderer({ card, onDismiss }: RewardCardRendererProps) {
  const { type, data } = card;

  return (
    <AnimatePresence mode="wait">
      {type === 'MATCH_BURST' && (
        <MatchBurstCard
          matches={data.matches}
          onDismiss={() => onDismiss('MATCH_BURST', data.matches.map(m => m.id))}
        />
      )}
      {type === 'TRENDING' && data.trendingData && (
        <TrendingCard
          data={data.trendingData}
          onDismiss={() => onDismiss('TRENDING')}
        />
      )}
      {type === 'HIDDEN_GEM' && (
        <HiddenGemCard
          gems={data.hiddenGems}
          onDismiss={() => onDismiss('HIDDEN_GEM', data.hiddenGems.map(g => g.id))}
        />
      )}
      {type === 'MILESTONE' && (
        <MilestoneCard
          milestones={data.milestones}
          onDismiss={() => onDismiss('MILESTONE', data.milestones.map(m => m.id))}
        />
      )}
      {type === 'OPPORTUNITY' && (
        <OpportunityCard
          opportunities={data.opportunities}
          onDismiss={() => onDismiss('OPPORTUNITY', data.opportunities.map(o => o.id))}
        />
      )}
      {type === 'SOCIAL_PROOF' && (
        <SocialProofCard
          viewers={data.viewers}
          onDismiss={() => onDismiss('SOCIAL_PROOF', data.viewers.map(v => v.id))}
        />
      )}
      {type === 'SURPRISE_BOOST' && data.surpriseBoostData && (
        <SurpriseBoostCard
          data={data.surpriseBoostData}
          onDismiss={() => onDismiss('SURPRISE_BOOST')}
        />
      )}
      {type === 'CONNECTION_UPDATE' && data.connectionUpdates && (
        <ConnectionUpdateCard
          data={data.connectionUpdates}
          onDismiss={() => onDismiss('CONNECTION_UPDATE')}
        />
      )}
    </AnimatePresence>
  );
}

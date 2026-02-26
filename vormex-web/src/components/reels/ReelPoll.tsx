'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { reelsApi } from '@/lib/api/reels';

interface PollOption {
  id: number;
  text: string;
  votes: number;
}

interface ReelPollProps {
  reelId: string;
  question: string;
  options: PollOption[];
  userVotedOption: number | null;
  endsAt: string | null;
}

export function ReelPoll({
  reelId,
  question,
  options: initialOptions,
  userVotedOption: initialVote,
  endsAt,
}: ReelPollProps) {
  const [options, setOptions] = useState(initialOptions);
  const [votedOption, setVotedOption] = useState(initialVote);
  const [isVoting, setIsVoting] = useState(false);

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);
  const isEnded = endsAt ? new Date(endsAt) < new Date() : false;
  const hasVoted = votedOption !== null;

  const handleVote = useCallback(async (optionId: number) => {
    if (hasVoted || isVoting || isEnded) return;

    try {
      setIsVoting(true);
      const response = (await reelsApi.votePoll(reelId, optionId)) as unknown as {
        success: boolean;
        pollOptions: PollOption[];
        userVotedOption: number;
      };
      
      setOptions(response.pollOptions);
      setVotedOption(response.userVotedOption);
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
  }, [reelId, hasVoted, isVoting, isEnded]);

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const formatTimeLeft = () => {
    if (!endsAt) return null;
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d left`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  return (
    <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 space-y-3">
      <h3 className="text-white font-semibold text-lg">{question}</h3>
      
      <div className="space-y-2">
        {options.map((option) => {
          const percentage = getPercentage(option.votes);
          const isSelected = votedOption === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || isVoting || isEnded}
              className={cn(
                "relative w-full p-3 rounded-xl text-left transition-all overflow-hidden",
                hasVoted || isEnded
                  ? "bg-white/10"
                  : "bg-white/20 hover:bg-white/30 active:scale-[0.98]",
                isSelected && "ring-2 ring-white"
              )}
            >
              {(hasVoted || isEnded) && (
                <div
                  className={cn(
                    "absolute inset-0 transition-all",
                    isSelected ? "bg-blue-500/40" : "bg-white/10"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              <div className="relative flex items-center justify-between">
                <span className="text-white font-medium">{option.text}</span>
                {(hasVoted || isEnded) && (
                  <span className="text-white/80 font-semibold">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="flex items-center justify-between text-white/60 text-sm">
        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        {endsAt && <span>{formatTimeLeft()}</span>}
      </div>
    </div>
  );
}

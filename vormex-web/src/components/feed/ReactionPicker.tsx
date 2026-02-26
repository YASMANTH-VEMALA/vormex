'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ThumbsUp, 
  PartyPopper, 
  Heart, 
  Lightbulb, 
  HelpCircle 
} from 'lucide-react';
import type { ReactionType, ReactionSummary as ReactionSummaryType } from '@/types/post';

interface ReactionPickerProps {
  isOpen: boolean;
  currentReaction?: ReactionType | null;
  onSelect: (reaction: ReactionType) => void;
  onClose: () => void;
}

// Reaction configurations with LinkedIn-style icons
export const REACTIONS: {
  type: ReactionType;
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  hoverScale: number;
}[] = [
  { 
    type: 'LIKE', 
    icon: ThumbsUp, 
    label: 'Like', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    hoverScale: 1.3,
  },
  { 
    type: 'CELEBRATE', 
    icon: PartyPopper, 
    label: 'Celebrate', 
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    hoverScale: 1.3,
  },
  { 
    type: 'SUPPORT', 
    icon: Heart, 
    label: 'Support', 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    hoverScale: 1.3,
  },
  { 
    type: 'INSIGHTFUL', 
    icon: Lightbulb, 
    label: 'Insightful', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    hoverScale: 1.3,
  },
  { 
    type: 'CURIOUS', 
    icon: HelpCircle, 
    label: 'Curious', 
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    hoverScale: 1.3,
  },
];

// Helper to get reaction config by type
export function getReactionConfig(type: ReactionType) {
  return REACTIONS.find(r => r.type === type) || REACTIONS[0];
}

// Reaction icons for summary display
export function ReactionIcon({ 
  type, 
  size = 16,
  className = '' 
}: { 
  type: ReactionType; 
  size?: number;
  className?: string;
}) {
  const config = getReactionConfig(type);
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center justify-center rounded-full p-1 ${config.bgColor} ${className}`}>
      <Icon className={`${config.color}`} size={size} />
    </div>
  );
}

export function ReactionPicker({ 
  isOpen, 
  currentReaction,
  onSelect, 
  onClose 
}: ReactionPickerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          
          {/* Reaction picker */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="absolute bottom-full left-0 mb-2 z-50"
          >
            <div className="bg-white dark:bg-neutral-800 rounded-full shadow-lg border border-gray-200 dark:border-neutral-700 px-2 py-1.5 flex items-center gap-1">
              {REACTIONS.map((reaction) => {
                const Icon = reaction.icon;
                const isSelected = currentReaction === reaction.type;
                
                return (
                  <motion.button
                    key={reaction.type}
                    whileHover={{ scale: reaction.hoverScale, y: -8 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onSelect(reaction.type);
                      onClose();
                    }}
                    className={`relative p-2 rounded-full transition-colors group ${
                      isSelected 
                        ? reaction.bgColor 
                        : 'hover:bg-gray-100 dark:hover:bg-neutral-700'
                    }`}
                    title={reaction.label}
                  >
                    <Icon 
                      className={`w-6 h-6 transition-transform ${
                        isSelected ? reaction.color : 'text-gray-500 dark:text-neutral-400'
                      } group-hover:${reaction.color}`}
                    />
                    
                    {/* Tooltip */}
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-neutral-700 text-white text-xs rounded whitespace-nowrap pointer-events-none"
                    >
                      {reaction.label}
                    </motion.span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Summary of reactions (shows top 3 reaction icons)
export function ReactionSummaryDisplay({ 
  reactionSummary,
  totalCount,
  onClick,
}: { 
  reactionSummary: ReactionSummaryType[];
  totalCount: number;
  onClick?: () => void;
}) {
  if (totalCount === 0) return null;
  
  // Get top 3 unique reaction types
  const topReactions = reactionSummary.slice(0, 3);
  
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-gray-500 dark:text-neutral-400 hover:underline"
    >
      <div className="flex -space-x-1">
        {topReactions.map((reaction, index) => (
          <ReactionIcon 
            key={reaction.type} 
            type={reaction.type} 
            size={14}
            className="border-2 border-white dark:border-neutral-900"
          />
        ))}
      </div>
      <span>{totalCount}</span>
    </button>
  );
}

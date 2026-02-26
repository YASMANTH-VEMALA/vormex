'use client';

import { motion } from 'framer-motion';
import { X, Briefcase, MapPin, Clock, ExternalLink } from 'lucide-react';
import type { OpportunityData } from '@/lib/api/variable-rewards';

interface OpportunityCardProps {
  opportunities: OpportunityData[];
  onDismiss: () => void;
}

/**
 * OpportunityCard — Job/internship opportunities spotted
 * Teal gradient with opportunity details
 */
export function OpportunityCard({ opportunities, onDismiss }: OpportunityCardProps) {
  if (!opportunities.length) return null;
  const opp = opportunities[0];

  const timeAgo = (() => {
    const diff = Date.now() - new Date(opp.createdAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just posted';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="relative overflow-hidden rounded-xl border border-teal-200 dark:border-teal-800/50 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">
              New Opportunity 💼
            </p>
            <p className="text-[11px] text-teal-600/70 dark:text-teal-400/70">
              Matched to your profile
            </p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors">
          <X className="w-4 h-4 text-teal-400" />
        </button>
      </div>

      <div className="px-4 py-3">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          {opp.title}
        </h4>
        <p className="text-sm text-teal-700 dark:text-teal-300 font-medium mb-2">
          {opp.company}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-neutral-400">
          {opp.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {opp.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        </div>

        {opportunities.length > 1 && (
          <p className="text-[11px] text-teal-500 mt-2">
            +{opportunities.length - 1} more opportunit{opportunities.length - 1 > 1 ? 'ies' : 'y'}
          </p>
        )}
      </div>

      <div className="px-4 pb-4">
        <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors">
          <ExternalLink className="w-4 h-4" />
          View Details
        </button>
      </div>
    </motion.div>
  );
}

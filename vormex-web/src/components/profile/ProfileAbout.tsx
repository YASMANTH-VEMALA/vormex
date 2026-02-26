'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Activity,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Heart,
  Hash,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { ProfileUser, ProfileStats } from '@/types/profile';

interface ProfileAboutProps {
  user: ProfileUser;
  stats: ProfileStats;
  isOwner?: boolean;
  onRemoveInterest?: (interest: string) => void;
}

export function ProfileAbout({ user, stats, isOwner, onRemoveInterest }: ProfileAboutProps) {
  const [expanded, setExpanded] = useState(false);
  const bioPreviewLength = 200;

  const shouldShowExpandButton =
    user.bio && user.bio.length > bioPreviewLength;
  const displayBio = expanded
    ? user.bio
    : user.bio?.slice(0, bioPreviewLength) + (shouldShowExpandButton ? '...' : '');

  return (
    <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black rounded-none overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-neutral-100 dark:border-neutral-800">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2 uppercase">
          <BookOpen className="w-4 h-4" />
          About
        </h2>
      </div>

      <div className="p-4 sm:p-6">
        {/* Bio */}
        {user.bio ? (
          <div className="mb-8">
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap text-sm">
              {displayBio}
            </p>
            {shouldShowExpandButton && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-3 text-black dark:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:underline"
              >
                {expanded ? (
                  <>
                    Show less <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <p className="text-neutral-400 italic mb-8 text-sm">No bio added yet.</p>
        )}

        {/* Interests - Minimal */}
        {user.interests && user.interests.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Hash className="w-3 h-3" />
              Interests & Passions
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, index) => (
                <motion.span
                  key={interest}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200 text-xs font-medium border border-neutral-200 dark:border-neutral-800 select-none group"
                >
                  {interest}
                  {isOwner && onRemoveInterest && (
                    <button
                      onClick={() => onRemoveInterest(interest)}
                      className="p-0.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors"
                      title="Remove interest"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats - Monochrome Grid */}
        <div className="grid grid-cols-2 gap-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800">
          <StatCard
            icon={<Activity className="w-3 h-3 sm:w-4 sm:h-4" />}
            label="Active Days"
            value={stats.totalActiveDays}
          />
          <StatCard
            icon={<MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />}
            label="Posts"
            value={stats.totalPosts}
          />
          <StatCard
            icon={<TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />}
            label="Articles"
            value={stats.totalArticles}
          />
          <StatCard
            icon={<Heart className="w-3 h-3 sm:w-4 sm:h-4" />}
            label="Likes"
            value={stats.totalLikesReceived}
          />
        </div>

        {/* Education Info */}
        {(user.college || user.degree) && (
          <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">
              Education
            </h3>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-neutral-900 dark:text-white" />
              </div>
              <div>
                <p className="text-neutral-900 dark:text-white font-bold text-sm">
                  {user.degree || 'Student'}
                  {user.branch && ` in ${user.branch}`}
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-0.5">{user.college}</p>
                {(user.currentYear || user.graduationYear) && (
                  <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-1 font-medium">
                    {user.currentYear && `Year ${user.currentYear}`}
                    {user.currentYear && user.graduationYear && ' • '}
                    {user.graduationYear && `Class of ${user.graduationYear}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
      className="p-2.5 sm:p-4 bg-white dark:bg-black flex flex-col items-center justify-center text-center group transition-colors"
    >
      <div className="mb-1 sm:mb-2 text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors">
        {icon}
      </div>
      <p className="text-base sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
        {value.toLocaleString()}
      </p>
      <p className="text-[8px] sm:text-[10px] uppercase tracking-wider text-neutral-500 font-medium mt-0.5">
        {label}
      </p>
    </motion.div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, MessageSquare, FileText, Users, CheckCircle, X } from 'lucide-react';
import { getWeeklyGoals, getNudges, type WeeklyGoals, type ProgressNudge } from '@/lib/api/engagement';

/**
 * ProgressNudges - Weekly goals + nudge cards
 * Clean, professional design with subtle progress indicators
 */
export default function ProgressNudges() {
  const [goals, setGoals] = useState<WeeklyGoals | null>(null);
  const [nudges, setNudges] = useState<ProgressNudge[]>([]);
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [goalsData, nudgesData] = await Promise.all([
          getWeeklyGoals(),
          getNudges(),
        ]);
        setGoals(goalsData);
        setNudges(nudgesData);
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const dismissNudge = (type: string) => {
    setDismissedNudges(prev => new Set([...prev, type]));
  };

  if (loading) return null;

  const visibleNudges = nudges.filter(n => !dismissedNudges.has(n.type));

  return (
    <div className="space-y-3">
      {/* Weekly Goals */}
      {goals && !goals.isCompleted && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly Goals</h3>
            {goals.isCompleted && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Completed
              </span>
            )}
          </div>

          <div className="px-4 py-3 space-y-3">
            <GoalBar
              icon={<Users className="w-3.5 h-3.5 text-gray-400" />}
              label="Connections"
              current={goals.connectionsMade}
              target={goals.connectionsTarget}
              progress={goals.connectionsProgress}
            />
            <GoalBar
              icon={<FileText className="w-3.5 h-3.5 text-gray-400" />}
              label="Posts"
              current={goals.postsMade}
              target={goals.postsTarget}
              progress={goals.postsProgress}
            />
            <GoalBar
              icon={<MessageSquare className="w-3.5 h-3.5 text-gray-400" />}
              label="Messages"
              current={goals.messagesSent}
              target={goals.messagesTarget}
              progress={goals.messagesProgress}
            />
          </div>
        </div>
      )}

      {/* Nudges */}
      <AnimatePresence>
        {visibleNudges.map((nudge) => (
          <motion.div
            key={nudge.type}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-3"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-base mt-0.5">{nudge.icon}</span>
              <p className="flex-1 text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">{nudge.message}</p>
              <button
                onClick={() => dismissNudge(nudge.type)}
                className="p-0.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 text-gray-300 dark:text-neutral-500" />
              </button>
            </div>

            {nudge.target > 0 && nudge.progress >= 0 && (
              <div className="mt-2 ml-7">
                <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-1">
                  <motion.div
                    className="bg-blue-500 h-1 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((nudge.progress / nudge.target) * 100, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function GoalBar({
  icon,
  label,
  current,
  target,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  target: number;
  progress: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs text-gray-500 dark:text-neutral-400">{label}</span>
        </div>
        <span className="text-xs font-medium text-gray-700 dark:text-neutral-300 tabular-nums">
          {current}/{target}
        </span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-1.5">
        <motion.div
          className="bg-blue-500 h-1.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.8, delay: 0.1 }}
        />
      </div>
    </div>
  );
}

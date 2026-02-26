'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  initialData?: Record<string, unknown>;
  onComplete: (data: Record<string, unknown>) => void;
  saving: boolean;
}

const GOALS = [
  { id: 'learn_coding', label: 'Learn to Code', emoji: '💻', description: 'Master programming languages & build projects' },
  { id: 'web_dev', label: 'Web Development', emoji: '🌐', description: 'Build websites & web applications' },
  { id: 'mobile_dev', label: 'Mobile Development', emoji: '📱', description: 'Build Android/iOS apps' },
  { id: 'ai_ml', label: 'AI & Machine Learning', emoji: '🤖', description: 'Explore artificial intelligence & data' },
  { id: 'competitive_programming', label: 'Competitive Programming', emoji: '🏆', description: 'DSA, LeetCode & coding contests' },
  { id: 'start_business', label: 'Start a Business', emoji: '🚀', description: 'Build a startup & find co-founders' },
  { id: 'get_internship', label: 'Get an Internship', emoji: '💼', description: 'Land internships at top companies' },
  { id: 'design', label: 'UI/UX Design', emoji: '🎨', description: 'Create beautiful user experiences' },
  { id: 'data_science', label: 'Data Science', emoji: '📊', description: 'Analyze data & build insights' },
  { id: 'cybersecurity', label: 'Cybersecurity', emoji: '🔒', description: 'Ethical hacking & security' },
  { id: 'devops', label: 'DevOps & Cloud', emoji: '☁️', description: 'Deploy, scale & manage infrastructure' },
  { id: 'content_creation', label: 'Content Creation', emoji: '🎬', description: 'YouTube, blogging & tech content' },
  { id: 'research', label: 'Research & Academia', emoji: '🔬', description: 'Papers, publications & research' },
  { id: 'freelance', label: 'Freelancing', emoji: '💰', description: 'Build a freelance career' },
];

export default function StepGoals({ initialData, onComplete, saving }: Props) {
  const [primary, setPrimary] = useState<string>((initialData?.primaryGoal as string) || '');
  const [secondary, setSecondary] = useState<string[]>((initialData?.secondaryGoals as string[]) || []);

  const toggleSecondary = (id: string) => {
    if (id === primary) return;
    setSecondary(prev =>
      prev.includes(id)
        ? prev.filter(g => g !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const handlePrimarySelect = (id: string) => {
    setPrimary(id);
    setSecondary(prev => prev.filter(g => g !== id));
  };

  const canContinue = primary !== '';

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Select your <span className="font-semibold text-blue-500">primary goal</span>, then optionally pick up to 3 secondary interests
      </p>

      <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {GOALS.map((goal, i) => {
          const isPrimary = primary === goal.id;
          const isSecondary = secondary.includes(goal.id);
          const isSelected = isPrimary || isSecondary;

          return (
            <motion.button
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => {
                if (!primary || isPrimary) {
                  handlePrimarySelect(goal.id);
                } else {
                  toggleSecondary(goal.id);
                }
              }}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 group ${
                isPrimary
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-lg shadow-blue-500/10'
                  : isSecondary
                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/30'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
              }`}
            >
              {isPrimary && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  PRIMARY
                </span>
              )}
              <span className="text-2xl block mb-1">{goal.emoji}</span>
              <span className={`font-semibold text-sm block ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                {goal.label}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 leading-tight block mt-0.5">
                {goal.description}
              </span>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={() => onComplete({ primaryGoal: primary, secondaryGoals: secondary })}
        disabled={!canContinue || saving}
        className={`w-full py-4 rounded-2xl font-semibold text-white transition-all duration-200 ${
          canContinue && !saving
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25'
            : 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed'
        }`}
        whileTap={canContinue ? { scale: 0.98 } : {}}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </span>
        ) : (
          'Continue'
        )}
      </motion.button>
    </div>
  );
}

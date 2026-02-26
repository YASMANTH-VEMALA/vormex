'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  initialData?: Record<string, unknown>;
  onComplete: (data: Record<string, unknown>) => void;
  saving: boolean;
}

const OPTIONS = [
  {
    id: 'study_partner',
    label: 'Study Partner',
    emoji: '📚',
    description: 'Someone to study with regularly, share notes, and prepare for exams together',
  },
  {
    id: 'project_collaborator',
    label: 'Project Collaborator',
    emoji: '🛠️',
    description: 'A teammate to build projects, apps, or portfolios with',
  },
  {
    id: 'co_founder',
    label: 'Co-Founder',
    emoji: '🚀',
    description: 'A partner to start a business or side project with',
  },
  {
    id: 'mentor',
    label: 'Mentor',
    emoji: '🧭',
    description: 'An experienced person to guide you in your learning journey',
  },
  {
    id: 'mentee',
    label: 'Mentee',
    emoji: '🌱',
    description: 'Someone you can guide and help grow — teach what you know',
  },
  {
    id: 'accountability_buddy',
    label: 'Accountability Buddy',
    emoji: '🤝',
    description: 'A partner to keep each other on track with goals and deadlines',
  },
  {
    id: 'hackathon_team',
    label: 'Hackathon Teammate',
    emoji: '⚡',
    description: 'Find teammates for upcoming hackathons and coding competitions',
  },
];

export default function StepLookingFor({ initialData, onComplete, saving }: Props) {
  const [selected, setSelected] = useState<string[]>((initialData?.lookingFor as string[]) || []);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const canContinue = selected.length >= 1;

  return (
    <div className="space-y-5">
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        What kind of connections would help you the most? Select all that apply.
      </p>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
        {OPTIONS.map((option, i) => {
          const isActive = selected.includes(option.id);
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => toggle(option.id)}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                isActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg shadow-blue-500/10'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <span className="text-3xl flex-shrink-0 mt-0.5">{option.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className={`font-semibold block ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                  {option.label}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed block mt-0.5">
                  {option.description}
                </span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                isActive ? 'border-blue-500 bg-blue-500' : 'border-neutral-300 dark:border-neutral-600'
              }`}>
                {isActive && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </motion.svg>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={() => onComplete({ lookingFor: selected })}
        disabled={!canContinue || saving}
        className={`w-full py-4 rounded-2xl font-semibold text-white transition-all ${
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

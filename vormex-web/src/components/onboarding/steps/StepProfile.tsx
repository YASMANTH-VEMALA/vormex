'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  initialData?: Record<string, unknown>;
  onComplete: (data: Record<string, unknown>) => void;
  saving: boolean;
  userName: string;
  userCollege: string;
}

const GOALS = [
  { id: 'learn_coding', label: 'Coding & Tech', emoji: '💻' },
  { id: 'start_business', label: 'Business & Startups', emoji: '🚀' },
  { id: 'design', label: 'Design & Creative', emoji: '🎨' },
  { id: 'get_internship', label: 'Career & Internships', emoji: '💼' },
  { id: 'competitive_programming', label: 'Competitive Coding', emoji: '🏆' },
  { id: 'ai_ml', label: 'AI & Data Science', emoji: '🤖' },
  { id: 'content_creation', label: 'Content Creation', emoji: '🎬' },
  { id: 'research', label: 'Research & Academics', emoji: '🔬' },
  { id: 'sports_fitness', label: 'Sports & Fitness', emoji: '⚽' },
  { id: 'music_arts', label: 'Music & Arts', emoji: '🎵' },
  { id: 'photography', label: 'Photography & Film', emoji: '📸' },
  { id: 'freelance', label: 'Freelancing', emoji: '💰' },
];

const LOOKING_FOR = [
  { id: 'study_partner', label: 'Study Partner' },
  { id: 'project_collaborator', label: 'Project Mate' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'co_founder', label: 'Co-Founder' },
  { id: 'accountability_buddy', label: 'Accountability Buddy' },
  { id: 'hackathon_team', label: 'Hackathon Teammate' },
];

export default function StepProfile({ initialData, onComplete, saving, userName, userCollege }: Props) {
  const [college, setCollege] = useState<string>((initialData?.college as string) || userCollege || '');
  const [primaryGoal, setPrimaryGoal] = useState<string>((initialData?.primaryGoal as string) || '');
  const [lookingFor, setLookingFor] = useState<string[]>((initialData?.lookingFor as string[]) || []);

  const toggleLookingFor = (id: string) => {
    setLookingFor(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const canContinue = college.trim().length >= 2 && primaryGoal !== '';

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* College */}
      <div>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
          Your College / University *
        </label>
        <input
          type="text"
          placeholder="e.g. NIAT, VIT, IIT Bombay, JNTU..."
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-neutral-400 transition-all placeholder:text-neutral-400"
          autoFocus
        />
        <p className="text-xs text-neutral-400 mt-1.5">We&apos;ll match you with students from your campus first</p>
      </div>

      {/* Primary Goal */}
      <div>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
          What&apos;s your main focus right now? *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {GOALS.map((goal, i) => (
            <motion.button
              key={goal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setPrimaryGoal(goal.id)}
              className={`p-3 rounded-xl border text-center transition-all text-xs font-medium ${
                primaryGoal === goal.id
                  ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <span className="text-lg block mb-0.5">{goal.emoji}</span>
              {goal.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Looking For (optional) */}
      <div>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
          I&apos;m looking for <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {LOOKING_FOR.map(item => (
            <button
              key={item.id}
              onClick={() => toggleLookingFor(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                lookingFor.includes(item.id)
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Continue button */}
      <div className="mt-auto pt-4">
        <button
          onClick={() => onComplete({ college, primaryGoal, lookingFor, secondaryGoals: [] })}
          disabled={!canContinue || saving}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
            canContinue && !saving
              ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-[0.98]'
              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

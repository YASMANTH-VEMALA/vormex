'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  initialData?: Record<string, unknown>;
  onComplete: (data: Record<string, unknown>) => void;
  saving: boolean;
}

const TOPICS = [
  'Python', 'JavaScript', 'React', 'Next.js', 'Node.js', 'TypeScript',
  'Java', 'C++', 'DSA', 'System Design', 'Machine Learning', 'Deep Learning',
  'Web Development', 'Mobile Dev', 'Flutter', 'React Native', 'Android', 'iOS',
  'Data Science', 'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes',
  'AWS', 'DevOps', 'CI/CD', 'Git', 'Linux', 'Cybersecurity',
  'UI/UX Design', 'Figma', 'Graphic Design', 'Video Editing',
  'Business Strategy', 'Marketing', 'Sales', 'Finance', 'Product Management',
  'Public Speaking', 'Communication', 'Leadership', 'Time Management',
  'Blockchain', 'Web3', 'Game Development', 'Unity', 'AR/VR',
  'Competitive Programming', 'LeetCode', 'Resume Building', 'Interview Prep',
];

export default function StepLearnTeach({ initialData, onComplete, saving }: Props) {
  const [wantToLearn, setWantToLearn] = useState<string[]>((initialData?.wantToLearn as string[]) || []);
  const [canTeach, setCanTeach] = useState<string[]>((initialData?.canTeach as string[]) || []);
  const [activeTab, setActiveTab] = useState<'learn' | 'teach'>('learn');
  const [search, setSearch] = useState('');

  const toggleItem = (topic: string, list: 'learn' | 'teach') => {
    if (list === 'learn') {
      setWantToLearn(prev =>
        prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
      );
    } else {
      setCanTeach(prev =>
        prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
      );
    }
  };

  const filtered = search
    ? TOPICS.filter(t => t.toLowerCase().includes(search.toLowerCase()))
    : TOPICS;

  const canContinue = wantToLearn.length >= 1;

  return (
    <div className="space-y-5">
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        This powers our <span className="font-semibold text-blue-500">smart matching</span> — we&apos;ll connect you with people who can teach what you want to learn.
      </p>

      {/* Tab switcher */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('learn')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'learn'
              ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          I want to learn ({wantToLearn.length})
        </button>
        <button
          onClick={() => setActiveTab('teach')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'teach'
              ? 'bg-white dark:bg-neutral-900 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          I can teach ({canTeach.length})
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder={`Search topics to ${activeTab}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
      />

      {/* Selected tags */}
      {(activeTab === 'learn' ? wantToLearn : canTeach).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(activeTab === 'learn' ? wantToLearn : canTeach).map(t => (
            <span
              key={t}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                activeTab === 'learn'
                  ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                  : 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
              }`}
            >
              {t}
              <button
                onClick={() => toggleItem(t, activeTab)}
                className="hover:opacity-70"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Topics grid */}
      <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {filtered.map((topic, i) => {
          const isInLearn = wantToLearn.includes(topic);
          const isInTeach = canTeach.includes(topic);
          const isActive = activeTab === 'learn' ? isInLearn : isInTeach;

          return (
            <motion.button
              key={topic}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.01 }}
              onClick={() => toggleItem(topic, activeTab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? activeTab === 'learn'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : isInLearn || isInTeach
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 ring-1 ring-blue-300 dark:ring-blue-700'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {topic}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={() => onComplete({ wantToLearn, canTeach })}
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

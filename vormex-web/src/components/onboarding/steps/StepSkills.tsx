'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  initialData?: Record<string, unknown>;
  onComplete: (data: Record<string, unknown>) => void;
  saving: boolean;
}

const SKILL_CATEGORIES = [
  {
    label: 'Programming Languages',
    skills: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C', 'Go', 'Rust', 'Kotlin', 'Swift', 'PHP', 'Ruby', 'Dart'],
  },
  {
    label: 'Web & Frontend',
    skills: ['React', 'Next.js', 'Vue.js', 'Angular', 'HTML/CSS', 'Tailwind CSS', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot'],
  },
  {
    label: 'Mobile',
    skills: ['React Native', 'Flutter', 'Android (Kotlin)', 'iOS (Swift)', 'Jetpack Compose'],
  },
  {
    label: 'Data & AI',
    skills: ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Data Analysis', 'TensorFlow', 'PyTorch', 'Pandas'],
  },
  {
    label: 'DevOps & Cloud',
    skills: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'Linux', 'Terraform'],
  },
  {
    label: 'Other',
    skills: ['Git', 'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL', 'REST API', 'Firebase', 'Figma', 'Blockchain', 'Cybersecurity'],
  },
];

const PROFICIENCY = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

interface SkillEntry {
  name: string;
  proficiency: string;
  category: string;
}

export default function StepSkills({ initialData, onComplete, saving }: Props) {
  const [selected, setSelected] = useState<SkillEntry[]>((initialData?.skills as SkillEntry[]) || []);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(SKILL_CATEGORIES[0].label);

  const isSelected = (name: string) => selected.some(s => s.name === name);
  const getSkill = (name: string) => selected.find(s => s.name === name);

  const toggleSkill = (name: string, category: string) => {
    if (isSelected(name)) {
      setSelected(prev => prev.filter(s => s.name !== name));
    } else {
      setSelected(prev => [...prev, { name, proficiency: 'Beginner', category }]);
    }
  };

  const setProficiency = (name: string, proficiency: string) => {
    setSelected(prev => prev.map(s => s.name === name ? { ...s, proficiency } : s));
  };

  const canContinue = selected.length >= 1;

  return (
    <div className="space-y-5">
      <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        Select skills you have and set your level. Pick at least 1.
      </p>

      {/* Selected skills summary */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(skill => (
            <span
              key={skill.name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-sm"
            >
              <span className="font-medium text-blue-700 dark:text-blue-300">{skill.name}</span>
              <span className="text-blue-400 text-xs">({skill.proficiency})</span>
              <button
                onClick={() => toggleSkill(skill.name, skill.category)}
                className="ml-1 text-blue-400 hover:text-red-500 transition-colors"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Skill categories */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
        {SKILL_CATEGORIES.map(cat => (
          <div key={cat.label} className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <button
              onClick={() => setExpandedCategory(expandedCategory === cat.label ? null : cat.label)}
              className="w-full px-4 py-3 flex items-center justify-between bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <span className="font-medium text-sm text-neutral-700 dark:text-neutral-300">{cat.label}</span>
              <motion.span
                animate={{ rotate: expandedCategory === cat.label ? 180 : 0 }}
                className="text-neutral-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </motion.span>
            </button>
            
            <AnimateHeight isOpen={expandedCategory === cat.label}>
              <div className="px-4 pb-3 pt-1">
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map(skill => {
                    const sel = isSelected(skill);
                    const entry = getSkill(skill);
                    return (
                      <div key={skill} className="relative">
                        <button
                          onClick={() => toggleSkill(skill, cat.label)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            sel
                              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {skill}
                        </button>
                        {sel && entry && (
                          <div className="flex gap-0.5 mt-1 justify-center">
                            {PROFICIENCY.map((p, i) => (
                              <button
                                key={p}
                                onClick={() => setProficiency(skill, p)}
                                title={p}
                                className={`w-5 h-1.5 rounded-full transition-colors ${
                                  PROFICIENCY.indexOf(entry.proficiency as typeof PROFICIENCY[number]) >= i
                                    ? 'bg-blue-500'
                                    : 'bg-neutral-300 dark:bg-neutral-700'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </AnimateHeight>
          </div>
        ))}
      </div>

      <motion.button
        onClick={() => onComplete({ skills: selected, interests: selected.map(s => s.name) })}
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
          `Continue with ${selected.length} skill${selected.length !== 1 ? 's' : ''}`
        )}
      </motion.button>
    </div>
  );
}

function AnimateHeight({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{
        height: isOpen ? 'auto' : 0,
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </motion.div>
  );
}

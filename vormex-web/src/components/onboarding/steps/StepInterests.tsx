'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  initialData?: Record<string, unknown>;
  onComplete: (data: Record<string, unknown>) => void;
  saving: boolean;
}

const INTEREST_GROUPS = [
  {
    label: 'Tech & Engineering',
    items: ['Python', 'JavaScript', 'React', 'AI/ML', 'Data Science', 'Cybersecurity', 'Cloud/DevOps', 'Mobile Dev', 'Blockchain', 'Game Dev', 'DSA', 'Web Dev'],
  },
  {
    label: 'Business & Finance',
    items: ['Startups', 'Marketing', 'Finance', 'Investing', 'E-Commerce', 'Product Management', 'Sales', 'Accounting'],
  },
  {
    label: 'Creative & Design',
    items: ['UI/UX Design', 'Graphic Design', 'Video Editing', 'Photography', 'Animation', 'Illustration', 'Figma', '3D Modeling'],
  },
  {
    label: 'Content & Media',
    items: ['YouTube', 'Blogging', 'Podcasting', 'Social Media', 'Copywriting', 'Filmmaking', 'Journalism', 'Public Speaking'],
  },
  {
    label: 'Music & Arts',
    items: ['Guitar', 'Singing', 'Piano', 'Music Production', 'Dancing', 'Painting', 'Poetry', 'Theatre'],
  },
  {
    label: 'Sports & Fitness',
    items: ['Cricket', 'Football', 'Basketball', 'Badminton', 'Swimming', 'Gym/Fitness', 'Yoga', 'Running', 'Chess', 'Table Tennis'],
  },
  {
    label: 'Life & Growth',
    items: ['Leadership', 'Communication', 'Time Management', 'Networking', 'Mental Health', 'Reading', 'Volunteering', 'Travel'],
  },
  {
    label: 'Academic',
    items: ['Research', 'Competitive Exams', 'GATE', 'GRE', 'CAT', 'Interview Prep', 'Resume Building', 'Placements'],
  },
];

function normalizeCustomLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export default function StepInterests({ initialData, onComplete, saving }: Props) {
  const [selected, setSelected] = useState<string[]>((initialData?.interests as string[]) || []);
  const [canTeach, setCanTeach] = useState<string[]>((initialData?.canTeach as string[]) || []);
  const [search, setSearch] = useState('');
  const [customInput, setCustomInput] = useState('');

  const toggle = (item: string) => {
    setSelected(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleTeach = (item: string) => {
    if (!selected.includes(item)) return;
    setCanTeach(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const addCustom = () => {
    const label = normalizeCustomLabel(customInput);
    if (!label) return;
    const exists = selected.some(s => s.toLowerCase() === label.toLowerCase());
    if (exists) {
      setCustomInput('');
      return;
    }
    setSelected(prev => [...prev, label]);
    setCustomInput('');
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustom();
    }
  };

  const allItems = INTEREST_GROUPS.flatMap(g => g.items);
  const filtered = search
    ? allItems.filter(i => i.toLowerCase().includes(search.toLowerCase()))
    : null;

  const canContinue = selected.length >= 2;

  return (
    <div className="flex-1 flex flex-col gap-4">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Pick at least 2 interests from the list or add your own. Tap the star on any to mark it as something you can teach others.
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search interests..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all placeholder:text-neutral-400"
      />

      {/* Add your own skill / interest */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Add your own (e.g. Arduino, Karate)..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleCustomKeyDown}
          className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all placeholder:text-neutral-400"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="shrink-0 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      {/* Selected summary */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(item => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-medium"
            >
              {canTeach.includes(item) && <span className="text-yellow-300 dark:text-yellow-600">★</span>}
              {item}
              <button onClick={() => { toggle(item); setCanTeach(prev => prev.filter(i => i !== item)); }} className="ml-0.5 opacity-70 hover:opacity-100">&times;</button>
            </span>
          ))}
        </div>
      )}

      {/* Interest groups */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-4 max-h-[340px] custom-scrollbar">
        {filtered ? (
          <div className="flex flex-wrap gap-1.5">
            {filtered.map(item => {
              const isSelected = selected.includes(item);
              const isTeach = canTeach.includes(item);
              return (
                <div key={item} className="relative">
                  <button
                    onClick={() => toggle(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {item}
                  </button>
                  {isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleTeach(item); }}
                      title="I can teach this"
                      className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center ${
                        isTeach ? 'bg-yellow-400 text-black' : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      ★
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          INTEREST_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">{group.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map(item => {
                  const isSelected = selected.includes(item);
                  const isTeach = canTeach.includes(item);
                  return (
                    <div key={item} className="relative">
                      <button
                        onClick={() => toggle(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {item}
                      </button>
                      {isSelected && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleTeach(item); }}
                          title="I can teach this"
                          className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center transition-colors ${
                            isTeach ? 'bg-yellow-400 text-black' : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          ★
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Continue */}
      <div className="pt-3">
        <button
          onClick={() => onComplete({
            interests: selected,
            skills: selected.map(s => ({ name: s, proficiency: 'Beginner', category: 'General' })),
            canTeach,
            wantToLearn: selected.filter(s => !canTeach.includes(s)),
          })}
          disabled={!canContinue || saving}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
            canContinue && !saving
              ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-[0.98]'
              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {saving ? 'Finding your matches...' : `Continue with ${selected.length} interest${selected.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}

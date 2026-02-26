'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, X, Command, Code, Hash, Terminal, Users, Cpu, Edit2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { UserSkill } from '@/types/profile';

interface SkillsGridProps {
  skills: UserSkill[];
  isOwner: boolean;
  onAddSkill?: () => void;
  onRemoveSkill?: (id: string) => void;
  onEditSkill?: (skill: UserSkill) => void;
}

// Minimal Category icons - Monochrome
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Programming: <Code className="w-3 h-3" />,
  Design: <Hash className="w-3 h-3" />,
  Tools: <Terminal className="w-3 h-3" />,
  'Soft Skills': <Users className="w-3 h-3" />,
  default: <Cpu className="w-3 h-3" />,
};

export function SkillsGrid({
  skills,
  isOwner,
  onAddSkill,
  onRemoveSkill,
  onEditSkill,
}: SkillsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(
      skills.map((s) => s.skill.category || 'Other').filter(Boolean)
    );
    return Array.from(cats);
  }, [skills]);

  // Filter skills
  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      const matchesSearch = s.skill.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory ||
        (s.skill.category || 'Other') === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [skills, searchQuery, selectedCategory]);

  return (
    <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
      {/* Header - Minimal */}
      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
            Skills & Expertise
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            {skills.length} skills listed
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          {skills.length > 5 && (
            <div className="relative group">
              <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-black dark:group-focus-within:text-white" />
              <input
                type="text"
                placeholder="Find a skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs pl-8 pr-3 py-2 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-black dark:focus:border-white transition-all w-32 focus:w-48 placeholder-neutral-400"
              />
            </div>
          )}

          {/* Add Skill Button */}
          {isOwner && onAddSkill && (
            <button
              onClick={onAddSkill}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Skill
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs - Text only */}
      {categories.length > 1 && (
        <div className="px-6 pt-4 flex flex-wrap gap-x-6 gap-y-2 border-b border-neutral-50 dark:border-neutral-800/50 pb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-xs font-bold uppercase tracking-wider transition-colors relative ${!selectedCategory
              ? 'text-black dark:text-white'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`text-xs font-bold uppercase tracking-wider transition-colors relative ${selectedCategory === category
                ? 'text-black dark:text-white'
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Skills Grid - Minimal */}
      <div className="p-6">
        {skills.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800">
            <Command className="w-8 h-8 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No skills added yet.</p>
            {isOwner && onAddSkill && (
              <button
                onClick={onAddSkill}
                className="mt-3 text-xs font-bold underline decoration-neutral-300 underline-offset-4 hover:decoration-black dark:hover:decoration-white transition-all"
              >
                Add your first skill
              </button>
            )}
          </div>
        ) : filteredSkills.length === 0 ? (
          <p className="text-neutral-500 dark:text-neutral-400 text-sm py-4">
            No skills match your search.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredSkills.map((userSkill, index) => (
              <motion.div
                key={userSkill.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => isOwner && onEditSkill && onEditSkill(userSkill)}
                className={`group relative inline-flex items-center justify-between gap-3 pl-3 pr-2 py-2 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 transition-all select-none ${isOwner ? 'cursor-pointer hover:border-black dark:hover:border-white' : ''}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {userSkill.skill.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {userSkill.proficiency && (
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
                        {userSkill.proficiency}
                      </span>
                    )}
                    {userSkill.yearsOfExp && (
                      <>
                        <span className="w-0.5 h-0.5 bg-neutral-300 rounded-full" />
                        <span className="text-[10px] text-neutral-400 font-medium">
                          {userSkill.yearsOfExp}y
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {isOwner && onRemoveSkill ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSkill(userSkill.id);
                    }}
                    className="p-1 text-neutral-300 hover:text-red-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove skill"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  isOwner && (
                    <Edit2 className="w-3 h-3 text-neutral-300 opacity-0 group-hover:opacity-100" />
                  )
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

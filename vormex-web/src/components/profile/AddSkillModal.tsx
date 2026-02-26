'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Search, Plus, Loader2, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { addSkill, updateProfile, updateSkill, deleteSkill } from '@/lib/api/profile';
import type { SkillInput, UserSkill } from '@/types/profile';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkillAdded: (skill: UserSkill) => void;
  onSkillUpdated?: (skill: UserSkill) => void;
  onSkillDeleted?: (skillId: string) => void;
  onInterestAdded?: (interest: string) => void;
  existingSkills: string[];
  existingInterests?: string[];
  skillToEdit?: UserSkill | null;
}

// Universal Categories
const skillCategories = [
  { name: 'Tech', skills: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Flutter', 'Data Science', 'Cybersecurity'] },
  { name: 'Business', skills: ['Entrepreneurship', 'Dropshipping', 'E-commerce', 'Marketing', 'Sales', 'Project Management', 'Product Management'] },
  { name: 'Finance', skills: ['Trading', 'Investing', 'Crypto', 'Accounting', 'Stock Market', 'Financial Analysis', 'Real Estate'] },
  { name: 'Creative', skills: ['Video Editing', 'Content Creation', 'Graphic Design', 'UI/UX Design', 'Writing', 'Music Production', 'Photography'] },
  { name: 'Life Skills', skills: ['Public Speaking', 'Communication', 'Leadership', 'Time Management', 'Critical Thinking', 'Negotiation'] },
];

const proficiencyLevels = [
  { value: 'Beginner', label: 'Beginner', description: 'Just starting out' },
  { value: 'Intermediate', label: 'Intermediate', description: '1-2 years' },
  { value: 'Advanced', label: 'Advanced', description: '2-4 years' },
  { value: 'Expert', label: 'Expert', description: '4+ years' },
] as const;

export function AddSkillModal({
  isOpen,
  onClose,
  onSkillAdded,
  onSkillUpdated,
  onSkillDeleted,
  onInterestAdded,
  existingSkills,
  existingInterests = [],
  skillToEdit,
}: AddSkillModalProps) {
  const [mode, setMode] = useState<'SKILL' | 'INTEREST'>('SKILL');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>('Tech');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<SkillInput>({
    skillName: '',
    proficiency: 'Intermediate',
    yearsOfExp: 1,
  });

  // Load skill data when editing
  useEffect(() => {
    if (skillToEdit) {
      setMode('SKILL');
      setFormData({
        skillName: skillToEdit.skill.name,
        proficiency: (skillToEdit.proficiency as any) || 'Intermediate',
        yearsOfExp: skillToEdit.yearsOfExp || 1,
      });
      setSearchQuery(skillToEdit.skill.name);
    } else {
      // Reset
      setFormData({
        skillName: '',
        proficiency: 'Intermediate',
        yearsOfExp: 1,
      });
      setSearchQuery('');
    }
  }, [skillToEdit, isOpen]);

  // Filter based on search and category
  const filteredItems = skillCategories
    .filter((cat) => !selectedCategory || cat.name === selectedCategory)
    .flatMap((cat) => cat.skills)
    .filter((item) => {
      const matchesSearch = item.toLowerCase().includes(searchQuery.toLowerCase());
      const alreadyExists = mode === 'SKILL' ? existingSkills.includes(item) : existingInterests.includes(item);
      // If editing, allow current name
      if (skillToEdit && item === skillToEdit.skill.name) return matchesSearch;
      return matchesSearch && !alreadyExists;
    });

  const handleSelect = (name: string) => {
    setFormData((prev) => ({ ...prev, skillName: name }));
    setSearchQuery(name);
  };

  const handleDelete = async () => {
    if (!skillToEdit || !onSkillDeleted) return;
    if (!confirm('Are you sure you want to delete this skill?')) return;

    setDeleting(true);
    try {
      await deleteSkill(skillToEdit.id);
      onSkillDeleted(skillToEdit.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete skill');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.skillName.trim()) {
      setError(`Please select or enter a ${mode === 'SKILL' ? 'skill' : 'interest'}`);
      return;
    }

    const normalizedName = formData.skillName.trim();
    const normalizedNameLower = normalizedName.toLowerCase();

    // Duplicate check (skip if editing same skill)
    if (mode === 'SKILL' && !skillToEdit && existingSkills.some(s => s.toLowerCase() === normalizedNameLower)) {
      setError('You already have this skill');
      return;
    }

    if (mode === 'INTEREST' && existingInterests.some(i => i.toLowerCase() === normalizedNameLower)) {
      setError('You already have this interest');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (mode === 'SKILL') {
        if (skillToEdit) {
          // Update
          if (onSkillUpdated) {
            const updated = await updateSkill(skillToEdit.id, {
              proficiency: formData.proficiency,
              yearsOfExp: formData.yearsOfExp
            });
            onSkillUpdated(updated);
          }
        } else {
          // Add
          const skill = await addSkill(formData);
          onSkillAdded(skill);
        }
      } else {
        // Handle Interest Addition
        const newInterests = [...existingInterests, formData.skillName];
        await updateProfile({ interests: newInterests });
        if (onInterestAdded) onInterestAdded(formData.skillName);
      }

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${skillToEdit ? 'update' : 'add'} ${mode.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  const isEditMode = !!skillToEdit;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 transition-opacity"
                />
              </Dialog.Overlay>

              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 px-4"
                >
                  <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">

                    {/* Header with Mode Toggle */}
                    <div className="p-6 pb-0">
                      <div className="flex items-center justify-between mb-6">
                        <Dialog.Title className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
                          {isEditMode ? 'Edit Skill' : 'Add to Profile'}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                          <button className="text-neutral-400 hover:text-black dark:hover:text-white">
                            <X className="w-5 h-5" />
                          </button>
                        </Dialog.Close>
                      </div>

                      {/* Mode Switcher (Hide if editing) */}
                      {!isEditMode && (
                        <div className="grid grid-cols-2 border-b border-neutral-200 dark:border-neutral-800">
                          <button
                            type="button"
                            onClick={() => setMode('SKILL')}
                            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${mode === 'SKILL'
                              ? 'text-black dark:text-white'
                              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                              }`}
                          >
                            Skill
                            {mode === 'SKILL' && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 w-full h-[2px] bg-black dark:bg-white" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMode('INTEREST')}
                            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${mode === 'INTEREST'
                              ? 'text-black dark:text-white'
                              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                              }`}
                          >
                            Interest
                            {mode === 'INTEREST' && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 w-full h-[2px] bg-black dark:bg-white" />}
                          </button>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                      {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wide">
                          {error}
                        </div>
                      )}

                      {/* 1. Search & Suggestions (Disabled in edit mode usually, but allowed to change proficiency) */}
                      {!isEditMode ? (
                        <div className="space-y-4">
                          <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                              ref={searchInputRef}
                              type="text"
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setFormData((prev) => ({ ...prev, skillName: e.target.value }));
                              }}
                              placeholder={mode === 'SKILL' ? "e.g. Python, Trading..." : "e.g. Space, History..."}
                              className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            />
                          </div>

                          {/* Category Filter */}
                          <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {skillCategories.map((cat) => (
                              <button
                                key={cat.name}
                                type="button"
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${selectedCategory === cat.name ? 'text-black dark:text-white underline decoration-2 underline-offset-4' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                                  }`}
                              >
                                {cat.name}
                              </button>
                            ))}
                          </div>

                          {/* Grid */}
                          {(searchQuery || selectedCategory) && filteredItems.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1">
                              {filteredItems.slice(0, 15).map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => handleSelect(item)}
                                  className={`px-3 py-2 text-left text-xs font-medium border transition-all truncate ${formData.skillName === item
                                    ? 'bg-neutral-950 dark:bg-white border-neutral-950 dark:border-white text-white dark:text-black'
                                    : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400'
                                    }`}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-900">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Editing Skill</h3>
                          <p className="text-lg font-bold text-black dark:text-white">{skillToEdit.skill.name}</p>
                        </div>
                      )}

                      {/* 2. Proficiency & Experience (Only for Skill Mode) */}
                      {mode === 'SKILL' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Proficiency</label>
                            <div className="space-y-1">
                              {proficiencyLevels.map((level) => (
                                <button
                                  key={level.value}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, proficiency: level.value }))}
                                  className={`w-full flex items-center justify-between p-2 border ${formData.proficiency === level.value
                                    ? 'border-black dark:border-white'
                                    : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-800'
                                    }`}
                                >
                                  <span className="text-xs font-medium text-neutral-900 dark:text-white">{level.label}</span>
                                  {formData.proficiency === level.value && <div className="w-2 h-2 bg-black dark:bg-white rounded-full" />}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex justify-between">
                              <span>Experience</span>
                              <span>{formData.yearsOfExp}y</span>
                            </label>
                            <input
                              type="range"
                              min="0" max="15" step="0.5"
                              value={formData.yearsOfExp || 0}
                              onChange={(e) => setFormData(prev => ({ ...prev, yearsOfExp: parseFloat(e.target.value) }))}
                              className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 appearance-none accent-black dark:accent-white"
                            />
                            <p className="text-[10px] text-neutral-400">
                              How many years have you been practicing this skill?
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex gap-3 pt-2">
                        {isEditMode && onSkillDeleted && (
                          <Button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="w-14 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-none hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center shrink-0"
                          >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        )}
                        <Button
                          type="button"
                          onClick={onClose}
                          className="flex-1 py-4 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-none text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-900"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={saving || !formData.skillName.trim()}
                          className="flex-[2] py-4 bg-black dark:bg-white text-white dark:text-black rounded-none text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : (isEditMode ? 'Save Changes' : (mode === 'SKILL' ? 'Add Skill' : 'Add Interest'))}
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

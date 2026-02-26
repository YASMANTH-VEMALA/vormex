'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Code2,
  Loader2,
  Plus,
  Check,
  ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createExperience } from '@/lib/api/profile';
import { ImageUploadModal } from './ImageUploadModal';
import type { ExperienceInput, Experience } from '@/types/profile';

interface AddExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExperienceAdded: (experience: Experience) => void;
}

const experienceTypes = [
  'Internship',
  'Part-time',
  'Full-time',
  'Freelance',
  'Contract',
] as const;

export function AddExperienceModal({
  isOpen,
  onClose,
  onExperienceAdded,
}: AddExperienceModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [imageUploadOpen, setImageUploadOpen] = useState(false);

  const [formData, setFormData] = useState<ExperienceInput>({
    title: '',
    company: '',
    type: 'Internship',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    skills: [],
    logo: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
      ...(name === 'isCurrent' && checked ? { endDate: '' } : {}),
    }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills?.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((s) => s !== skill) || [],
    }));
  };

  const handleLogoUploaded = (logoUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      logo: logoUrl,
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Job title is required');
      return;
    }
    if (!formData.company.trim()) {
      setError('Company name is required');
      return;
    }
    if (!formData.startDate) {
      setError('Start date is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const experience = await createExperience(formData);
      onExperienceAdded(experience);
      // Reset form
      setFormData({
        title: '',
        company: '',
        type: 'Internship',
        location: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
        skills: [],
        logo: '',
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add experience');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 px-4"
                  >
                    <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-2xl">
                      {/* Header */}
                      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <Dialog.Title className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
                          Add Experience
                        </Dialog.Title>
                        <Dialog.Close asChild>
                          <button className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        </Dialog.Close>
                      </div>

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {error && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wide">
                            {error}
                          </div>
                        )}

                        <div className="flex gap-6">
                          {/* Logo Upload */}
                          <div className="shrink-0">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Logo</label>
                            <button
                              type="button"
                              onClick={() => setImageUploadOpen(true)}
                              className="w-24 h-24 border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:border-black dark:hover:border-white transition-colors flex flex-col items-center justify-center group relative overflow-hidden"
                            >
                              {formData.logo ? (
                                <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                              ) : (
                                <div className="flex flex-col items-center text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                  <ImageIcon className="w-6 h-6 mb-1" />
                                  <span className="text-[9px] font-bold uppercase">Upload</span>
                                </div>
                              )}
                            </button>
                          </div>

                          <div className="flex-1 space-y-4">
                            {/* Job Title */}
                            <div>
                              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Job Title</label>
                              <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                  type="text"
                                  name="title"
                                  value={formData.title}
                                  onChange={handleChange}
                                  placeholder="e.g. Software Engineer"
                                  className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                />
                              </div>
                            </div>

                            {/* Company */}
                            <div>
                              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Company</label>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                  type="text"
                                  name="company"
                                  value={formData.company}
                                  onChange={handleChange}
                                  placeholder="e.g. Google"
                                  className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Employment Type */}
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Employment Type</label>
                          <div className="flex flex-wrap gap-2">
                            {experienceTypes.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({ ...prev, type: type }))
                                }
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${formData.type === type
                                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                                  }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Location */}
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Location</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                              type="text"
                              name="location"
                              value={formData.location || ''}
                              onChange={handleChange}
                              placeholder="e.g. San Francisco"
                              className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            />
                          </div>
                        </div>

                        {/* Dates grid */}
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                          <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Start Date</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                              <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">End Date</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                              <input
                                type="date"
                                name="endDate"
                                value={formData.endDate || ''}
                                onChange={handleChange}
                                disabled={formData.isCurrent}
                                className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors disabled:opacity-50"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Currently Working Toggle */}
                        <div>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${formData.isCurrent ? 'bg-black dark:bg-white border-black dark:border-white' : 'border-neutral-300 dark:border-neutral-700'}`}>
                              {formData.isCurrent && <Check className="w-3 h-3 text-white dark:text-black" />}
                              <input type="checkbox" name="isCurrent" checked={formData.isCurrent} onChange={handleCheckboxChange} className="hidden" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">I currently work here</span>
                          </label>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Description</label>
                          <textarea
                            name="description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            placeholder="Describe your responsibilities and impact..."
                            rows={4}
                            className="w-full p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                          />
                        </div>

                        {/* Skills */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Skills Used</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={skillInput}
                              onChange={(e) => setSkillInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Add skill..."
                              className="flex-1 h-11 px-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            />
                            <button
                              type="button"
                              onClick={addSkill}
                              className="w-11 h-11 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {formData.skills && formData.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.skills.map((skill) => (
                                <span key={skill} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs font-bold uppercase tracking-wider border border-neutral-200 dark:border-neutral-800">
                                  {skill}
                                  <button
                                    type="button"
                                    onClick={() => removeSkill(skill)}
                                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex gap-3 pt-2">
                          <Button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-none text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-900"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={saving}
                            className="flex-[2] py-4 bg-black dark:bg-white text-white dark:text-black rounded-none text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              'Add Experience'
                            )}
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

      <ImageUploadModal
        isOpen={imageUploadOpen}
        onClose={() => setImageUploadOpen(false)}
        type="logo"
        onImageUpdated={handleLogoUploaded}
      />
    </>
  );
}

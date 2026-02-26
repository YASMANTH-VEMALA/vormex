'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  User,
  MapPin,
  Link2,
  Linkedin,
  Github,
  Globe,
  GraduationCap,
  Eye,
  Save,
  Loader2,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { updateProfile, updateAvatar, updateBanner } from '@/lib/api/profile';
import type { ProfileUser, ProfileUpdateData } from '@/types/profile';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileUser;
  onProfileUpdate: (updatedUser: Partial<ProfileUser>) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdate,
}: EditProfileModalProps) {
  const [activeSection, setActiveSection] = useState<'basic' | 'education' | 'links' | 'privacy'>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ProfileUpdateData>({
    headline: user.headline || '',
    bio: user.bio || '',
    location: user.location || '',
    currentYear: user.currentYear || undefined,
    degree: user.degree || '',
    graduationYear: user.graduationYear || undefined,
    portfolioUrl: user.portfolioUrl || '',
    linkedinUrl: user.linkedinUrl || '',
    profileVisibility: user.profileVisibility,
    isOpenToOpportunities: user.isOpenToOpportunities,
    interests: user.interests || [],
  });

  const [interestsInput, setInterestsInput] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const addInterest = () => {
    if (interestsInput.trim() && !formData.interests?.includes(interestsInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        interests: [...(prev.interests || []), interestsInput.trim()],
      }));
      setInterestsInput('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests?.filter((i) => i !== interest) || [],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await updateProfile(formData);
      onProfileUpdate(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: <User className="w-4 h-4" /> },
    { id: 'education', label: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'links', label: 'Links', icon: <Link2 className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Eye className="w-4 h-4" /> },
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Profile
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:text-white transition-colors rounded-lg hover:bg-gray-100 dark:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex h-[calc(90vh-140px)]">
            {/* Sidebar */}
            <div className="w-48 border-r border-gray-200 dark:border-neutral-800 p-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-neutral-800'
                  }`}
                >
                  {section.icon}
                  {section.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {activeSection === 'basic' && (
                  <motion.div
                    key="basic"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                        Headline
                      </label>
                      <input
                        type="text"
                        name="headline"
                        value={formData.headline}
                        onChange={handleChange}
                        placeholder="e.g., CSE 2nd year | Android & ML enthusiast"
                        maxLength={120}
                        className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 focus:border-blue-500 focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
                        {formData.headline?.length || 0}/120 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        maxLength={500}
                        className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 focus:border-blue-500 focus:outline-none resize-none"
                      />
                      <p className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
                        {formData.bio?.length || 0}/500 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Hyderabad, India"
                        className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                        Interests
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={interestsInput}
                          onChange={(e) => setInterestsInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                          placeholder="Add an interest"
                          className="flex-1 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 focus:border-blue-500 focus:outline-none"
                        />
                        <Button onClick={addInterest} className="bg-neutral-700 hover:bg-neutral-600">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.interests?.map((interest) => (
                          <span
                            key={interest}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-full text-sm"
                          >
                            {interest}
                            <button
                              onClick={() => removeInterest(interest)}
                              className="text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-neutral-800/50 rounded-lg">
                      <input
                        type="checkbox"
                        id="isOpenToOpportunities"
                        name="isOpenToOpportunities"
                        checked={formData.isOpenToOpportunities}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor="isOpenToOpportunities" className="text-gray-700 dark:text-neutral-300 text-sm">
                        Open to opportunities (internships, projects, mentoring)
                      </label>
                    </div>
                  </motion.div>
                )}

                {activeSection === 'education' && (
                  <motion.div
                    key="education"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                        Degree
                      </label>
                      <input
                        type="text"
                        name="degree"
                        value={formData.degree}
                        onChange={handleChange}
                        placeholder="e.g., B.Tech, BSc, BCA"
                        className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                          Current Year
                        </label>
                        <select
                          name="currentYear"
                          value={formData.currentYear || ''}
                          onChange={handleChange}
                          className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select year</option>
                          {[1, 2, 3, 4, 5].map((year) => (
                            <option key={year} value={year}>
                              Year {year}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                          Graduation Year
                        </label>
                        <input
                          type="number"
                          name="graduationYear"
                          value={formData.graduationYear || ''}
                          onChange={handleChange}
                          placeholder="e.g., 2026"
                          min={2020}
                          max={2035}
                          className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSection === 'links' && (
                  <motion.div
                    key="links"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                        <Globe className="w-4 h-4 inline mr-1" />
                        Portfolio URL
                      </label>
                      <input
                        type="url"
                        name="portfolioUrl"
                        value={formData.portfolioUrl}
                        onChange={handleChange}
                        placeholder="https://yourportfolio.com"
                        className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                        <Linkedin className="w-4 h-4 inline mr-1" />
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        name="linkedinUrl"
                        value={formData.linkedinUrl}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/yourprofile"
                        className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </motion.div>
                )}

                {activeSection === 'privacy' && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                        Profile Visibility
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: 'PUBLIC', label: 'Public', desc: 'Anyone can view your profile' },
                          { value: 'STUDENTS_ONLY', label: 'Students Only', desc: 'Only verified students can view' },
                          { value: 'CONNECTIONS', label: 'Connections Only', desc: 'Only your connections can view' },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              formData.profileVisibility === option.value
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-gray-300 dark:border-neutral-700 hover:border-neutral-600'
                            }`}
                          >
                            <input
                              type="radio"
                              name="profileVisibility"
                              value={option.value}
                              checked={formData.profileVisibility === option.value}
                              onChange={handleChange}
                              className="w-4 h-4"
                            />
                            <div>
                              <p className="text-gray-900 dark:text-white font-medium">{option.label}</p>
                              <p className="text-sm text-gray-600 dark:text-neutral-400">{option.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-neutral-800">
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


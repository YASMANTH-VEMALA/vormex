'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Trophy,
  Target,
  Medal,
  Gift,
  Sparkles,
  Loader2,
  Calendar,
  Building,
  Link as LinkIcon,
  FileText,
  Upload,
  ImageIcon,
  Trash2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createAchievement, updateAchievement } from '@/lib/api/profile';
import { uploadCertificate } from '@/lib/api/posts';
import type { Achievement, AchievementInput } from '@/types/profile';

const CARD_COLORS = [
  { name: 'Neutral', value: '#525252' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Green', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
];

interface AddAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAchievementAdded: (achievement: Achievement) => void;
  achievementToEdit?: Achievement | null;
  onAchievementUpdated?: (achievement: Achievement) => void;
}

// Achievement type options
const ACHIEVEMENT_TYPES = [
  { value: 'Hackathon', label: 'Hackathon', icon: <Target className="w-4 h-4" /> },
  { value: 'Competition', label: 'Competition', icon: <Trophy className="w-4 h-4" /> },
  { value: 'Award', label: 'Award', icon: <Medal className="w-4 h-4" /> },
  { value: 'Scholarship', label: 'Scholarship', icon: <Gift className="w-4 h-4" /> },
  { value: 'Recognition', label: 'Recognition', icon: <Sparkles className="w-4 h-4" /> },
] as const;

export function AddAchievementModal({
  isOpen,
  onClose,
  onAchievementAdded,
  achievementToEdit,
  onAchievementUpdated,
}: AddAchievementModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AchievementInput['type']>('Award');
  const [organization, setOrganization] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].value);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (achievementToEdit) {
        setTitle(achievementToEdit.title);
        setType(achievementToEdit.type);
        setOrganization(achievementToEdit.organization);
        setDate(achievementToEdit.date.split('T')[0]);
        setDescription(achievementToEdit.description || '');
        setCertificateUrl(achievementToEdit.certificateUrl || '');
        setSelectedColor(achievementToEdit.color || CARD_COLORS[0].value);

        if (achievementToEdit.certificateUrl) {
          if (achievementToEdit.certificateUrl.match(/\.(jpeg|jpg|png|webp)/i) ||
            achievementToEdit.certificateUrl.includes('bunnycdn')) {
            setCertificatePreview(achievementToEdit.certificateUrl);
            setUploadMethod('file');
          } else {
            setUploadMethod('url');
          }
        } else {
          setUploadMethod('file');
        }
      } else {
        resetForm();
      }
      setError(null);
    }
  }, [isOpen, achievementToEdit]);

  const resetForm = () => {
    setTitle('');
    setType('Award');
    setOrganization('');
    setDate('');
    setDescription('');
    setCertificateUrl('');
    setCertificateFile(null);
    setCertificatePreview(null);
    setUploadMethod('file');
    setSelectedColor(CARD_COLORS[0].value);
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      setCertificateFile(file);
      setCertificatePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    if (certificatePreview) {
      if (certificatePreview.startsWith('blob:')) {
        URL.revokeObjectURL(certificatePreview);
      }
    }
    setCertificateFile(null);
    setCertificatePreview(null);
    setCertificateUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!organization.trim()) {
      setError('Organization is required');
      return;
    }
    if (!date) {
      setError('Date is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalCertificateUrl = certificateUrl.trim();

      if (uploadMethod === 'file' && certificateFile) {
        setUploading(true);
        try {
          const result = await uploadCertificate(certificateFile);
          finalCertificateUrl = result.certificateUrl;
        } catch (uploadErr: any) {
          console.error('Failed to upload certificate:', uploadErr);
          setError('Failed to upload certificate image. Please try again.');
          setLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      } else if (uploadMethod === 'file' && certificatePreview && !certificateFile) {
        finalCertificateUrl = achievementToEdit?.certificateUrl || '';
      }

      const achievementData: AchievementInput = {
        title: title.trim(),
        type,
        organization: organization.trim(),
        date,
        description: description.trim() || undefined,
        certificateUrl: finalCertificateUrl || undefined,
        color: selectedColor,
      };

      if (achievementToEdit && onAchievementUpdated) {
        const updated = await updateAchievement(achievementToEdit.id, achievementData);
        onAchievementUpdated(updated);
      } else {
        const achievement = await createAchievement(achievementData);
        onAchievementAdded(achievement);
      }
      handleClose();
    } catch (err: any) {
      console.error('Failed to save achievement:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save achievement');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto z-50 px-4"
                >
                  <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-2xl">
                    {/* Header */}
                    <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                      <Dialog.Title className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase flex items-center gap-2">
                        <div style={{ color: selectedColor }}>
                          <Trophy className="w-5 h-5" />
                        </div>
                        {achievementToEdit ? 'Edit Achievement' : 'Add Achievement'}
                      </Dialog.Title>
                      <Dialog.Close asChild>
                        <button className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </Dialog.Close>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                      {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wide">
                          {error}
                        </div>
                      )}

                      {/* Achievement Type */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
                          Type
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {ACHIEVEMENT_TYPES.map((t) => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setType(t.value as AchievementInput['type'])}
                              className={`flex flex-col items-center gap-1.5 p-3 border transition-all ${type === t.value
                                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white'
                                }`}
                            >
                              {t.icon}
                              <span className="text-[9px] font-bold uppercase tracking-wider">{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Title</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. 1st Place Winner"
                          className="w-full h-11 px-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        />
                      </div>

                      {/* Organization */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Organization</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                            placeholder="e.g. Google"
                            className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                          />
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                          />
                        </div>
                      </div>

                      {/* Color Picker */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Card Color</label>
                        <div className="flex flex-wrap gap-2">
                          {CARD_COLORS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setSelectedColor(color.value)}
                              className={`w-8 h-8 rounded-none border border-neutral-200 dark:border-neutral-800 flex items-center justify-center transition-transform hover:scale-105 ${selectedColor === color.value ? 'ring-2 ring-black dark:ring-white ring-offset-2 dark:ring-offset-black' : ''}`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            >
                              {selectedColor === color.value && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Description</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe your achievement..."
                          rows={3}
                          className="w-full p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                        />
                      </div>

                      {/* Certificate Upload */}
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Proof / Certificate</label>

                        <div className="flex gap-2 mb-3">
                          <button
                            type="button"
                            onClick={() => setUploadMethod('file')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider border ${uploadMethod === 'file' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'}`}
                          >
                            Upload File
                          </button>
                          <button
                            type="button"
                            onClick={() => setUploadMethod('url')}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider border ${uploadMethod === 'url' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'}`}
                          >
                            Link URL
                          </button>
                        </div>

                        {uploadMethod === 'file' ? (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 h-32 flex flex-col items-center justify-center cursor-pointer hover:border-black dark:hover:border-white transition-colors group relative"
                          >
                            {certificatePreview ? (
                              <>
                                <img src={certificatePreview} alt="Preview" className="h-full object-contain p-2" />
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                                  className="absolute top-2 right-2 p-1 bg-black text-white"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-neutral-400 group-hover:text-black dark:group-hover:text-white mb-2" />
                                <span className="text-xs font-bold uppercase text-neutral-500">Click to Upload</span>
                              </>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                          </div>
                        ) : (
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                              type="url"
                              value={certificateUrl}
                              onChange={(e) => setCertificateUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full h-11 pl-10 pr-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            />
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 mt-6">
                        <Button
                          type="button"
                          onClick={handleClose}
                          className="flex-1 py-4 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-none text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-900"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading || uploading}
                          className="flex-[2] py-4 bg-black dark:bg-white text-white dark:text-black rounded-none text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                        >
                          {uploading ? 'Uploading...' : loading ? 'Saving...' : achievementToEdit ? 'Save Changes' : 'Add Achievement'}
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

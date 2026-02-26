'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Trophy,
  Plus,
  ExternalLink,
  Calendar,
  Medal,
  Target,
  Gift,
  Sparkles,
  Edit2,
  X,
  Building,
  FileText,
  Eye,
  Award,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Achievement } from '@/types/profile';

interface AchievementsProps {
  achievements: Achievement[];
  isOwner: boolean;
  onAddAchievement?: () => void;
  onEditAchievement?: (achievement: Achievement) => void;
}

// Achievement type icons
const TYPE_ICONS: Record<string, React.ReactNode> = {
  Hackathon: <Target className="w-5 h-5 text-white" />,
  Competition: <Trophy className="w-5 h-5 text-white" />,
  Award: <Medal className="w-5 h-5 text-white" />,
  Scholarship: <Gift className="w-5 h-5 text-white" />,
  Recognition: <Sparkles className="w-5 h-5 text-white" />,
};

export function Achievements({
  achievements,
  isOwner,
  onAddAchievement,
  onEditAchievement,
}: AchievementsProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  if (achievements.length === 0 && !isOwner) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isImageUrl = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowercaseUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowercaseUrl.includes(ext)) ||
      lowercaseUrl.includes('/certificates/') ||
      lowercaseUrl.includes('storage.bunnycdn.com');
  };

  return (
    <Card className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white uppercase flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Achievements
          <span className="text-xs font-medium text-neutral-500 ml-2">
            ({achievements.length})
          </span>
        </h2>

        {isOwner && onAddAchievement && (
          <button
            onClick={onAddAchievement}
            className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add New
          </button>
        )}
      </div>

      <div className="p-6">
        {achievements.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="w-12 h-12 mx-auto mb-4 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500 font-medium mb-4">No achievements added yet.</p>
            {isOwner && onAddAchievement && (
              <Button
                onClick={onAddAchievement}
                className="bg-black dark:bg-white text-white dark:text-black rounded-none text-xs font-bold uppercase tracking-wider px-6 py-3"
              >
                Add Your First Achievement
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => {
              const icon = TYPE_ICONS[achievement.type] || <Award className="w-5 h-5 text-white" />;
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 p-5 hover:border-black dark:hover:border-white transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 shrink-0 flex items-center justify-center border border-neutral-200 dark:border-neutral-800"
                      style={{ backgroundColor: achievement.color || '#525252' }}
                    >
                      {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide truncate mb-1">
                            {achievement.title}
                          </h4>
                          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                            {achievement.organization}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">
                        <span className="px-1.5 py-0.5 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {achievement.type}
                        </span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(achievement.date)}
                        </div>
                      </div>

                      {achievement.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
                          {achievement.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {achievement.certificateUrl && (
                      <button
                        onClick={() => setSelectedAchievement(achievement)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isOwner && onEditAchievement && (
                      <button
                        onClick={() => onEditAchievement(achievement)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievement Modal */}
      <Dialog.Root open={!!selectedAchievement} onOpenChange={(open) => !open && setSelectedAchievement(null)}>
        <AnimatePresence>
          {selectedAchievement && (
            <Dialog.Portal forceMount>
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
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black rounded-none shadow-2xl z-50 border border-neutral-200 dark:border-neutral-800"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <Dialog.Title className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase flex items-center gap-2">
                      <div style={{ color: selectedAchievement.color || '#525252' }}>
                        {TYPE_ICONS[selectedAchievement.type] || <Trophy className="w-5 h-5" />}
                      </div>
                      Certificate
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </Dialog.Close>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Certificate Image */}
                    {selectedAchievement.certificateUrl && isImageUrl(selectedAchievement.certificateUrl) ? (
                      <div className="mb-6 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2">
                        <img
                          src={selectedAchievement.certificateUrl}
                          alt={`${selectedAchievement.title} certificate`}
                          className="w-full h-auto object-contain max-h-[50vh]"
                        />
                      </div>
                    ) : selectedAchievement.certificateUrl && (
                      <div className="mb-6 p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                        <a
                          href={selectedAchievement.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-black dark:text-white hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Certificate Link
                        </a>
                      </div>
                    )}

                    {/* Achievement Details */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-1 border border-neutral-200 dark:border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                          {selectedAchievement.type}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight mb-2">
                        {selectedAchievement.title}
                      </h3>

                      <div className="flex items-center gap-2 text-neutral-500 mb-6">
                        <Building className="w-4 h-4" />
                        <span className="text-sm font-bold uppercase tracking-wider">{selectedAchievement.organization}</span>
                      </div>

                      <div className="flex items-center gap-2 text-neutral-500 font-bold text-xs uppercase tracking-wider mb-6">
                        <Calendar className="w-4 h-4" />
                        <span>{formatFullDate(selectedAchievement.date)}</span>
                      </div>

                      {selectedAchievement.description && (
                        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-2">Description</h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            {selectedAchievement.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </Card>
  );
}

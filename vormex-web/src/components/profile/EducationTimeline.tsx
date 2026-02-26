'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Plus,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit2,
  BookOpen,
  Award,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Education } from '@/types/profile';

interface EducationTimelineProps {
  education: Education[];
  isOwner: boolean;
  onAddEducation?: () => void;
  onEditEducation?: (education: Education) => void;
}

export function EducationTimeline({
  education,
  isOwner,
  onAddEducation,
  onEditEducation,
}: EducationTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (education.length === 0 && !isOwner) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white uppercase flex items-center gap-2">
          <GraduationCap className="w-4 h-4" />
          Education
          <span className="text-xs font-medium text-neutral-500 ml-2">
            ({education.length})
          </span>
        </h2>

        {isOwner && onAddEducation && (
          <button
            onClick={onAddEducation}
            className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add New
          </button>
        )}
      </div>

      <div className="p-6">
        {education.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="w-12 h-12 mx-auto mb-4 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500 font-medium mb-4">No education added yet.</p>
            {isOwner && onAddEducation && (
              <Button
                onClick={onAddEducation}
                className="bg-black dark:bg-white text-white dark:text-black rounded-none text-xs font-bold uppercase tracking-wider px-6 py-3"
              >
                Add Your First Education
              </Button>
            )}
          </div>
        ) : (
          <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-3 space-y-10 pl-8 py-2">
            {education.map((edu, index) => (
              <motion.div
                key={edu.id}
                initial={{ opacity: 0, x: -20, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative group"
              >
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[39px] top-1.5 w-5 h-5 border-4 transition-colors ${edu.isCurrent
                      ? 'bg-black dark:bg-white border-white dark:border-black ring-1 ring-black dark:ring-white scale-110'
                      : 'bg-white dark:bg-black border-neutral-200 dark:border-neutral-800'
                    }`}
                />

                <div className="flex gap-5">
                  {/* Icon Box */}
                  <div className="w-14 h-14 shrink-0 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-neutral-300 dark:text-neutral-700 group-hover:text-black dark:group-hover:text-white transition-colors" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide group-hover:underline decoration-1 underline-offset-4 cursor-pointer" onClick={() => setExpandedId(expandedId === edu.id ? null : edu.id)}>
                          {edu.school}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{edu.degree}</span>
                          <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{edu.fieldOfStudy}</span>
                        </div>
                      </div>

                      {isOwner && onEditEducation && (
                        <button
                          onClick={() => onEditEducation(edu)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Timeline Metas */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDate(edu.startDate)} — {edu.isCurrent ? 'Present' : (edu.endDate ? formatDate(edu.endDate) : 'N/A')}
                        </span>
                      </div>

                      {edu.grade && (
                        <div className="flex items-center gap-1.5 text-black dark:text-white">
                          <Award className="w-3 h-3" />
                          Grade: {edu.grade}
                        </div>
                      )}
                    </div>

                    {/* Description Toggle */}
                    {edu.description && (
                      <div className="mt-4">
                        <div className={`text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed ${expandedId === edu.id ? '' : 'line-clamp-2'}`}>
                          {edu.description}
                        </div>
                        {(edu.description.length > 100 || edu.description.includes('\n')) && (
                          <button
                            onClick={() => setExpandedId(expandedId === edu.id ? null : edu.id)}
                            className="mt-2 text-[10px] font-bold uppercase tracking-wider text-neutral-900 dark:text-white hover:opacity-70 flex items-center gap-1"
                          >
                            {expandedId === edu.id ? (
                              <>See Less <ChevronUp className="w-3 h-3" /></>
                            ) : (
                              <>Read More <ChevronDown className="w-3 h-3" /></>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Activities */}
                    {edu.activities && (
                      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Activities & Societies</span>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {edu.activities}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

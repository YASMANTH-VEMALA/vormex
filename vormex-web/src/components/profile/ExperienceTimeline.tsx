'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Plus,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit2,
  Building2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Experience } from '@/types/profile';

interface ExperienceTimelineProps {
  experiences: Experience[];
  isOwner: boolean;
  onAddExperience?: () => void;
  onEditExperience?: (experience: Experience) => void;
}

export function ExperienceTimeline({
  experiences,
  isOwner,
  onAddExperience,
  onEditExperience,
}: ExperienceTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (experiences.length === 0 && !isOwner) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateDuration = (start: string, end: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0 && remainingMonths > 0) {
      return `${years} yr ${remainingMonths} mo`;
    } else if (years > 0) {
      return `${years} yr${years > 1 ? 's' : ''}`;
    } else {
      return `${remainingMonths} mo`;
    }
  };

  return (
    <Card className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white uppercase flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Experience
          <span className="text-xs font-medium text-neutral-500 ml-2">
            ({experiences.length})
          </span>
        </h2>

        {isOwner && onAddExperience && (
          <button
            onClick={onAddExperience}
            className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add New
          </button>
        )}
      </div>

      <div className="p-6">
        {experiences.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="w-12 h-12 mx-auto mb-4 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500 font-medium mb-4">No experience added yet.</p>
            {isOwner && onAddExperience && (
              <Button
                onClick={onAddExperience}
                className="bg-black dark:bg-white text-white dark:text-black rounded-none text-xs font-bold uppercase tracking-wider px-6 py-3"
              >
                Add Your First Experience
              </Button>
            )}
          </div>
        ) : (
          <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-3 space-y-10 pl-8 py-2">
            {experiences.map((experience, index) => (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, x: -20, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative group"
              >
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[39px] top-1.5 w-5 h-5 border-4 transition-colors ${experience.isCurrent
                      ? 'bg-black dark:bg-white border-white dark:border-black ring-1 ring-black dark:ring-white scale-110'
                      : 'bg-white dark:bg-black border-neutral-200 dark:border-neutral-800'
                    }`}
                />

                <div className="flex gap-5">
                  {/* Logo - No Grayscale */}
                  <div className="w-14 h-14 shrink-0 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
                    {experience.logo ? (
                      <img src={experience.logo} alt={experience.company} className="w-full h-full object-contain p-2" />
                    ) : (
                      <Building2 className="w-6 h-6 text-neutral-300 dark:text-neutral-700" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide group-hover:underline decoration-1 underline-offset-4 cursor-pointer" onClick={() => setExpandedId(expandedId === experience.id ? null : experience.id)}>
                          {experience.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{experience.company}</span>
                          <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{experience.type}</span>
                        </div>
                      </div>

                      {isOwner && onEditExperience && (
                        <button
                          onClick={() => onEditExperience(experience)}
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
                          {formatDate(experience.startDate)} — {experience.isCurrent ? 'Present' : (experience.endDate ? formatDate(experience.endDate) : 'N/A')}
                        </span>
                        <span className="text-neutral-300 dark:text-neutral-700 mx-1">/</span>
                        <span>{calculateDuration(experience.startDate, experience.endDate)}</span>
                      </div>

                      {experience.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />
                          {experience.location}
                        </div>
                      )}
                    </div>

                    {/* Description Toggle */}
                    {experience.description && (
                      <div className="mt-4">
                        <div className={`text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed ${expandedId === experience.id ? '' : 'line-clamp-2'}`}>
                          {experience.description}
                        </div>
                        {(experience.description.length > 100 || experience.description.includes('\n')) && (
                          <button
                            onClick={() => setExpandedId(expandedId === experience.id ? null : experience.id)}
                            className="mt-2 text-[10px] font-bold uppercase tracking-wider text-neutral-900 dark:text-white hover:opacity-70 flex items-center gap-1"
                          >
                            {expandedId === experience.id ? (
                              <>See Less <ChevronUp className="w-3 h-3" /></>
                            ) : (
                              <>Read More <ChevronDown className="w-3 h-3" /></>
                            )}
                          </button>
                        )}
                      </div>
                    )}


                    {/* Skills */}
                    {experience.skills && experience.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-4">
                        {experience.skills.map(skill => (
                          <span key={skill} className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-900 text-[10px] font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 uppercase tracking-wider">
                            {skill}
                          </span>
                        ))}
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

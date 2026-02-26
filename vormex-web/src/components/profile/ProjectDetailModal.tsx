'use client';

import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
    X,
    ExternalLink,
    Github,
    Calendar,
    Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Project } from '@/types/profile';

interface ProjectDetailModalProps {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ProjectDetailModal({
    project,
    isOpen,
    onClose,
}: ProjectDetailModalProps) {
    if (!project) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    };

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
                                    className="fixed inset-0 bg-neutral-950/90 backdrop-blur-sm z-50 transition-opacity"
                                />
                            </Dialog.Overlay>

                            <Dialog.Content asChild>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl z-50 px-4"
                                >
                                    <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">

                                        {/* Header Image Area */}
                                        <div className="relative h-48 md:h-64 bg-neutral-100 dark:bg-neutral-900 overflow-hidden shrink-0">
                                            {project.images && project.images.length > 0 ? (
                                                <img
                                                    src={project.images[0]}
                                                    alt={project.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-neutral-300 dark:text-neutral-700">
                                                    <Folder className="w-16 h-16" />
                                                </div>
                                            )}

                                            {/* Close Button overlay */}
                                            <div className="absolute top-4 right-4 z-10">
                                                <button
                                                    onClick={onClose}
                                                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content Scrollable Area */}
                                        <div className="p-6 md:p-8 overflow-y-auto">

                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                                                <div>
                                                    <Dialog.Title className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white uppercase mb-2">
                                                        {project.name}
                                                    </Dialog.Title>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 font-medium">
                                                        {project.role && (
                                                            <span className="uppercase tracking-wider">{project.role}</span>
                                                        )}
                                                        {(project.role && (project.startDate || project.endDate)) && <span>•</span>}
                                                        <span className="flex items-center gap-1.5 uppercase tracking-wider">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {formatDate(project.startDate)}
                                                            {project.endDate ? ` — ${formatDate(project.endDate)}` : ' — Present'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 leading-relaxed mb-8">
                                                <p className="whitespace-pre-wrap">{project.description}</p>
                                            </div>

                                            {/* Tech Stack */}
                                            {project.techStack && project.techStack.length > 0 && (
                                                <div className="mb-8 p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800">
                                                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Technologies</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {project.techStack.map(tech => (
                                                            <span key={tech} className="px-3 py-1.5 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                                                                {tech}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        </div>

                                        {/* Footer Actions */}
                                        <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex gap-3 shrink-0">
                                            {project.projectUrl && (
                                                <a
                                                    href={project.projectUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1"
                                                >
                                                    <Button className="w-full py-6 bg-black dark:bg-white text-white dark:text-black rounded-none text-xs font-bold uppercase tracking-wider hover:opacity-90 flex items-center justify-center gap-2">
                                                        <ExternalLink className="w-4 h-4" />
                                                        View Live Project
                                                    </Button>
                                                </a>
                                            )}
                                            {project.githubUrl && (
                                                <a
                                                    href={project.githubUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1"
                                                >
                                                    <Button className="w-full py-6 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-none text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center justify-center gap-2">
                                                        <Github className="w-4 h-4" />
                                                        View Source Code
                                                    </Button>
                                                </a>
                                            )}
                                            {!project.projectUrl && !project.githubUrl && (
                                                <div className="w-full text-center text-xs text-neutral-400 font-medium italic py-2">
                                                    No external links available
                                                </div>
                                            )}
                                        </div>

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

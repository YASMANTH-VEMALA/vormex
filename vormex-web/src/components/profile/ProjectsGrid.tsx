'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Folder,
  ExternalLink,
  Github,
  Star,
  Plus,
  Code,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProjectDetailModal } from './ProjectDetailModal';
import type { Project } from '@/types/profile';

interface ProjectsGridProps {
  projects: Project[];
  isOwner: boolean;
  onAddProject?: () => void;
  onToggleFeatured?: (id: string) => void;
  onEditProject?: (project: Project) => void;
}

export function ProjectsGrid({
  projects,
  isOwner,
  onAddProject,
  onToggleFeatured,
  onEditProject,
}: ProjectsGridProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Separate featured and regular projects
  const featuredProjects = projects.filter((p) => p.featured);
  const regularProjects = projects.filter((p) => !p.featured);

  if (projects.length === 0 && !isOwner) {
    return null;
  }

  return (
    <>
      <Card className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white uppercase flex items-center gap-2">
            <Code className="w-4 h-4" />
            Projects & Work
            <span className="text-xs font-medium text-neutral-500 ml-2">
              ({projects.length})
            </span>
          </h2>

          {isOwner && onAddProject && (
            <button
              onClick={onAddProject}
              className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add New
            </button>
          )}
        </div>

        <div className="p-6">
          {projects.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="w-12 h-12 mx-auto mb-4 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                <Folder className="w-5 h-5 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-500 font-medium mb-4">No projects showcased yet.</p>
              {isOwner && onAddProject && (
                <Button
                  onClick={onAddProject}
                  className="bg-black dark:bg-white text-white dark:text-black rounded-none text-xs font-bold uppercase tracking-wider px-6 py-3"
                >
                  Add Your First Project
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Featured Projects */}
              {featuredProjects.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                    <Star className="w-3 h-3" />
                    Featured Work
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featuredProjects.map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        isOwner={isOwner}
                        onToggleFeatured={onToggleFeatured}
                        onEdit={onEditProject}
                        onClick={() => setSelectedProject(project)}
                        index={index}
                        featured
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Projects */}
              {regularProjects.length > 0 && (
                <div className="space-y-4">
                  {featuredProjects.length > 0 && (
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider pt-4 border-t border-neutral-100 dark:border-neutral-800">
                      All Projects
                    </h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regularProjects.map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        isOwner={isOwner}
                        onToggleFeatured={onToggleFeatured}
                        onEdit={onEditProject}
                        onClick={() => setSelectedProject(project)}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <ProjectDetailModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </>
  );
}

interface ProjectCardProps {
  project: Project;
  isOwner: boolean;
  onToggleFeatured?: (id: string) => void;
  onEdit?: (project: Project) => void;
  onClick: () => void;
  index: number;
  featured?: boolean;
}

function ProjectCard({
  project,
  isOwner,
  onToggleFeatured,
  onEdit,
  onClick,
  index,
  featured,
}: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`group relative bg-white dark:bg-black border transition-all cursor-pointer ${featured
        ? 'border-black dark:border-white shadow-sm'
        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
        }`}
    >
      {/* Project Image */}
      <div className="aspect-video bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 overflow-hidden relative">
        {project.images && project.images.length > 0 ? (
          <img
            src={project.images[0]}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300 dark:text-neutral-700">
            <Folder className="w-8 h-8" />
          </div>
        )}

        {/* Hover Actions Overlay */}
        {isOwner && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
            {onToggleFeatured && (
              <button
                onClick={() => onToggleFeatured(project.id)}
                className={`p-1.5 bg-black dark:bg-white text-white dark:text-black border border-transparent hover:opacity-80 transition-opacity ${project.featured ? 'opacity-100' : 'opacity-50'
                  }`}
                title={project.featured ? 'Unfeature' : 'Feature'}
              >
                <Star className={`w-3 h-3 ${project.featured ? 'fill-current' : ''}`} />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(project)}
                className="p-1.5 bg-white dark:bg-black text-black dark:text-white border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1 group-hover:underline decoration-1 underline-offset-4">
          {project.name}
        </h4>

        {project.role && (
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">{project.role}</p>
        )}

        <p className="text-neutral-600 dark:text-neutral-400 text-xs leading-relaxed line-clamp-2 mb-4 h-8">
          {project.description}
        </p>

        {/* Tech Stack - Minimal Tags */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 h-5 overflow-hidden">
            {project.techStack.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-900 text-[10px] font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 uppercase tracking-wider"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 3 && (
              <span className="text-[10px] text-neutral-400 px-1 py-0.5">+{project.techStack.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer: Date & Links */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
            {formatDate(project.startDate)}
            {project.endDate ? ` — ${formatDate(project.endDate)}` : ' — Present'}
          </div>

          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {project.projectUrl && (
              <a
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-900 dark:text-white hover:opacity-70 transition-opacity"
                title="Live Demo"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-900 dark:text-white hover:opacity-70 transition-opacity"
                title="GitHub Code"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

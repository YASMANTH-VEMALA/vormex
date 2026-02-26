'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Play,
  CheckCircle,
  Clock,
  BookOpen,
  Users,
  Star,
  X,
  ChevronDown,
  ChevronUp,
  Workflow
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface Lesson {
  id: number;
  title: string;
  videoId: string;
  duration?: string;
  description?: string;
}

const courseData = {
  title: 'N8N Automation Course',
  description: 'Complete course on N8N workflow automation - from basics to advanced agents, APIs, and real-world projects. Learn to build powerful automations in Telugu.',
  instructor: 'Vormex',
  language: 'Telugu',
  totalLessons: 13,
  category: 'Automation',
  difficulty: 'Beginner to Advanced',
  lessons: [
    {
      id: 1,
      title: 'Foundations for agents, automations, LLMs - Part 1',
      videoId: '0sMiHDipuVc',
      description: 'Introduction to N8N, agents, automations, and LLMs fundamentals.'
    },
    {
      id: 2,
      title: 'N8N Account Setup - Part 2',
      videoId: '8ySQ8i0_5bE',
      description: 'Step-by-step guide to setting up your N8N account.'
    },
    {
      id: 3,
      title: 'First Workflow & Google Credentials - Part 3',
      videoId: 'iPcGsMto6ds',
      description: 'Create your first workflow and set up Google credentials.'
    },
    {
      id: 4,
      title: 'Localhost Expose - Part 4',
      videoId: 'x0aiYUjOVhI',
      description: 'Learn how to expose your localhost for webhooks and testing.'
    },
    {
      id: 5,
      title: 'Webhooks, Nodes, Triggers, Data Types & Conditions - Part 5',
      videoId: 'LHnF5QFLbvk',
      description: 'Deep dive into webhooks, important nodes, triggers, data types, and conditions.'
    },
    {
      id: 6,
      title: 'Agent, APIs & Telegram Workflow - Part 6',
      videoId: 'rlcCInWzhkc',
      description: 'Build an agent with APIs and create a Telegram bot workflow.'
    },
    {
      id: 7,
      title: 'Multi Agents - Part 7',
      videoId: '3IGaqJnPHRQ',
      description: 'Learn to work with multiple agents in N8N.'
    },
    {
      id: 8,
      title: 'Ecommerce Shopify - Part 8',
      videoId: 'GPh_e6WZAhc',
      description: 'Integrate N8N with Shopify for ecommerce automation.'
    },
    {
      id: 9,
      title: 'RAG Automation - Part 9',
      videoId: 'zD25mepqqbE',
      description: 'Implement Retrieval-Augmented Generation (RAG) automation.'
    },
    {
      id: 10,
      title: 'Email Voice Agent - Part 10',
      videoId: 'ehaJ46VeU18',
      description: 'Build an email voice agent automation.'
    },
    {
      id: 11,
      title: 'LinkedIn Posts Creation - Part 11',
      videoId: 'J9Sb0jYQmow',
      description: 'Automate LinkedIn post creation with N8N.'
    },
    {
      id: 12,
      title: 'YouTube Creatomate Automation - Part 12',
      videoId: '9COKtFo3tq4',
      description: 'Create YouTube content automation with Creatomate.'
    },
    {
      id: 13,
      title: 'Leads Generation Automation - Part 13',
      videoId: 'AmoLJl1t_pI',
      description: 'Build a leads generation automation system.'
    }
  ] as Lesson[]
};

function N8NCourseContent() {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  const handleLessonClick = (lesson: Lesson) => {
    setCurrentLesson(lesson);
  };

  const handleMarkComplete = (lessonId: number) => {
    setCompletedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const progress = Math.round((completedLessons.size / courseData.lessons.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-24">
      {/* Video Player Modal */}
      <AnimatePresence>
        {currentLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentLesson(null)}
                  className="p-2 -ml-2 rounded-full hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
                <div>
                  <p className="text-xs text-gray-500">Lesson {currentLesson.id} of {courseData.lessons.length}</p>
                  <h2 className="font-medium text-white text-sm sm:text-base line-clamp-1">{currentLesson.title}</h2>
                </div>
              </div>
              <button
                onClick={() => handleMarkComplete(currentLesson.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  completedLessons.has(currentLesson.id)
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {completedLessons.has(currentLesson.id) ? 'Completed' : 'Mark Complete'}
                </span>
              </button>
            </div>

            {/* Video Container */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-5xl aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube-nocookie.com/embed/${currentLesson.videoId}?autoplay=1`}
                  title={currentLesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="rounded-lg"
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="px-4 py-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between">
              <button
                onClick={() => {
                  const prevLesson = courseData.lessons.find(l => l.id === currentLesson.id - 1);
                  if (prevLesson) setCurrentLesson(prevLesson);
                }}
                disabled={currentLesson.id === 1}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-neutral-800 text-gray-300 hover:bg-neutral-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => {
                  const nextLesson = courseData.lessons.find(l => l.id === currentLesson.id + 1);
                  if (nextLesson) setCurrentLesson(nextLesson);
                }}
                disabled={currentLesson.id === courseData.lessons.length}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Next
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/learning" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{courseData.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{courseData.totalLessons} lessons • {courseData.language}</p>
          </div>
        </div>
      </div>

      {/* Course Info Card */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden mb-6">
          {/* Course Thumbnail */}
          <div className="aspect-video bg-gradient-to-br from-[#FF6D5A]/20 via-[#EA4B71]/20 to-[#7B61FF]/20 flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="https://n8n.io/favicon.ico" 
                alt="n8n Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                {courseData.category}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                {courseData.difficulty}
              </span>
            </div>
          </div>

          {/* Course Details */}
          <div className="p-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{courseData.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{courseData.description}</p>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>{courseData.totalLessons} lessons</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{courseData.language}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500" />
                <span>Vormex</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Your Progress</span>
                <span className="font-medium text-gray-900 dark:text-white">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {completedLessons.size} of {courseData.lessons.length} lessons completed
              </p>
            </div>

            {/* Start/Continue Button */}
            <button
              onClick={() => {
                const nextIncomplete = courseData.lessons.find(l => !completedLessons.has(l.id));
                setCurrentLesson(nextIncomplete || courseData.lessons[0]);
              }}
              className="w-full py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {completedLessons.size === 0 ? 'Start Course' : completedLessons.size === courseData.lessons.length ? 'Watch Again' : 'Continue Learning'}
            </button>
          </div>
        </div>

        {/* Lessons List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Course Content</h3>
          {courseData.lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden"
            >
              <button
                onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  completedLessons.has(lesson.id)
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {completedLessons.has(lesson.id) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{lesson.id}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{lesson.title}</h4>
                </div>
                {expandedLesson === lesson.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>

              <AnimatePresence>
                {expandedLesson === lesson.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1">
                      {lesson.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{lesson.description}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLessonClick(lesson)}
                          className="flex-1 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Watch Lesson
                        </button>
                        <button
                          onClick={() => handleMarkComplete(lesson.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            completedLessons.has(lesson.id)
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Completion Message */}
        {completedLessons.size === courseData.lessons.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-400 mb-2">
              Congratulations!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              You've completed the N8N Automation Course. You're now ready to build powerful automations!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function N8NCoursePage() {
  return (
    <ProtectedRoute>
      <N8NCourseContent />
    </ProtectedRoute>
  );
}

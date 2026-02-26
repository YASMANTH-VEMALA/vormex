'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  BookOpen,
  Clock,
  Users,
  Workflow,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface Course {
  id: string;
  title: string;
  description: string;
  lessons: number;
  category: string;
  difficulty: string;
  language: string;
  logo?: string;
  icon?: React.ReactNode;
  href: string;
  gradient: string;
}

const courses: Course[] = [
  {
    id: 'n8n',
    title: 'N8N Automation Course',
    description: 'Complete course on N8N workflow automation - from basics to advanced agents, APIs, and real-world projects.',
    lessons: 13,
    category: 'Automation',
    difficulty: 'Beginner to Advanced',
    language: 'Telugu',
    logo: 'https://n8n.io/favicon.ico',
    href: '/courses/n8n',
    gradient: 'from-[#FF6D5A]/20 via-[#EA4B71]/20 to-[#7B61FF]/20'
  }
];

const categories = ['All', 'Automation', 'Web Development', 'Mobile', 'AI/ML'];

function CoursesContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/learning" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Courses</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{courses.length} courses available</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">No courses found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={course.href}
                  className="block bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden hover:border-gray-300 dark:hover:border-neutral-700 transition-colors"
                >
                  {/* Course Thumbnail */}
                  <div className={`aspect-[3/1] bg-gradient-to-br ${course.gradient} flex items-center justify-center relative`}>
                    <div className="flex items-center justify-center">
                      {course.logo ? (
                        <img src={course.logo} alt={course.title} className="w-12 h-12 object-contain" />
                      ) : (
                        <div className="text-gray-600/30 dark:text-gray-400/30">{course.icon}</div>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <span className="px-2 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                        {course.category}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                        {course.language}
                      </span>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{course.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{course.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{course.lessons} lessons</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{course.difficulty}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Coming Soon Section */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Coming Soon</h3>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">More Courses Coming</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              We're working on more courses. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <ProtectedRoute>
      <CoursesContent />
    </ProtectedRoute>
  );
}

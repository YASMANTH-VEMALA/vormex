'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Star,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  Lock,
  Trophy,
  Users,
  Target,
  FileText,
  Video,
  Code2,
  X,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as learningAPI from '@/lib/api/learning';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedHours: number;
  imageUrl?: string;
  thumbnail?: string;
  tags?: string[];
  xpReward: number;
  isPublished: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  slug?: string;
  enrollmentCount?: number;
  completionCount?: number;
  modules?: Module[];
  enrollment?: {
    id: string;
    userId: string;
    pathId: string;
    progress: number;
    status: string;
    startedAt: string;
    completedAt?: string;
  };
  _count?: {
    enrollments: number;
  };
}

interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  xpReward: number;
}

interface Enrollment {
  id: string;
  pathId: string;
  userId?: string;
  progress: number;
  status?: string;
  startedAt: string;
  completedAt?: string;
  path?: LearningPath;
  lessonProgress?: LessonProgress[];
}

interface LessonProgress {
  lessonId: string;
  completedAt: string;
}

const categories = ['All', 'PROGRAMMING', 'WEB_DEV', 'MOBILE', 'DATA_SCIENCE', 'DEVOPS', 'DESIGN'];
const difficulties = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

function LearningPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [activeTab, setActiveTab] = useState<'explore' | 'my-paths' | 'completed'>('explore');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pathsRes, enrollmentsRes] = await Promise.all([
        learningAPI.getLearningPaths(),
        learningAPI.getMyEnrollments()
      ]);
      setPaths(pathsRes || []);
      setEnrollments(enrollmentsRes || []);
    } catch (error) {
      console.error('Error loading learning data:', error);
      showToast('Failed to load learning paths', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleEnroll = async (path: LearningPath) => {
    try {
      setEnrolling(true);
      await learningAPI.enrollInPath(path.id);
      showToast(`Enrolled in ${path.title}!`, 'success');
      loadData();
    } catch (error) {
      console.error('Error enrolling:', error);
      showToast('Failed to enroll', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    try {
      await learningAPI.completeLesson(lessonId);
      showToast('Lesson completed! +XP earned', 'success');
      setSelectedLesson(null);
      loadData();
    } catch (error) {
      console.error('Error completing lesson:', error);
      showToast('Failed to complete lesson', 'error');
    }
  };

  const isEnrolled = (pathId: string) => enrollments.some(e => e.pathId === pathId);
  const getEnrollment = (pathId: string) => enrollments.find(e => e.pathId === pathId);

  const isLessonCompleted = (enrollment: Enrollment | undefined, lessonId: string) => {
    return enrollment?.lessonProgress?.some(lp => lp.lessonId === lessonId) || false;
  };

  const filteredPaths = paths.filter(path => {
    const matchesCategory = selectedCategory === 'All' || path.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || path.difficulty === selectedDifficulty;
    return matchesCategory && matchesDifficulty;
  });

  const myActivePaths = enrollments.filter(e => !e.completedAt);
  const myCompletedPaths = enrollments.filter(e => e.completedAt);

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'INTERMEDIATE': return 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
      case 'ADVANCED': return 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
      case 'EXPERT': return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-neutral-800';
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="w-4 h-4" />;
      case 'ARTICLE': return <FileText className="w-4 h-4" />;
      case 'EXERCISE': return <Code2 className="w-4 h-4" />;
      case 'QUIZ': return <Target className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTotalLessons = (path: LearningPath) => {
    return path.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-20">
      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium ${
              toast.type === 'success' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson Viewer Modal */}
      <AnimatePresence>
        {selectedLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-50 dark:bg-neutral-950"
          >
            <div className="h-full flex flex-col">
              {/* Modal Header */}
              <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedLesson(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <div className="flex items-center gap-2">
                    {getLessonIcon(selectedLesson.type)}
                    <h2 className="font-semibold text-gray-900 dark:text-white">{selectedLesson.title}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-sm">
                  <Star className="w-4 h-4" />
                  <span>+{selectedLesson.xpReward} XP</span>
                </div>
              </div>

              {/* Lesson Content */}
              <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-neutral-900">
                {selectedLesson.type === 'VIDEO' && selectedLesson.videoUrl && (
                  <div className="aspect-video bg-gray-100 dark:bg-neutral-800 rounded-xl mb-5 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Video Player</p>
                    </div>
                  </div>
                )}

                {selectedLesson.content && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{selectedLesson.content}</p>
                  </div>
                )}

                {selectedLesson.duration && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Estimated time: {selectedLesson.duration} minutes</span>
                  </div>
                )}
              </div>

              {/* Complete Button */}
              <div className="bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 p-4 shrink-0">
                <button
                  onClick={() => handleCompleteLesson(selectedLesson.id)}
                  className="w-full py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Complete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Path Detail Modal */}
      <AnimatePresence>
        {selectedPath && !selectedLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60"
          >
            <div className="min-h-screen p-4 flex items-start justify-center pt-10">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-xl max-w-lg w-full border border-gray-200 dark:border-neutral-800"
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 p-4 rounded-t-xl flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Learning Path</h2>
                  <button 
                    onClick={() => setSelectedPath(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-5">
                  {/* Path Header */}
                  <div className="mb-5">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400 mb-3">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{selectedPath.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{selectedPath.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyStyles(selectedPath.difficulty)}`}>
                        {selectedPath.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {selectedPath.estimatedHours}h
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <BookOpen className="w-3.5 h-3.5" />
                        {getTotalLessons(selectedPath)} lessons
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Star className="w-3.5 h-3.5" />
                        {selectedPath.xpReward} XP
                      </span>
                    </div>

                    {selectedPath._count && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Users className="w-3.5 h-3.5" />
                        {selectedPath._count.enrollments.toLocaleString()} enrolled
                      </div>
                    )}
                  </div>

                  {/* Progress (if enrolled) */}
                  {isEnrolled(selectedPath.id) && (
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500">Progress</span>
                        <span className="text-xs font-medium text-gray-900 dark:text-white">{getEnrollment(selectedPath.id)?.progress || 0}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gray-900 dark:bg-white rounded-full transition-all"
                          style={{ width: `${getEnrollment(selectedPath.id)?.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Modules & Lessons */}
                  {selectedPath.modules && selectedPath.modules.length > 0 && (
                    <div className="space-y-3 mb-5">
                      {selectedPath.modules.sort((a, b) => a.order - b.order).map((module, moduleIndex) => (
                        <div key={module.id} className="bg-gray-50 dark:bg-neutral-800 rounded-lg overflow-hidden">
                          <div className="p-3 border-b border-gray-200 dark:border-neutral-700">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              Module {moduleIndex + 1}: {module.title}
                            </h4>
                          </div>
                          
                          {module.lessons && module.lessons.length > 0 && (
                            <div className="divide-y divide-gray-200 dark:divide-neutral-700">
                              {module.lessons.sort((a, b) => a.order - b.order).map((lesson) => {
                                const enrollment = getEnrollment(selectedPath.id);
                                const isCompleted = isLessonCompleted(enrollment, lesson.id);
                                const canAccess = isEnrolled(selectedPath.id);

                                return (
                                  <button
                                    key={lesson.id}
                                    onClick={() => canAccess && setSelectedLesson(lesson)}
                                    disabled={!canAccess}
                                    className={`w-full p-2.5 flex items-center gap-2.5 transition-colors ${
                                      canAccess 
                                        ? 'hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer' 
                                        : 'opacity-50 cursor-not-allowed'
                                    }`}
                                  >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                      isCompleted 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                        : canAccess 
                                          ? 'bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-400' 
                                          : 'bg-gray-200 dark:bg-neutral-800 text-gray-400'
                                    }`}>
                                      {isCompleted ? (
                                        <CheckCircle className="w-3.5 h-3.5" />
                                      ) : canAccess ? (
                                        getLessonIcon(lesson.type)
                                      ) : (
                                        <Lock className="w-3.5 h-3.5" />
                                      )}
                                    </div>
                                    <div className="flex-1 text-left">
                                      <h5 className={`text-xs font-medium ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                        {lesson.title}
                                      </h5>
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <span>{lesson.type}</span>
                                        {lesson.duration && (
                                          <>
                                            <span>·</span>
                                            <span>{lesson.duration}m</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    {canAccess && (
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {selectedPath.tags && selectedPath.tags.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-xs text-gray-500 mb-2">Topics</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPath.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enroll Button */}
                  <div className="pt-4 border-t border-gray-200 dark:border-neutral-800">
                    {isEnrolled(selectedPath.id) ? (
                      <div className="w-full py-2.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium text-center flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Enrolled
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEnroll(selectedPath)}
                        disabled={enrolling}
                        className="w-full py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                      >
                        {enrolling ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Start Learning
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/more" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Paths</h1>
                <p className="text-xs text-gray-500">{paths.length} paths available</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 text-xs font-medium">
                <BookOpen className="w-3.5 h-3.5" />
                {myActivePaths.length}
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                <Award className="w-3.5 h-3.5" />
                {myCompletedPaths.length}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-4 gap-2 pb-3">
            {[
              { id: 'explore', label: 'Explore', icon: <GraduationCap className="w-4 h-4" /> },
              { id: 'my-paths', label: 'My Paths', icon: <BookOpen className="w-4 h-4" /> },
              { id: 'completed', label: 'Completed', icon: <Trophy className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        {activeTab === 'explore' && (
          <>
            {/* Filters */}
            <div className="space-y-2 mb-5">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {category === 'All' ? 'All' : category.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedDifficulty === diff
                        ? getDifficultyStyles(diff)
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Paths Grid */}
            {filteredPaths.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <GraduationCap className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No paths found</h3>
                <p className="text-xs text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPaths.map((path) => (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition-all cursor-pointer"
                    onClick={() => setSelectedPath(path)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm text-gray-900 dark:text-white">{path.title}</h3>
                          {isEnrolled(path.id) && (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{path.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyStyles(path.difficulty)}`}>
                            {path.difficulty}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {path.estimatedHours}h
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <BookOpen className="w-3 h-3" />
                            {getTotalLessons(path)}
                          </span>
                        </div>

                        {/* Progress bar for enrolled paths */}
                        {isEnrolled(path.id) && (
                          <div className="mt-2">
                            <div className="h-1 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gray-900 dark:bg-white rounded-full"
                                style={{ width: `${getEnrollment(path.id)?.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Star className="w-4 h-4" />
                        <span className="text-sm font-medium">{path.xpReward}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'my-paths' && (
          <>
            {myActivePaths.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <BookOpen className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No active paths</h3>
                <p className="text-xs text-gray-500 mb-3">Start learning by enrolling in a path</p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Explore Paths
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myActivePaths.map((enrollment) => (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 cursor-pointer"
                    onClick={() => setSelectedPath(enrollment.path || null)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-0.5">{enrollment.path?.title || 'Unknown Path'}</h3>
                        <p className="text-xs text-gray-500 mb-2">{enrollment.path?.category || 'Unknown'}</p>
                        
                        <div className="mb-1.5">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium text-gray-900 dark:text-white">{enrollment.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gray-900 dark:bg-white rounded-full"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Started {new Date(enrollment.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'completed' && (
          <>
            {myCompletedPaths.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <Trophy className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No completed paths yet</h3>
                <p className="text-xs text-gray-500">Complete learning paths to earn certificates</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myCompletedPaths.map((enrollment) => (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-green-300 dark:border-green-800"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-0.5">{enrollment.path?.title || 'Unknown Path'}</h3>
                        <p className="text-xs text-green-600 dark:text-green-400 mb-2">Completed!</p>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5" />
                            +{enrollment.path?.xpReward || 0} XP
                          </span>
                          <span>
                            {new Date(enrollment.completedAt!).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function LearningPageWrapper() {
  return (
    <ProtectedRoute>
      <LearningPage />
    </ProtectedRoute>
  );
}

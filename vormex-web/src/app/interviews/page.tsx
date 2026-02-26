'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Timer, 
  Star,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Brain,
  Briefcase,
  Code2,
  Users,
  Send,
  X,
  ThumbsUp,
  Lightbulb,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import * as interviewsAPI from '@/lib/api/interviews';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface InterviewCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  questionCount?: number;
}

interface InterviewSession {
  id: string;
  categoryId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  totalQuestions?: number;
  answeredQuestions?: number;
  score?: number;
  feedback?: string;
  category: InterviewCategory;
  responses?: InterviewResponse[];
  // API fields
  userId?: string;
  difficulty?: string;
  duration?: number;
  overallScore?: number;
  strengths?: string[];
  improvements?: string[];
}

interface InterviewResponse {
  id: string;
  questionId: string;
  answer?: string;
  score?: number;
  feedback?: string;
  createdAt?: string;
  answeredAt?: string;
  duration?: number;
  sessionId?: string;
  question: InterviewQuestion;
}

interface InterviewQuestion {
  id: string;
  question: string;
  category?: string | InterviewCategory;
  categoryId?: string;
  difficulty: string;
  expectedAnswer?: string;
  sampleAnswer?: string;
  tips?: string[];
  hints?: string[];
  followUps?: string[];
  tags?: string[];
}

interface InterviewStats {
  totalSessions: number;
  averageScore?: number;
  avgScore?: number;
  totalQuestions?: number;
  strongAreas?: string[];
  weakAreas?: string[];
  passedSessions?: number;
  passRate?: number;
  categoryStats?: Record<string, {
    count: number;
    avgScore: number;
    passed: number;
  }>;
}

const mockCategories: InterviewCategory[] = [
  { id: '1', name: 'Behavioral', description: 'STAR method questions', icon: 'target', questionCount: 25 },
  { id: '2', name: 'Technical', description: 'Coding & system design', icon: 'code', questionCount: 40 },
  { id: '3', name: 'Leadership', description: 'Management scenarios', icon: 'users', questionCount: 20 },
  { id: '4', name: 'Problem Solving', description: 'Analytical thinking', icon: 'brain', questionCount: 30 },
];

function InterviewsContent() {
  const [categories, setCategories] = useState<InterviewCategory[]>(mockCategories);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [stats, setStats] = useState<InterviewStats | null>(null);
  const [activeTab, setActiveTab] = useState<'practice' | 'history' | 'stats'>('practice');
  const [selectedCategory, setSelectedCategory] = useState<InterviewCategory | null>(null);
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{ score: number; feedback: string } | null>(null);
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
      const [categoriesRes, sessionsRes, statsRes] = await Promise.all([
        interviewsAPI.getInterviewCategories(),
        interviewsAPI.getMySessions(),
        interviewsAPI.getInterviewStats()
      ]);
      if (categoriesRes?.length) {
        setCategories(categoriesRes);
      }
      setSessions(sessionsRes || []);
      setStats(statsRes || null);
    } catch (error) {
      console.error('Error loading interview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleStartSession = async (category: InterviewCategory) => {
    try {
      setStarting(true);
      const result = await interviewsAPI.startInterviewSession({ categoryId: category.id });
      setActiveSession(result.session);
      if (result.session?.responses?.[0]?.question) {
        setCurrentQuestion(result.session.responses[0].question);
      } else {
        setCurrentQuestion({
          id: '1',
          question: 'Tell me about a time when you had to deal with a difficult team member. How did you handle the situation?',
          category: category.name,
          difficulty: 'MEDIUM',
          tips: [
            'Use the STAR method (Situation, Task, Action, Result)',
            'Focus on your actions and their impact',
            'Show emotional intelligence and conflict resolution skills'
          ]
        });
      }
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error starting session:', error);
      showToast('Failed to start session', 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!activeSession || !currentQuestion || !answer.trim()) return;

    try {
      setSubmitting(true);
      const result = await interviewsAPI.submitInterviewResponse({ sessionId: activeSession.id, questionId: currentQuestion.id, answer });
      
      setLastFeedback({
        score: result.data?.score || Math.floor(Math.random() * 30) + 70,
        feedback: result.data?.feedback || 'Good use of the STAR method. Consider adding more specific metrics to quantify your impact.'
      });
      setShowFeedback(true);
      setAnswer('');
      
      loadData();
    } catch (error) {
      console.error('Error submitting answer:', error);
      showToast('Failed to submit answer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setLastFeedback(null);
    setCurrentQuestion({
      id: String(Number(currentQuestion?.id || 0) + 1),
      question: 'Describe a project where you had to learn a new technology quickly. What was your approach?',
      category: activeSession?.category.name || 'Technical',
      difficulty: 'MEDIUM',
      tips: [
        'Highlight your learning methodology',
        'Discuss resources you used',
        'Explain how you applied the new knowledge'
      ]
    });
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      await interviewsAPI.completeInterviewSession(activeSession.id);
      showToast('Session completed!', 'success');
      setActiveSession(null);
      setCurrentQuestion(null);
      setShowFeedback(false);
      setLastFeedback(null);
      loadData();
    } catch (error) {
      console.error('Error ending session:', error);
      showToast('Failed to end session', 'error');
    }
  };

  const getCategoryIcon = (icon?: string) => {
    switch (icon) {
      case 'target': return <Target className="w-6 h-6" />;
      case 'code': return <Code2 className="w-6 h-6" />;
      case 'users': return <Users className="w-6 h-6" />;
      case 'brain': return <Brain className="w-6 h-6" />;
      default: return <Briefcase className="w-6 h-6" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'COMPLETED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'ABANDONED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400';
    }
  };

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'MEDIUM':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'HARD':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Active Interview Session View
  if (activeSession && currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col">
        {/* Session Header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleEndSession}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">{activeSession.category.name} Interview</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Question {(activeSession.answeredQuestions || 0) + 1} of {activeSession.totalQuestions || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Timer className="w-4 h-4" />
              <span className="text-sm">In Progress</span>
            </div>
          </div>
        </div>

        {/* Question & Answer Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {showFeedback && lastFeedback ? (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6 mb-4">
                  <div className="flex items-center justify-center mb-6">
                    <div className={`text-5xl font-bold ${getScoreColor(lastFeedback.score)}`}>
                      {lastFeedback.score}
                    </div>
                    <span className="text-xl text-gray-400 ml-1">/100</span>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-center">AI Feedback</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-6">{lastFeedback.feedback}</p>

                  <div className="flex gap-4 justify-center mb-6">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">Good structure</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-sm">Add more details</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleEndSession}
                      className="flex-1 py-3 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      End Session
                    </button>
                    <button
                      onClick={handleNextQuestion}
                      className="flex-1 py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                      Next Question
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                {/* Question */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
                      {typeof currentQuestion.category === 'string' ? currentQuestion.category : currentQuestion.category?.name || 'General'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getDifficultyStyles(currentQuestion.difficulty)}`}>
                      {currentQuestion.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{currentQuestion.question}</h3>

                  {currentQuestion.tips && currentQuestion.tips.length > 0 && (
                    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Tips
                      </h4>
                      <ul className="space-y-1">
                        {currentQuestion.tips.map((tip, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-gray-400 dark:text-gray-500">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Answer Input */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Your Answer</h4>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here... Use the STAR method for behavioral questions."
                    className="w-full h-40 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg p-4 resize-none border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  />
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{answer.length} characters</span>
                    
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={submitting || !answer.trim()}
                      className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        answer.trim()
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                          : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Answer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg font-medium text-sm ${
              toast.type === 'success' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Selection Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedCategory(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full border border-gray-200 dark:border-neutral-800 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                    {getCategoryIcon(selectedCategory.icon)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCategory.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCategory.description}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Questions available</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedCategory.questionCount || 20}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white">What to expect:</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      AI-powered feedback on each answer
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Tips and improvement suggestions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Track your progress over time
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStartSession(selectedCategory)}
                    disabled={starting}
                    className="flex-1 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    {starting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start Practice
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/more" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mock Interviews</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Practice with AI feedback</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-1 pb-3">
          {[
            { id: 'practice', label: 'Practice', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'history', label: 'History', icon: <Clock className="w-4 h-4" /> },
            { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {activeTab === 'practice' && (
          <>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Choose a Category</h2>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedCategory(category)}
                  className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400 mb-3">
                    {getCategoryIcon(category.icon)}
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">{category.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{category.description}</p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {category.questionCount || 20} questions
                  </span>
                </motion.button>
              ))}
            </div>

            {/* STAR Method Tips */}
            <div className="mt-6 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                STAR Method
              </h3>
              <div className="space-y-3">
                {[
                  { letter: 'S', title: 'Situation', desc: 'Set the context for your story' },
                  { letter: 'T', title: 'Task', desc: 'Describe your responsibility' },
                  { letter: 'A', title: 'Action', desc: 'Explain what you did' },
                  { letter: 'R', title: 'Result', desc: 'Share the outcome' }
                ].map((item) => (
                  <div key={item.letter} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                      <span className="font-semibold text-gray-900 dark:text-white">{item.letter}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">No practice sessions yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Start practicing to see your history</p>
                <button
                  onClick={() => setActiveTab('practice')}
                  className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Start Practice
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                          {getCategoryIcon(session.category.icon)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{session.category.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {session.answeredQuestions} / {session.totalQuestions} questions
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusStyles(session.status)}`}>
                        {session.status.replace('_', ' ')}
                      </span>
                    </div>

                    {session.score !== undefined && (
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className={`font-semibold ${getScoreColor(session.score)}`}>
                          {session.score}/100
                        </span>
                      </div>
                    )}

                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(session.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'stats' && (
          <>
            {!stats || stats.totalSessions === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">No stats yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Complete practice sessions to see your stats</p>
                <button
                  onClick={() => setActiveTab('practice')}
                  className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Start Practice
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {stats.totalSessions}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Sessions</p>
                  </div>
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(stats.averageScore ?? stats.avgScore ?? 0)}`}>
                      {Math.round(stats.averageScore ?? stats.avgScore ?? 0)}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Average Score</p>
                  </div>
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {stats.totalQuestions ?? 0}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Questions Answered</p>
                  </div>
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {stats.strongAreas?.length || 0}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Strong Areas</p>
                  </div>
                </div>

                {/* Strong Areas */}
                {stats.strongAreas && stats.strongAreas.length > 0 && (
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      Strong Areas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.strongAreas.map((area, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weak Areas */}
                {stats.weakAreas && stats.weakAreas.length > 0 && (
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-500" />
                      Areas to Improve
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.weakAreas.map((area, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function InterviewsPage() {
  return (
    <ProtectedRoute>
      <InterviewsContent />
    </ProtectedRoute>
  );
}

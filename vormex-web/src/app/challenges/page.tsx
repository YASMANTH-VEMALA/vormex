'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, 
  Trophy, 
  Timer, 
  Star,
  ChevronLeft,
  Play,
  CheckCircle,
  Clock,
  Target,
  Medal,
  Filter,
  Zap,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as challengesAPI from '@/lib/api/challenges';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  points: number;
  timeLimit?: number;
  testCases?: TestCase[];
  starterCode?: Record<string, string>;
  solution?: string;
  hints?: string[];
  tags?: string[];
  isActive?: boolean;
  createdAt: string;
}

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface Submission {
  id: string;
  challengeId: string;
  code: string;
  language: string;
  status: string;
  score?: number;
  executionTime?: number;
  memoryUsed?: number;
  testResults?: TestResult[] | Record<string, unknown>;
  submittedAt: string;
  challenge?: Challenge;
}

interface TestResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  error?: string;
}

interface LeaderboardEntry {
  userId?: string;
  username?: string;
  avatar?: string;
  totalPoints: number;
  solvedCount: number;
  rank: number;
  user?: {
    id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
}

const difficulties = ['All', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'];
const categories = ['All', 'ARRAYS', 'STRINGS', 'TREES', 'GRAPHS', 'DP', 'MATH', 'ALGORITHMS'];
const languages = ['javascript', 'python', 'java', 'cpp', 'typescript'];

function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'challenges' | 'submissions' | 'leaderboard'>('challenges');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChallenge?.starterCode) {
      setCode(selectedChallenge.starterCode[selectedLanguage] || '// Start coding here');
    }
  }, [selectedChallenge, selectedLanguage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [challengesRes, submissionsRes, leaderboardRes] = await Promise.all([
        challengesAPI.getChallenges(),
        challengesAPI.getMySubmissions(),
        challengesAPI.getChallengeLeaderboard()
      ]);
      setChallenges(challengesRes || []);
      setSubmissions(submissionsRes || []);
      setLeaderboard(leaderboardRes || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
      showToast('Failed to load challenges', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSubmit = async () => {
    if (!selectedChallenge || !code.trim()) return;

    try {
      setSubmitting(true);
      const result = await challengesAPI.submitSolution(selectedChallenge.id, { code, language: selectedLanguage });
      showToast(
        result.status === 'ACCEPTED' 
          ? `Solved! +${selectedChallenge.points} points` 
          : 'Some tests failed. Try again!',
        result.status === 'ACCEPTED' ? 'success' : 'error'
      );
      loadData();
    } catch (error) {
      console.error('Error submitting:', error);
      showToast('Failed to submit solution', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    const matchesDifficulty = selectedDifficulty === 'All' || challenge.difficulty === selectedDifficulty;
    const matchesCategory = selectedCategory === 'All' || challenge.category === selectedCategory;
    return matchesDifficulty && matchesCategory;
  });

  const getSolvedChallenges = () => {
    return submissions.filter(s => s.status === 'ACCEPTED').map(s => s.challengeId);
  };

  const isSolved = (challengeId: string) => getSolvedChallenges().includes(challengeId);

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'MEDIUM': return 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
      case 'HARD': return 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
      case 'EXPERT': return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-neutral-800';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'WRONG_ANSWER': return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'TIME_LIMIT': return 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
      case 'RUNTIME_ERROR': return 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
      case 'COMPILE_ERROR': return 'text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-neutral-800';
    }
  };

  const getTotalPoints = () => {
    return submissions
      .filter(s => s.status === 'ACCEPTED')
      .reduce((total, s) => total + (s.score || s.challenge?.points || 0), 0);
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

      {/* Challenge Detail Modal */}
      <AnimatePresence>
        {selectedChallenge && (
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
                    onClick={() => setSelectedChallenge(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">{selectedChallenge.title}</h2>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyStyles(selectedChallenge.difficulty)}`}>
                        {selectedChallenge.difficulty}
                      </span>
                      <span className="text-gray-500">{selectedChallenge.category}</span>
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Star className="w-3 h-3" />
                        {selectedChallenge.points} pts
                      </span>
                    </div>
                  </div>
                </div>
                {selectedChallenge.timeLimit && (
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Timer className="w-4 h-4" />
                    {selectedChallenge.timeLimit} min
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Problem Description */}
                <div className="lg:w-1/2 overflow-y-auto p-4 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Problem Description</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line mb-5">{selectedChallenge.description}</p>

                  {/* Test Cases */}
                  {selectedChallenge.testCases && selectedChallenge.testCases.filter(t => !t.isHidden).length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Example Test Cases</h4>
                      <div className="space-y-2">
                        {selectedChallenge.testCases.filter(t => !t.isHidden).map((testCase, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3 border border-gray-200 dark:border-neutral-700">
                            <div className="mb-2">
                              <span className="text-xs text-gray-500">Input:</span>
                              <pre className="text-sm text-gray-900 dark:text-white font-mono mt-1">{testCase.input}</pre>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Expected Output:</span>
                              <pre className="text-sm text-gray-900 dark:text-white font-mono mt-1">{testCase.expectedOutput}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hints */}
                  {selectedChallenge.hints && selectedChallenge.hints.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowHints(!showHints)}
                        className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-sm mb-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        {showHints ? 'Hide Hints' : `Show Hints (${selectedChallenge.hints.length})`}
                      </button>
                      <AnimatePresence>
                        {showHints && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                              <p className="text-sm text-amber-800 dark:text-amber-300">
                                Hint {currentHint + 1}: {selectedChallenge.hints[currentHint]}
                              </p>
                              {selectedChallenge.hints.length > 1 && (
                                <div className="flex gap-1.5 mt-2">
                                  {selectedChallenge.hints.map((_, index) => (
                                    <button
                                      key={index}
                                      onClick={() => setCurrentHint(index)}
                                      className={`w-5 h-5 rounded text-xs font-medium ${
                                        currentHint === index
                                          ? 'bg-amber-600 text-white'
                                          : 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                                      }`}
                                    >
                                      {index + 1}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedChallenge.tags && selectedChallenge.tags.length > 0 && (
                    <div className="mt-5">
                      <h4 className="text-xs text-gray-500 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedChallenge.tags.map((tag, index) => (
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
                </div>

                {/* Code Editor */}
                <div className="lg:w-1/2 flex flex-col overflow-hidden">
                  {/* Language Selector */}
                  <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 p-3 flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500">Language:</span>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm rounded-lg px-2.5 py-1 border border-gray-200 dark:border-neutral-700 focus:outline-none"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang}>
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Code Area */}
                  <div className="flex-1 overflow-hidden">
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Write your solution here..."
                      className="w-full h-full bg-gray-900 dark:bg-neutral-950 text-gray-100 font-mono text-sm p-4 resize-none focus:outline-none"
                      spellCheck={false}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 p-4 shrink-0">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !code.trim()}
                      className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        code.trim()
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                          : 'bg-gray-200 dark:bg-neutral-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                          Running Tests...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Submit Solution
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
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
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Coding Challenges</h1>
                <p className="text-xs text-gray-500">{challenges.length} challenges available</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                {getSolvedChallenges().length}
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 text-xs font-medium">
                <Trophy className="w-3.5 h-3.5" />
                {getTotalPoints()}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-4 gap-2 pb-3">
            {[
              { id: 'challenges', label: 'Challenges', icon: <Code2 className="w-4 h-4" /> },
              { id: 'submissions', label: 'My Submissions', icon: <Target className="w-4 h-4" /> },
              { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> }
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
        {activeTab === 'challenges' && (
          <>
            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium mb-4 transition-colors ${
                showFilters 
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                  : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-2 block">Difficulty</label>
                      <div className="flex flex-wrap gap-1.5">
                        {difficulties.map((diff) => (
                          <button
                            key={diff}
                            onClick={() => setSelectedDifficulty(diff)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
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
                    <div>
                      <label className="text-xs text-gray-500 mb-2 block">Category</label>
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                              selectedCategory === cat
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Challenges List */}
            {filteredChallenges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <Code2 className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No challenges found</h3>
                <p className="text-xs text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChallenges.map((challenge) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white dark:bg-neutral-900 rounded-xl p-4 border transition-all cursor-pointer ${
                      isSolved(challenge.id) 
                        ? 'border-green-300 dark:border-green-800' 
                        : 'border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700'
                    }`}
                    onClick={() => setSelectedChallenge(challenge)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          {isSolved(challenge.id) && (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                          <h3 className="font-medium text-sm text-gray-900 dark:text-white">{challenge.title}</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{challenge.description}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyStyles(challenge.difficulty)}`}>
                            {challenge.difficulty}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400">
                            {challenge.category}
                          </span>
                          {challenge.timeLimit && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {challenge.timeLimit}m
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 ml-3">
                        <Star className="w-4 h-4" />
                        <span className="text-sm font-medium">{challenge.points}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'submissions' && (
          <>
            {submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <Target className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No submissions yet</h3>
                <p className="text-xs text-gray-500 mb-3">Solve challenges to see your submissions here</p>
                <button
                  onClick={() => setActiveTab('challenges')}
                  className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Start Solving
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-0.5">{submission.challenge?.title || 'Unknown Challenge'}</h3>
                        <p className="text-xs text-gray-500">{submission.language}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyles(submission.status)}`}>
                        {submission.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {submission.executionTime && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {submission.executionTime}ms
                        </span>
                      )}
                      {submission.score && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {submission.score} pts
                        </span>
                      )}
                      <span>
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'leaderboard' && (
          <>
            {leaderboard.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <Trophy className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Leaderboard coming soon</h3>
                <p className="text-xs text-gray-500">Be the first to solve challenges!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-3 border border-gray-200 dark:border-neutral-800 flex items-center gap-3"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                      index === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                      index === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                      'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {index < 3 ? (
                        <Medal className="w-4 h-4" />
                      ) : (
                        entry.rank
                      )}
                    </div>
                    
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400 font-medium text-sm">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt={entry.username || entry.user?.username || 'User'} className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        (entry.username || entry.user?.username || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white">{entry.username || entry.user?.username || 'Unknown'}</h3>
                      <p className="text-xs text-gray-500">{entry.solvedCount} solved</p>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm font-medium">{entry.totalPoints.toLocaleString()}</span>
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

export default function ChallengesPageWrapper() {
  return (
    <ProtectedRoute>
      <ChallengesPage />
    </ProtectedRoute>
  );
}

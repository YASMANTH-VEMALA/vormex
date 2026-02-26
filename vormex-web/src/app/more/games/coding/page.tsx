'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Code,
  Zap,
  Trophy,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Lightbulb,
  AlertCircle,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  getCodingProblems,
  submitCodingSolution,
  CodingProblem,
} from '@/lib/api/games';
import confetti from 'canvas-confetti';

type GameState = 'loading' | 'selecting' | 'solving' | 'result' | 'error';

export default function CodingPage() {
  const [puzzles, setPuzzles] = useState<CodingProblem[]>([]);
  const [selectedPuzzle, setSelectedPuzzle] = useState<CodingProblem | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState<{ testCase: number; passed: boolean; input: string; expectedOutput?: string }[]>([]);
  const [gameState, setGameState] = useState<GameState>('loading');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [copied, setCopied] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    fetchPuzzles();
  }, [difficulty]);

  const fetchPuzzles = async () => {
    setGameState('loading');
    try {
      const data = await getCodingProblems(undefined, difficulty);
      setPuzzles(data.problems || []);
      setGameState('selecting');
    } catch (error) {
      console.error('Failed to fetch puzzles:', error);
      setGameState('error');
    }
  };

  const selectPuzzle = (puzzle: CodingProblem) => {
    setSelectedPuzzle(puzzle);
    // Get starter code for the selected language
    const starterCode = puzzle.starterCode?.[language] || puzzle.starterCode?.javascript || '';
    setCode(starterCode);
    setOutput('');
    setTestResults([]);
    setIsCorrect(null);
    setShowHint(false);
    setStartTime(Date.now());
    setGameState('solving');
  };

  const runCode = async () => {
    if (!selectedPuzzle || !code.trim()) return;
    
    setIsSubmitting(true);
    setOutput('Running...');
    setTestResults([]);
    
    try {
      const result = await submitCodingSolution(selectedPuzzle.id, code, language);
      
      setTestResults(result.testResults || []);
      const allPassed = result.submission.passedTests === result.submission.totalTests;
      setIsCorrect(allPassed);
      setOutput(allPassed 
        ? `All ${result.submission.totalTests} test cases passed!` 
        : `${result.submission.passedTests}/${result.submission.totalTests} test cases passed.`
      );
      
      if (allPassed) {
        setXpEarned(result.xpEarned);
        setGameState('result');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (error: any) {
      setOutput(error.response?.data?.message || 'Error running code. Please try again.');
      setIsCorrect(false);
    } finally {
      setIsSubmitting(true);
    }
  };

  const copyStarterCode = () => {
    if (selectedPuzzle?.starterCode) {
      const starterCode = selectedPuzzle.starterCode[language] || selectedPuzzle.starterCode.javascript || '';
      navigator.clipboard.writeText(starterCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case 'HARD':
        return 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getXpReward = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return '50 XP';
      case 'MEDIUM':
        return '100 XP';
      case 'HARD':
        return '200 XP';
      default:
        return '50 XP';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={gameState === 'solving' || gameState === 'result' ? '#' : '/more/games'}
                  onClick={(e) => {
                    if (gameState === 'solving' || gameState === 'result') {
                      e.preventDefault();
                      setGameState('selecting');
                      setSelectedPuzzle(null);
                    }
                  }}
                  className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Code className="w-6 h-6 text-orange-500" />
                  {gameState === 'solving' || gameState === 'result' ? selectedPuzzle?.title : 'Coding Puzzles'}
                </h1>
              </div>
              
              {xpEarned > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    +{xpEarned} XP
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Loading State */}
          {gameState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
              <p className="mt-4 text-gray-500">Loading puzzles...</p>
            </div>
          )}

          {/* Error State */}
          {gameState === 'error' && (
            <div className="text-center py-20">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Couldn&apos;t load puzzles
              </h2>
              <button
                onClick={fetchPuzzles}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Selecting State - Puzzle List */}
          {gameState === 'selecting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Difficulty Selector */}
              <div className="flex items-center justify-center gap-2">
                {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all border ${
                      difficulty === diff
                        ? getDifficultyColor(diff)
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>

              {/* Puzzles List */}
              <div className="space-y-3">
                {puzzles.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <Code className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No puzzles available for this difficulty.</p>
                  </div>
                ) : (
                  puzzles.map((puzzle, index) => (
                    <motion.button
                      key={puzzle.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => selectPuzzle(puzzle)}
                      className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                          <Code className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {puzzle.title}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getDifficultyColor(puzzle.difficulty)}`}>
                              {puzzle.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {puzzle.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                            {getXpReward(puzzle.difficulty)}
                          </p>
                          <p className="text-xs text-gray-400">{puzzle.category}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Solving State */}
          {(gameState === 'solving' || gameState === 'result') && selectedPuzzle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Problem Description */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">Problem</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getDifficultyColor(selectedPuzzle.difficulty)}`}>
                    {selectedPuzzle.difficulty}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedPuzzle.description}
                </p>
              </div>

              {/* Examples */}
              {selectedPuzzle.testCases && selectedPuzzle.testCases.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">Examples</span>
                  </div>
                  <div className="space-y-3">
                    {selectedPuzzle.testCases.slice(0, 2).map((testCase: { input: string; expectedOutput: string; isHidden?: boolean }, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg font-mono text-sm">
                        <p className="text-gray-500 mb-1">Input:</p>
                        <p className="text-gray-900 dark:text-white mb-2">{testCase.input}</p>
                        <p className="text-gray-500 mb-1">Expected Output:</p>
                        <p className="text-green-600 dark:text-green-400">{testCase.expectedOutput}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hint */}
              {selectedPuzzle.hints && selectedPuzzle.hints.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      <span className="font-medium text-gray-900 dark:text-white">Need a hint?</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showHint ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showHint && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                      >
                        <ul className="text-amber-600 dark:text-amber-400 text-sm list-disc list-inside">
                          {selectedPuzzle.hints.map((hint, i) => (
                            <li key={i}>{hint}</li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Code Editor */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-gray-500" />
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        const newStarterCode = selectedPuzzle.starterCode?.[e.target.value] || '';
                        setCode(newStarterCode);
                      }}
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent border-none focus:ring-0"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="typescript">TypeScript</option>
                    </select>
                  </div>
                  <button
                    onClick={copyStarterCode}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Copy starter code"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={gameState === 'result'}
                  className="w-full p-4 font-mono text-sm bg-gray-900 text-gray-100 min-h-[200px] resize-y focus:outline-none disabled:opacity-60"
                  placeholder="Write your code here..."
                  spellCheck={false}
                />
              </div>

              {/* Output */}
              {output && (
                <div className={`p-4 rounded-xl border ${
                  isCorrect === true
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : isCorrect === false
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isCorrect === true ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : isCorrect === false ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Terminal className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">Output</span>
                  </div>
                  <pre className={`font-mono text-sm whitespace-pre-wrap ${
                    isCorrect === true
                      ? 'text-green-700 dark:text-green-300'
                      : isCorrect === false
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {output}
                  </pre>
                </div>
              )}

              {/* Actions */}
              {gameState === 'solving' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setCode(selectedPuzzle.starterCode?.[language] || selectedPuzzle.starterCode?.javascript || '')}
                    className="px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={runCode}
                    disabled={isSubmitting || !code.trim()}
                    className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Run & Submit
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Success Actions */}
              {gameState === 'result' && (
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 text-center">
                    <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
                      Puzzle Solved! 🎉
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Zap className="w-5 h-5 text-purple-500" />
                      <span className="text-lg font-semibold text-purple-600">+{xpEarned} XP</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setGameState('selecting');
                        setSelectedPuzzle(null);
                        setXpEarned(0);
                      }}
                      className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                    >
                      More Puzzles
                    </button>
                    <Link
                      href="/more/games"
                      className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors text-center"
                    >
                      Back to Games
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

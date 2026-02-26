'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Brain,
  Zap,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Star,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  getDailyTrivia,
  answerTriviaQuestion,
  TriviaQuestion,
} from '@/lib/api/games';
import confetti from 'canvas-confetti';

type GameState = 'loading' | 'playing' | 'answered' | 'completed' | 'error';

export default function TriviaPage() {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<GameState>('loading');
  const [streak, setStreak] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setGameState('loading');
    try {
      const data = await getDailyTrivia();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setGameState('playing');
        setTimeLeft(30);
      } else {
        setGameState('completed');
      }
    } catch (error) {
      console.error('Failed to fetch trivia:', error);
      setGameState('error');
    }
  };

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing' || selectedAnswerIndex !== null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, selectedAnswerIndex, currentIndex]);

  const handleTimeout = () => {
    if (selectedAnswerIndex === null) {
      setSelectedAnswerIndex(-1); // -1 indicates timeout
      setIsCorrect(false);
      setStreak(0);
      setGameState('answered');
    }
  };

  const handleAnswer = async (answerIndex: number) => {
    if (selectedAnswerIndex !== null || isSubmitting) return;

    setSelectedAnswerIndex(answerIndex);
    setIsSubmitting(true);

    try {
      const currentQuestion = questions[currentIndex];
      const result = await answerTriviaQuestion(currentQuestion.id, answerIndex, 30 - timeLeft);
      
      setIsCorrect(result.isCorrect);
      setCorrectAnswerIndex(result.correctIndex);
      setExplanation(result.explanation || null);
      
      if (result.isCorrect) {
        setScore((prev) => prev + 1);
        setTotalXpEarned((prev) => prev + result.xpEarned);
        setStreak((prev) => prev + 1);
        
        // Trigger confetti for correct answer
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } else {
        setStreak(0);
      }
      
      setGameState('answered');
    } catch (error) {
      console.error('Failed to submit answer:', error);
      // If API fails, mark as incorrect
      setIsCorrect(false);
      setStreak(0);
      setGameState('answered');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswerIndex(null);
      setCorrectAnswerIndex(null);
      setExplanation(null);
      setIsCorrect(null);
      setTimeLeft(30);
      setGameState('playing');
    } else {
      setGameState('completed');
      if (score > questions.length / 2) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const restartGame = () => {
    setCurrentIndex(0);
    setSelectedAnswerIndex(null);
    setCorrectAnswerIndex(null);
    setExplanation(null);
    setIsCorrect(null);
    setScore(0);
    setTotalXpEarned(0);
    setStreak(0);
    fetchQuestions();
  };

  const currentQuestion = questions[currentIndex];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'MEDIUM':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'HARD':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/more/games"
                  className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-500" />
                    Daily Trivia
                  </h1>
                </div>
              </div>
              
              {gameState === 'playing' && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {totalXpEarned} XP
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {gameState === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                <p className="mt-4 text-gray-500">Loading questions...</p>
              </motion.div>
            )}

            {/* Error State */}
            {gameState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Oops! Something went wrong
                </h2>
                <p className="text-gray-500 mb-6">
                  We couldn&apos;t load the trivia questions. Please try again.
                </p>
                <button
                  onClick={fetchQuestions}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {/* Playing State */}
            {(gameState === 'playing' || gameState === 'answered') && currentQuestion && (
              <motion.div
                key={`question-${currentIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="text-gray-500">
                      Score: {score}/{questions.length}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Timer and Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                      timeLeft <= 10 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-red-600' : 'text-gray-500'}`} />
                      <span className={`text-sm font-semibold ${
                        timeLeft <= 10 ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {timeLeft}s
                      </span>
                    </div>
                    
                    {streak > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                        <Flame className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-semibold text-orange-600">
                          {streak} streak
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(currentQuestion.difficulty)}`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>

                {/* Question Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                    {currentQuestion.category}
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
                    {currentQuestion.question}
                  </h2>
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  {(currentQuestion.options as string[]).map((option, index) => {
                    const isSelected = selectedAnswerIndex === index;
                    const isCorrectOption = correctAnswerIndex === index;
                    const showResult = gameState === 'answered';
                    
                    let buttonClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500';
                    
                    if (showResult) {
                      if (isCorrectOption) {
                        buttonClass = 'bg-green-50 dark:bg-green-900/20 border-green-500';
                      } else if (isSelected && !isCorrect) {
                        buttonClass = 'bg-red-50 dark:bg-red-900/20 border-red-500';
                      } else {
                        buttonClass = 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60';
                      }
                    } else if (isSelected) {
                      buttonClass = 'bg-purple-50 dark:bg-purple-900/20 border-purple-500';
                    }

                    return (
                      <motion.button
                        key={index}
                        whileHover={!showResult ? { scale: 1.01 } : {}}
                        whileTap={!showResult ? { scale: 0.99 } : {}}
                        onClick={() => handleAnswer(index)}
                        disabled={showResult || isSubmitting}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${buttonClass}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            showResult && isCorrectOption
                              ? 'bg-green-500 text-white'
                              : showResult && isSelected && !isCorrect
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="flex-1 font-medium text-gray-900 dark:text-white">
                            {option}
                          </span>
                          {showResult && isCorrectOption && (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          )}
                          {showResult && isSelected && !isCorrect && (
                            <XCircle className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Result and Next Button */}
                {gameState === 'answered' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {explanation && (
                      <div className={`p-4 rounded-xl ${
                        isCorrect 
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}>
                        <p className={`text-sm ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          <strong>{isCorrect ? '🎉 Correct!' : '❌ Incorrect!'}</strong>{' '}
                          {explanation}
                        </p>
                      </div>
                    )}
                    {!explanation && (
                      <div className={`p-4 rounded-xl ${
                        isCorrect 
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}>
                        <p className={`text-sm ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          <strong>{isCorrect ? '🎉 Correct!' : '❌ Incorrect!'}</strong>
                        </p>
                      </div>
                    )}
                    
                    <button
                      onClick={handleNext}
                      className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {currentIndex < questions.length - 1 ? (
                        <>
                          Next Question
                          <ChevronRight className="w-5 h-5" />
                        </>
                      ) : (
                        <>
                          See Results
                          <Trophy className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Completed State */}
            {gameState === 'completed' && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center animate-bounce">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {score === questions.length 
                    ? 'Perfect Score!' 
                    : score > questions.length / 2 
                    ? 'Great Job!' 
                    : 'Keep Practicing!'}
                </h2>
                
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                  You completed today&apos;s trivia challenge
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {score}/{questions.length}
                    </p>
                    <p className="text-sm text-gray-500">Correct</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-3xl font-bold text-purple-600">
                      +{totalXpEarned}
                    </p>
                    <p className="text-sm text-gray-500">XP Earned</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-3xl font-bold text-orange-500">
                      {Math.round((score / questions.length) * 100)}%
                    </p>
                    <p className="text-sm text-gray-500">Accuracy</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/more/games"
                    className="flex-1 py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                  >
                    Back to Games
                  </Link>
                  <button
                    onClick={restartGame}
                    className="flex-1 py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Play Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProtectedRoute>
  );
}

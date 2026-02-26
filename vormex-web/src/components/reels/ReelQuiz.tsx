'use client';

import { useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { reelsApi } from '@/lib/api/reels';

interface QuizOption {
  id: number;
  text: string;
}

interface ReelQuizProps {
  reelId: string;
  question: string;
  options: QuizOption[];
}

export function ReelQuiz({ reelId, question, options }: ReelQuizProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswer = useCallback(async (optionId: number) => {
    if (isAnswered || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSelectedOption(optionId);
      
      const response = (await reelsApi.answerQuiz(reelId, optionId)) as unknown as {
        correct: boolean;
        correctAnswer: number;
      };
      
      setCorrectAnswer(response.correctAnswer);
      setIsAnswered(true);
    } catch (error) {
      console.error('Failed to answer quiz:', error);
      setSelectedOption(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [reelId, isAnswered, isSubmitting]);

  return (
    <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 space-y-3">
      <h3 className="text-white font-semibold text-lg">{question}</h3>
      
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          const isCorrect = correctAnswer === option.id;
          const isWrong = isAnswered && isSelected && !isCorrect;
          
          return (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              disabled={isAnswered || isSubmitting}
              className={cn(
                "relative w-full p-3 rounded-xl text-left transition-all",
                isAnswered
                  ? isCorrect
                    ? "bg-green-500/40 ring-2 ring-green-500"
                    : isWrong
                      ? "bg-red-500/40 ring-2 ring-red-500"
                      : "bg-white/10"
                  : "bg-white/20 hover:bg-white/30 active:scale-[0.98]",
                isSubmitting && isSelected && "animate-pulse"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{option.text}</span>
                {isAnswered && isCorrect && (
                  <Check className="w-5 h-5 text-green-400" />
                )}
                {isWrong && (
                  <X className="w-5 h-5 text-red-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {isAnswered && (
        <div className={cn(
          "text-center py-2 rounded-lg font-medium",
          selectedOption === correctAnswer
            ? "bg-green-500/20 text-green-400"
            : "bg-red-500/20 text-red-400"
        )}>
          {selectedOption === correctAnswer ? 'Correct! 🎉' : 'Wrong answer 😔'}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Send,
  Loader2,
  Sparkles,
  Briefcase,
  FileText,
  Users,
  Target,
  Bot,
  User,
  RefreshCw,
  Lightbulb,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import apiClient from '@/lib/api/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Category {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  prompts: string[];
}

const categories: Category[] = [
  {
    id: 'career',
    icon: <Briefcase className="w-5 h-5" />,
    label: 'Career Advice',
    description: 'Get guidance on career paths and decisions',
    prompts: [
      'What are the best career paths in tech right now?',
      'How do I transition to a new career field?',
      'What skills should I develop for career growth?',
    ],
  },
  {
    id: 'resume',
    icon: <FileText className="w-5 h-5" />,
    label: 'Resume Review',
    description: 'Tips to improve your resume',
    prompts: [
      'What makes a resume stand out to recruiters?',
      'How should I format my resume for ATS systems?',
      'What should I include in my resume summary?',
    ],
  },
  {
    id: 'interview',
    icon: <Target className="w-5 h-5" />,
    label: 'Interview Prep',
    description: 'Prepare for your next interview',
    prompts: [
      'How do I answer "Tell me about yourself"?',
      'What are common behavioral interview questions?',
      'How do I negotiate salary in an interview?',
    ],
  },
  {
    id: 'networking',
    icon: <Users className="w-5 h-5" />,
    label: 'Networking Tips',
    description: 'Build professional connections',
    prompts: [
      'How do I network effectively on LinkedIn?',
      'What should I say when reaching out to someone?',
      'How do I follow up after a networking event?',
    ],
  },
  {
    id: 'skills',
    icon: <GraduationCap className="w-5 h-5" />,
    label: 'Skill Development',
    description: 'Learn what skills to develop',
    prompts: [
      'What technical skills are most in-demand?',
      'How do I learn new skills effectively?',
      'What certifications are worth getting?',
    ],
  },
  {
    id: 'job-search',
    icon: <TrendingUp className="w-5 h-5" />,
    label: 'Job Search',
    description: 'Strategies for finding opportunities',
    prompts: [
      'What are the best job search strategies?',
      'How do I find hidden job opportunities?',
      'How do I stand out in a competitive job market?',
    ],
  },
];

async function sendChatMessage(message: string, conversationHistory: { role: string; content: string }[]): Promise<string> {
  const response = await apiClient.post('/ai/career-chat', {
    message,
    conversationHistory,
  });
  const data = response as unknown as { reply?: string; message?: string };
  return data.reply || data.message || 'I apologize, but I encountered an issue. Please try again.';
}

export function AIChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSelectedCategory(null);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage(messageText, conversationHistory);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an issue. Please try again later.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/more" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-gray-900 dark:text-white">AI Career Assistant</h1>
                  <p className="text-xs text-gray-500">Your personal career guide</p>
                </div>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                New Chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  How can I help you today?
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  I'm your AI career assistant. Ask me about career advice, resume tips, interview preparation, and more.
                </p>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(selectedCategory?.id === category.id ? null : category)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedCategory?.id === category.id
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                        : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                      selectedCategory?.id === category.id
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {category.icon}
                    </div>
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-0.5">
                      {category.label}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {category.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Suggested Prompts for Selected Category */}
              <AnimatePresence>
                {selectedCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                        Suggested questions for {selectedCategory.label}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {selectedCategory.prompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => handleSend(prompt)}
                          className="w-full text-left px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors text-sm text-gray-700 dark:text-gray-300"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.role === 'user'
                      ? 'bg-blue-500'
                      : 'bg-gradient-to-br from-purple-500 to-blue-600'
                  }`}>
                    {message.role === 'user' ? (
                      user?.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white rounded-2xl rounded-tr-md px-4 py-3'
                      : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-2xl rounded-tl-md px-4 py-3'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-1.5 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-neutral-800 pb-20 md:pb-4">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your career..."
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              className={`p-3 rounded-xl transition-colors shrink-0 ${
                inputValue.trim() && !isLoading
                  ? 'bg-gradient-to-br from-purple-500 to-blue-600 text-white hover:opacity-90'
                  : 'bg-gray-200 dark:bg-neutral-700 text-gray-400'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChatPage;

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  MessageSquarePlus,
  RefreshCw,
  SpellCheck,
  Zap,
  Languages,
  ArrowUpRight,
  Palette,
  X,
  Loader2,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  getConversationStarters,
  getChatRevivalSuggestions,
  fixGrammar,
  getSmartReplies,
  changeTone,
  translateMessage,
  expandMessage,
  type ToneType,
  type LanguageType,
} from '@/lib/api/ai-chat';

// ============================================
// Types
// ============================================

interface AIChatAssistantProps {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  currentMessage: string;
  lastReceivedMessage?: string;
  onSuggestionSelect: (text: string) => void;
  onClose?: () => void;
}

type AIFeature = 
  | 'starters'
  | 'revival'
  | 'grammar'
  | 'smart-reply'
  | 'tone'
  | 'translate'
  | 'expand';

interface FeatureOption {
  id: AIFeature;
  label: string;
  icon: React.ReactNode;
  description: string;
  requiresMessage?: boolean;
  requiresReceivedMessage?: boolean;
}

// ============================================
// Constants
// ============================================

const FEATURES: FeatureOption[] = [
  {
    id: 'starters',
    label: 'Ice Breakers',
    icon: <MessageSquarePlus className="w-4 h-4" />,
    description: 'Personalized conversation starters',
  },
  {
    id: 'revival',
    label: 'Continue Chat',
    icon: <RefreshCw className="w-4 h-4" />,
    description: 'Revive a stalled conversation',
  },
  {
    id: 'smart-reply',
    label: 'Quick Reply',
    icon: <Zap className="w-4 h-4" />,
    description: 'Smart reply suggestions',
    requiresReceivedMessage: true,
  },
  {
    id: 'grammar',
    label: 'Fix Grammar',
    icon: <SpellCheck className="w-4 h-4" />,
    description: 'Fix grammar & spelling',
    requiresMessage: true,
  },
  {
    id: 'tone',
    label: 'Change Tone',
    icon: <Palette className="w-4 h-4" />,
    description: 'Rewrite in different tone',
    requiresMessage: true,
  },
  {
    id: 'translate',
    label: 'Translate',
    icon: <Languages className="w-4 h-4" />,
    description: 'Translate to another language',
    requiresMessage: true,
  },
  {
    id: 'expand',
    label: 'Expand',
    icon: <ArrowUpRight className="w-4 h-4" />,
    description: 'Expand short message',
    requiresMessage: true,
  },
];

const TONE_OPTIONS: { value: ToneType; label: string; emoji: string }[] = [
  { value: 'professional', label: 'Professional', emoji: '💼' },
  { value: 'casual', label: 'Casual', emoji: '😎' },
  { value: 'friendly', label: 'Friendly', emoji: '🤗' },
  { value: 'formal', label: 'Formal', emoji: '🎩' },
  { value: 'enthusiastic', label: 'Enthusiastic', emoji: '🔥' },
  { value: 'concise', label: 'Concise', emoji: '⚡' },
];

const LANGUAGE_OPTIONS: { value: LanguageType; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'hinglish', label: 'Hinglish' },
  { value: 'tenglish', label: 'Tenglish' },
];

// ============================================
// Component
// ============================================

export default function AIChatAssistant({
  conversationId,
  otherUserId,
  otherUserName,
  currentMessage,
  lastReceivedMessage,
  onSuggestionSelect,
  onClose,
}: AIChatAssistantProps) {
  const [selectedFeature, setSelectedFeature] = useState<AIFeature | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState<ToneType>('casual');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageType>('english');
  const [showToneDropdown, setShowToneDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Handle feature selection
  const handleFeatureClick = async (feature: AIFeature) => {
    // Check requirements
    if (FEATURES.find(f => f.id === feature)?.requiresMessage && !currentMessage.trim()) {
      setError('Please type a message first');
      return;
    }
    if (FEATURES.find(f => f.id === feature)?.requiresReceivedMessage && !lastReceivedMessage) {
      setError('No message to reply to');
      return;
    }

    setSelectedFeature(feature);
    setError(null);
    setSuggestions([]);

    // For tone and translate, just show the options
    if (feature === 'tone' || feature === 'translate') {
      return;
    }

    await fetchSuggestions(feature);
  };

  // Fetch suggestions based on feature
  const fetchSuggestions = async (feature: AIFeature, extraParams?: { tone?: ToneType; language?: LanguageType }) => {
    setLoading(true);
    setError(null);

    try {
      let result: string[] = [];

      switch (feature) {
        case 'starters': {
          const response = await getConversationStarters(otherUserId);
          result = response.suggestions;
          break;
        }
        case 'revival': {
          const response = await getChatRevivalSuggestions(conversationId, otherUserId);
          result = response.suggestions;
          break;
        }
        case 'grammar': {
          const response = await fixGrammar(currentMessage);
          result = [response.corrected, ...response.alternatives];
          break;
        }
        case 'smart-reply': {
          const response = await getSmartReplies(lastReceivedMessage || '', conversationId);
          result = response.suggestions;
          break;
        }
        case 'tone': {
          const response = await changeTone(currentMessage, extraParams?.tone || selectedTone);
          result = [response.result];
          break;
        }
        case 'translate': {
          const response = await translateMessage(currentMessage, extraParams?.language || selectedLanguage);
          result = [response.translated];
          break;
        }
        case 'expand': {
          const response = await expandMessage(currentMessage);
          result = [response.expanded];
          break;
        }
      }

      setSuggestions(result);
    } catch (err: any) {
      console.error('AI suggestion error:', err);
      setError(err.response?.data?.error || 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Handle tone selection
  const handleToneSelect = async (tone: ToneType) => {
    setSelectedTone(tone);
    setShowToneDropdown(false);
    await fetchSuggestions('tone', { tone });
  };

  // Handle language selection
  const handleLanguageSelect = async (language: LanguageType) => {
    setSelectedLanguage(language);
    setShowLanguageDropdown(false);
    await fetchSuggestions('translate', { language });
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionSelect(suggestion);
    onClose?.();
  };

  // Reset to feature selection
  const handleBack = () => {
    setSelectedFeature(null);
    setSuggestions([]);
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-full left-0 right-0 mb-3 mx-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              AI Assistant
            </h3>
            <p className="text-xs text-gray-500">
              {selectedFeature 
                ? FEATURES.find(f => f.id === selectedFeature)?.description 
                : 'Choose an action'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 max-h-80 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!selectedFeature ? (
            // Feature Selection Grid
            <motion.div
              key="features"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-2"
            >
              {FEATURES.map((feature) => {
                const isDisabled = 
                  (feature.requiresMessage && !currentMessage.trim()) ||
                  (feature.requiresReceivedMessage && !lastReceivedMessage);

                return (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureClick(feature.id)}
                    disabled={isDisabled}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                      isDisabled
                        ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:scale-[1.02]"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      feature.id === 'starters' && "bg-green-100 dark:bg-green-900/30 text-green-600",
                      feature.id === 'revival' && "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
                      feature.id === 'smart-reply' && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600",
                      feature.id === 'grammar' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
                      feature.id === 'tone' && "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
                      feature.id === 'translate' && "bg-pink-100 dark:bg-pink-900/30 text-pink-600",
                      feature.id === 'expand' && "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600",
                    )}>
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {feature.label}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {feature.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          ) : (
            // Suggestions View
            <motion.div
              key="suggestions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Back button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-3"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
                Back to options
              </button>

              {/* Tone/Language Selector for those features */}
              {selectedFeature === 'tone' && (
                <div className="mb-3 relative">
                  <button
                    onClick={() => setShowToneDropdown(!showToneDropdown)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span>{TONE_OPTIONS.find(t => t.value === selectedTone)?.emoji}</span>
                      <span>{TONE_OPTIONS.find(t => t.value === selectedTone)?.label}</span>
                    </span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showToneDropdown && "rotate-180")} />
                  </button>
                  {showToneDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
                      {TONE_OPTIONS.map((tone) => (
                        <button
                          key={tone.value}
                          onClick={() => handleToneSelect(tone.value)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                        >
                          <span>{tone.emoji}</span>
                          <span>{tone.label}</span>
                          {selectedTone === tone.value && (
                            <Check className="w-4 h-4 ml-auto text-green-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedFeature === 'translate' && (
                <div className="mb-3 relative">
                  <button
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm"
                  >
                    <span>{LANGUAGE_OPTIONS.find(l => l.value === selectedLanguage)?.label}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showLanguageDropdown && "rotate-180")} />
                  </button>
                  {showLanguageDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => handleLanguageSelect(lang.value)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                        >
                          <span>{lang.label}</span>
                          {selectedLanguage === lang.value && (
                            <Check className="w-4 h-4 ml-auto text-green-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">Generating suggestions...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  <button
                    onClick={() => fetchSuggestions(selectedFeature)}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Suggestions List */}
              {!loading && !error && suggestions.length > 0 && (
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={cn(
                        "w-full p-3 text-left rounded-xl transition-all",
                        "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700",
                        "hover:shadow-md hover:scale-[1.01]",
                        "border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                      )}
                    >
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                        {suggestion}
                      </p>
                      {index === 0 && selectedFeature === 'grammar' && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
                          <Check className="w-3 h-3" />
                          Best correction
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Regenerate button */}
              {!loading && suggestions.length > 0 && selectedFeature !== 'tone' && selectedFeature !== 'translate' && (
                <button
                  onClick={() => fetchSuggestions(selectedFeature)}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate new suggestions
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer tip */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          {currentMessage.trim() 
            ? `Message: "${currentMessage.slice(0, 30)}${currentMessage.length > 30 ? '...' : ''}"`
            : 'Type a message to use grammar, tone, or translate features'}
        </p>
      </div>
    </motion.div>
  );
}

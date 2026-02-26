import apiClient from './client';

// ============================================
// Types
// ============================================

export interface ConversationStartersResponse {
  suggestions: string[];
  type: 'conversation_starters';
}

export interface RevivalSuggestionsResponse {
  suggestions: string[];
  type: 'revival_suggestions';
}

export interface GrammarFixResponse {
  corrected: string;
  alternatives: string[];
  type: 'grammar_fix';
}

export interface SmartRepliesResponse {
  suggestions: string[];
  type: 'smart_replies';
}

export interface ToneChangeResponse {
  original: string;
  result: string;
  tone: string;
  type: 'tone_change';
}

export interface TranslationResponse {
  original: string;
  translated: string;
  targetLanguage: string;
  type: 'translation';
}

export interface ExpansionResponse {
  original: string;
  expanded: string;
  type: 'expansion';
}

export type ToneType = 'professional' | 'casual' | 'friendly' | 'formal' | 'enthusiastic' | 'concise';
export type LanguageType = 'english' | 'hindi' | 'telugu' | 'hinglish' | 'tenglish';

// ============================================
// AI Chat API Functions
// ============================================

/**
 * Get personalized conversation starters based on both users' profiles
 */
export async function getConversationStarters(
  otherUserId: string
): Promise<ConversationStartersResponse> {
  return apiClient.post('/ai/chat/conversation-starters', { otherUserId });
}

/**
 * Get suggestions to continue a stalled conversation
 */
export async function getChatRevivalSuggestions(
  conversationId: string,
  otherUserId: string
): Promise<RevivalSuggestionsResponse> {
  return apiClient.post('/ai/chat/revival-suggestions', {
    conversationId,
    otherUserId,
  });
}

/**
 * Fix grammar and spelling in a message
 */
export async function fixGrammar(
  message: string,
  context?: string
): Promise<GrammarFixResponse> {
  return apiClient.post('/ai/chat/fix-grammar', { message, context });
}

/**
 * Get smart reply suggestions based on the last message
 */
export async function getSmartReplies(
  lastMessage: string,
  conversationId?: string
): Promise<SmartRepliesResponse> {
  return apiClient.post('/ai/chat/smart-replies', {
    lastMessage,
    conversationId,
  });
}

/**
 * Change the tone of a message
 */
export async function changeTone(
  message: string,
  tone: ToneType
): Promise<ToneChangeResponse> {
  return apiClient.post('/ai/chat/change-tone', { message, tone });
}

/**
 * Translate a message to another language
 */
export async function translateMessage(
  message: string,
  targetLanguage: LanguageType
): Promise<TranslationResponse> {
  return apiClient.post('/ai/chat/translate', { message, targetLanguage });
}

/**
 * Expand a short message into a more detailed one
 */
export async function expandMessage(
  message: string,
  context?: 'professional' | 'casual'
): Promise<ExpansionResponse> {
  return apiClient.post('/ai/chat/expand', { message, context });
}

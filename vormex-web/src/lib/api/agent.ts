import apiClient from './client';
import type { PersonCard } from './people';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type AgentResponse =
  | { type: 'text'; text: string }
  | { type: 'navigate'; destination: string; text: string }
  | { type: 'follow_up'; text: string; options: string[] }
  | { type: 'people_results'; text: string; people: PersonCard[] };

export interface SendAgentMessageParams {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Send a message to the AI agent and get a structured response.
 */
export async function sendAgentMessage(
  params: SendAgentMessageParams
): Promise<AgentResponse> {
  const response = await apiClient.post('/ai/chat/agent', params);
  return response as unknown as AgentResponse;
}

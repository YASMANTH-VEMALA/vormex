'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Send, Loader2, User, Bot } from 'lucide-react';
import { sendAgentMessage, type AgentResponse } from '@/lib/api/agent';
import { AgentMessageRenderer } from './AgentMessageRenderer';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  response?: AgentResponse;
  timestamp: Date;
}

interface AgentChatPanelProps {
  onClose?: () => void;
  onNavigate?: () => void;
}

export function AgentChatPanel({ onClose, onNavigate }: AgentChatPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = (text || inputValue).trim();
    if (!messageText || isLoading) return;

    const userMsg: AgentMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
        .map((m) => ({
          role: m.role,
          content: m.role === 'user' ? m.content! : (m.response?.type === 'text' ? m.response.text : m.content || ''),
        }));

      const response = await sendAgentMessage({
        message: messageText,
        conversationHistory,
      });

      const assistantMsg: AgentMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        response,
        content: response.type === 'text' ? response.text : undefined,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (response.type === 'navigate') {
        const routeMap: Record<string, string> = {
          home: '/',
          messages: '/messages',
          reels: '/reels',
          'find-people': '/find-people',
          profile: '/profile',
          groups: '/groups',
          notifications: '/notifications',
          learning: '/learning',
          jobs: '/jobs',
          search: '/find-people',
          settings: '/notifications/settings',
          more: '/more',
        };
        const route = routeMap[response.destination] ?? '/';
        onNavigate?.();
        router.push(route);
      }
    } catch (err) {
      console.error('Agent error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          response: {
            type: 'text',
            text: "I couldn't process that. Please try again.",
          },
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    handleSend(option);
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh] min-h-[400px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-neutral-400">
            <p className="text-lg font-medium">Hi! I&apos;m Vormex AI.</p>
            <p className="text-sm mt-1">
              Ask me to find people, navigate the app, or just say hi.
            </p>
            <p className="text-xs mt-4 opacity-75">
              Try: &quot;Suggest Python developers&quot; or &quot;Go to homepage&quot;
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={`flex-1 min-w-0 max-w-[85%] ${
                msg.role === 'user' ? 'text-right' : ''
              }`}
            >
              <div
                className={`inline-block px-4 py-2.5 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : msg.response ? (
                  <AgentMessageRenderer
                    response={msg.response}
                    onOptionSelect={handleOptionSelect}
                    onNavigate={(dest) => {
                      const routeMap: Record<string, string> = {
                        home: '/',
                        messages: '/messages',
                        reels: '/reels',
                        'find-people': '/find-people',
                        profile: '/profile',
                        groups: '/groups',
                        notifications: '/notifications',
                        learning: '/learning',
                        jobs: '/jobs',
                        search: '/find-people',
                        settings: '/notifications/settings',
                        more: '/more',
                      };
                      onNavigate?.();
                      router.push(routeMap[dest] ?? '/');
                    }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-neutral-400" />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-neutral-800">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-500/50"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

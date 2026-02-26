'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { AgentResponse } from '@/lib/api/agent';
import type { PersonCard } from '@/lib/api/people';

interface AgentMessageRendererProps {
  response: AgentResponse;
  onOptionSelect?: (option: string) => void;
  onNavigate?: (destination: string) => void;
}

const DESTINATION_TO_ROUTE: Record<string, string> = {
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

function PersonCardCompact({ person }: { person: PersonCard }) {
  return (
    <Link
      href={`/profile/${person.username}`}
      className="flex-shrink-0 w-48 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
    >
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0">
            {person.profileImage ? (
              <img
                src={person.profileImage}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500 dark:text-neutral-400">
                {person.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {person.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
              @{person.username}
            </p>
            {person.headline && (
              <p className="text-xs text-gray-600 dark:text-neutral-300 mt-0.5 line-clamp-2">
                {person.headline}
              </p>
            )}
          </div>
        </div>
        {person.skills?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {person.skills.slice(0, 3).map((skill, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function AgentMessageRenderer({
  response,
  onOptionSelect,
  onNavigate,
}: AgentMessageRendererProps) {
  if (response.type === 'text') {
    return (
      <p className="text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">
        {response.text}
      </p>
    );
  }

  if (response.type === 'follow_up') {
    return (
      <div className="space-y-3">
        <p className="text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">
          {response.text}
        </p>
        {response.options.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {response.options.map((opt) => (
              <motion.button
                key={opt}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOptionSelect?.(opt)}
                className="px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
              >
                {opt}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (response.type === 'navigate') {
    const route = DESTINATION_TO_ROUTE[response.destination] ?? '/';
    return (
      <div className="space-y-2">
        <p className="text-gray-700 dark:text-neutral-300">{response.text}</p>
        <Link
          href={route}
          onClick={() => onNavigate?.(response.destination)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Go to {response.destination.replace(/-/g, ' ')}
        </Link>
      </div>
    );
  }

  if (response.type === 'people_results') {
    return (
      <div className="space-y-3">
        <p className="text-gray-700 dark:text-neutral-300">{response.text}</p>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 scrollbar-thin">
          {response.people.map((person) => (
            <PersonCardCompact key={person.id} person={person} />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

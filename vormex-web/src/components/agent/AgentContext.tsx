'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AgentContextType {
  isOpen: boolean;
  openAgent: () => void;
  closeAgent: () => void;
  toggleAgent: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openAgent = useCallback(() => setIsOpen(true), []);
  const closeAgent = useCallback(() => setIsOpen(false), []);
  const toggleAgent = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <AgentContext.Provider
      value={{ isOpen, openAgent, closeAgent, toggleAgent }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent(): AgentContextType {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    return {
      isOpen: false,
      openAgent: () => {},
      closeAgent: () => {},
      toggleAgent: () => {},
    };
  }
  return ctx;
}

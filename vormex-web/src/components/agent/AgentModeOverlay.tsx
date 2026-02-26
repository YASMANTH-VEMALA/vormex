'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { AgentChatPanel } from './AgentChatPanel';

interface AgentModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const EDGE_BLUR = 60;

export function AgentModeOverlay({ isOpen, onClose }: AgentModeOverlayProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop - click to close */}
          <button
            onClick={onClose}
            className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
            aria-label="Close"
          />

          {/* Blurred edge layers - Perplexity Comet style */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top edge */}
            <div
              className="absolute top-0 left-0 right-0 h-[60px] backdrop-blur-xl bg-gradient-to-b from-blue-500/10 to-transparent"
              style={{ height: EDGE_BLUR }}
            />
            {/* Bottom edge */}
            <div
              className="absolute bottom-0 left-0 right-0 backdrop-blur-xl bg-gradient-to-t from-blue-500/10 to-transparent"
              style={{ height: EDGE_BLUR }}
            />
            {/* Left edge */}
            <div
              className="absolute top-0 bottom-0 left-0 backdrop-blur-xl bg-gradient-to-r from-blue-500/10 to-transparent"
              style={{ width: EDGE_BLUR }}
            />
            {/* Right edge */}
            <div
              className="absolute top-0 bottom-0 right-0 backdrop-blur-xl bg-gradient-to-l from-blue-500/10 to-transparent"
              style={{ width: EDGE_BLUR }}
            />
          </div>

          {/* Blue glow / wave effect - animated border */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute inset-0 border-2 border-blue-500/20 rounded-none"
              style={{
                boxShadow: `
                  0 0 60px rgba(59, 130, 246, 0.15),
                  0 0 120px rgba(59, 130, 246, 0.08),
                  inset 0 0 60px rgba(59, 130, 246, 0.03)
                `,
              }}
              animate={{
                boxShadow: [
                  `0 0 60px rgba(59, 130, 246, 0.15), 0 0 120px rgba(59, 130, 246, 0.08), inset 0 0 60px rgba(59, 130, 246, 0.03)`,
                  `0 0 80px rgba(59, 130, 246, 0.2), 0 0 140px rgba(59, 130, 246, 0.1), inset 0 0 60px rgba(59, 130, 246, 0.05)`,
                  `0 0 60px rgba(59, 130, 246, 0.15), 0 0 120px rgba(59, 130, 246, 0.08), inset 0 0 60px rgba(59, 130, 246, 0.03)`,
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          {/* Center chat panel with blue glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-2xl mx-4 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-2xl overflow-hidden"
            style={{
              boxShadow: `
                0 0 0 1px rgba(59, 130, 246, 0.1),
                0 0 40px rgba(59, 130, 246, 0.12),
                0 25px 50px -12px rgba(0, 0, 0, 0.25)
              `,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-b border-blue-400/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-white text-sm">
                    Vormex AI Agent
                  </h2>
                  <p className="text-white/80 text-xs">Ask me anything</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
                aria-label="Close agent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat content */}
            <AgentChatPanel onClose={onClose} onNavigate={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

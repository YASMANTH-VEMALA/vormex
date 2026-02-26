'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Reply,
  Copy,
  Pencil,
  Trash2,
  Forward,
  Star,
  Pin,
  MoreHorizontal,
  Download,
} from 'lucide-react';
import { DEFAULT_CHAT_REACTIONS } from '@/lib/chat/customization';

interface MessageMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isOwn: boolean;
  messageContent: string;
  hasMedia?: boolean;
  mediaUrl?: string;
  onReply: () => void;
  onEdit?: () => void;
  onDelete: (forEveryone: boolean) => void;
  onReact: (emoji: string) => void;
  onCopy: () => void;
  onForward?: () => void;
  onPin?: () => void;
  onStar?: () => void;
  availableReactions?: string[];
  position?: { x: number; y: number };
  anchorPosition?: 'left' | 'right';
}

export default function MessageMenu({
  isOpen,
  onClose,
  isOwn,
  messageContent,
  hasMedia,
  mediaUrl,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onCopy,
  onForward,
  onPin,
  onStar,
  availableReactions = DEFAULT_CHAT_REACTIONS,
  position,
  anchorPosition = 'right',
}: MessageMenuProps) {
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const showReactions = true;
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'r' && !event.metaKey && !event.ctrlKey) {
        onReply();
        onClose();
      } else if (event.key === 'c' && (event.metaKey || event.ctrlKey)) {
        onCopy();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onReply, onCopy]);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageContent);
    onCopy();
    onClose();
  };

  const handleDownload = () => {
    if (mediaUrl) {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = '';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    onClose();
  };

  const menuItems = [
    {
      id: 'reply',
      label: 'Reply',
      icon: Reply,
      onClick: () => { onReply(); onClose(); },
      shortcut: 'R',
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: Copy,
      onClick: handleCopy,
      shortcut: '⌘C',
    },
    ...(isOwn ? [{
      id: 'edit',
      label: 'Edit',
      icon: Pencil,
      onClick: () => { onEdit?.(); onClose(); },
    }] : []),
    ...(hasMedia && mediaUrl ? [{
      id: 'download',
      label: 'Download',
      icon: Download,
      onClick: handleDownload,
    }] : []),
    {
      id: 'forward',
      label: 'Forward',
      icon: Forward,
      onClick: () => { onForward?.(); onClose(); },
      disabled: true, // Coming soon
    },
    {
      id: 'pin',
      label: 'Pin',
      icon: Pin,
      onClick: () => { onPin?.(); onClose(); },
      disabled: true, // Coming soon
    },
    {
      id: 'star',
      label: 'Star',
      icon: Star,
      onClick: () => { onStar?.(); onClose(); },
      disabled: true, // Coming soon
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: () => setShowDeleteOptions(true),
      danger: true,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'absolute z-50 min-w-[200px]',
            'bg-white dark:bg-gray-800 rounded-xl shadow-xl',
            'border border-gray-200 dark:border-gray-700',
            'overflow-hidden'
          )}
          style={position ? {
            top: position.y,
            left: anchorPosition === 'left' ? position.x : undefined,
            right: anchorPosition === 'right' ? position.x : undefined,
          } : {
            top: '-8px',
            [anchorPosition === 'left' ? 'left' : 'right']: '100%',
            marginLeft: anchorPosition === 'left' ? '8px' : undefined,
            marginRight: anchorPosition === 'right' ? '8px' : undefined,
          }}
        >
          {/* Reaction bar */}
          {showReactions && !showDeleteOptions && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1">
                {availableReactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { onReact(emoji); onClose(); }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:scale-125"
                  >
                    <span className="text-lg">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delete options submenu */}
          {showDeleteOptions ? (
            <div className="py-1">
              <div className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Delete message?
              </div>
              <button
                onClick={() => { onDelete(false); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete for me</span>
              </button>
              {isOwn && (
                <button
                  onClick={() => { onDelete(true); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete for everyone</span>
                </button>
              )}
              <button
                onClick={() => setShowDeleteOptions(false)}
                className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Main menu items */
            <div className="py-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors',
                    item.danger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.disabled && (
                      <span className="text-xs text-gray-400">(soon)</span>
                    )}
                  </div>
                  {item.shortcut && (
                    <span className="text-xs text-gray-400">{item.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simple hover-based quick actions component (Discord style)
interface QuickActionsProps {
  isVisible: boolean;
  isOwn: boolean;
  onReply: () => void;
  onReact: () => void;
  onMore: () => void;
}

export function MessageQuickActions({
  isVisible,
  isOwn,
  onReply,
  onReact,
  onMore,
}: QuickActionsProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.1 }}
          className={cn(
            'absolute -top-8 flex items-center gap-0.5',
            'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
            'border border-gray-200 dark:border-gray-700 p-0.5',
            isOwn ? 'right-0' : 'left-8'
          )}
        >
          <button
            onClick={onReact}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Add reaction"
          >
            <span className="text-sm">😀</span>
          </button>
          <button
            onClick={onReply}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Reply"
          >
            <Reply className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={onMore}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="More options"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

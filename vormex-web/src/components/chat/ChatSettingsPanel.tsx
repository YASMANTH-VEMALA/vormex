'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  X,
  Image as ImageIcon,
  FileText,
  Video,
  Trash2,
  Bell,
  BellOff,
  Ban,
  Flag,
  Search,
  Lock,
} from 'lucide-react';
import { isWallpaperUnlocked } from '@/lib/chat/customization';

// Wallpaper option type
interface WallpaperOption {
  id: string;
  name: string;
  color: string;
  preview?: string | null;
  pattern?: string;
  requiredPackSlug?: string;
}

// Default wallpaper options
const WALLPAPER_OPTIONS: WallpaperOption[] = [
  { id: 'default', name: 'Default', color: 'bg-gray-50 dark:bg-gray-900' },
  { id: 'gradient-1', name: 'Ocean', color: 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30' },
  { id: 'gradient-2', name: 'Sunset', color: 'bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30', requiredPackSlug: 'chat-theme-vibrant-dms' },
  { id: 'gradient-3', name: 'Forest', color: 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30' },
  { id: 'gradient-4', name: 'Lavender', color: 'bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30', requiredPackSlug: 'chat-theme-dark-variants' },
  { id: 'gradient-5', name: 'Rose', color: 'bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30', requiredPackSlug: 'chat-theme-vibrant-dms' },
  { id: 'gradient-6', name: 'Midnight', color: 'bg-gradient-to-br from-slate-800 to-gray-900', requiredPackSlug: 'chat-theme-dark-variants' },
  { id: 'gradient-7', name: 'Sky', color: 'bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-900/30 dark:to-indigo-900/30' },
  { id: 'gradient-8', name: 'Amber', color: 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30' },
  { id: 'pattern-1', name: 'Dots', color: 'bg-gray-100 dark:bg-gray-800', pattern: 'bg-[radial-gradient(circle,_#00000010_1px,_transparent_1px)] bg-[size:20px_20px]', requiredPackSlug: 'chat-theme-vibrant-dms' },
  { id: 'pattern-2', name: 'Grid', color: 'bg-gray-100 dark:bg-gray-800', pattern: 'bg-[linear-gradient(#00000008_1px,_transparent_1px),linear-gradient(90deg,_#00000008_1px,_transparent_1px)] bg-[size:20px_20px]', requiredPackSlug: 'chat-theme-dark-variants' },
];

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'file' | 'audio';
  url: string;
  fileName?: string;
  createdAt: string;
}

interface ChatSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  otherUser: {
    id: string;
    name: string;
    username: string;
    profileImage?: string | null;
    isOnline?: boolean;
  };
  currentWallpaper: string;
  onWallpaperChange: (wallpaperId: string) => void;
  mediaItems?: MediaItem[];
  onClearChat?: () => void;
  onBlockUser?: () => void;
  onReportUser?: () => void;
  ownedThemePacks?: string[];
  onOpenStore?: () => void;
}

type TabType = 'settings' | 'wallpaper' | 'media';

export default function ChatSettingsPanel({
  isOpen,
  onClose,
  conversationId,
  otherUser,
  currentWallpaper,
  onWallpaperChange,
  mediaItems = [],
  onClearChat,
  onBlockUser,
  onReportUser,
  ownedThemePacks = [],
  onOpenStore,
}: ChatSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`chat_muted_${conversationId}`) === 'true';
  });
  const [mediaFilter, setMediaFilter] = useState<'all' | 'images' | 'videos' | 'files'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem(`chat_muted_${conversationId}`, String(newMuted));
  };

  // Filter media items
  const filteredMedia = mediaItems.filter(item => {
    if (mediaFilter === 'all') return true;
    if (mediaFilter === 'images') return item.type === 'image';
    if (mediaFilter === 'videos') return item.type === 'video';
    if (mediaFilter === 'files') return item.type === 'file' || item.type === 'audio';
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chat Info
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold mb-3">
                {otherUser.profileImage ? (
                  <img
                    src={otherUser.profileImage}
                    alt={otherUser.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  otherUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{otherUser.name}</h3>
              <p className="text-gray-500 dark:text-gray-400">@{otherUser.username}</p>
              {otherUser.isOnline && (
                <span className="mt-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                  Online
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'settings', label: 'Settings' },
                { id: 'wallpaper', label: 'Wallpaper' },
                { id: 'media', label: 'Media' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    'flex-1 py-3 text-sm font-medium transition-colors relative',
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="p-4 space-y-2">
                  {/* Mute Notifications */}
                  <button
                    onClick={handleMuteToggle}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isMuted ? (
                        <BellOff className="w-5 h-5 text-gray-500" />
                      ) : (
                        <Bell className="w-5 h-5 text-gray-500" />
                      )}
                      <span className="text-gray-900 dark:text-white">Mute Notifications</span>
                    </div>
                    <div className={cn(
                      'w-10 h-6 rounded-full transition-colors relative',
                      isMuted ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    )}>
                      <div className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                        isMuted ? 'translate-x-5' : 'translate-x-1'
                      )} />
                    </div>
                  </button>

                  {/* Divider */}
                  <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

                  {/* Clear Chat */}
                  <button
                    onClick={onClearChat}
                    className="w-full flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Clear Chat History</span>
                  </button>

                  {/* Block User */}
                  <button
                    onClick={onBlockUser}
                    className="w-full flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
                  >
                    <Ban className="w-5 h-5" />
                    <span>Block {otherUser.name}</span>
                  </button>

                  {/* Report User */}
                  <button
                    onClick={onReportUser}
                    className="w-full flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
                  >
                    <Flag className="w-5 h-5" />
                    <span>Report</span>
                  </button>
                </div>
              )}

              {/* Wallpaper Tab */}
              {activeTab === 'wallpaper' && (
                <div className="p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Choose a wallpaper for this chat
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {WALLPAPER_OPTIONS.map((wallpaper) => {
                      const unlocked = isWallpaperUnlocked(wallpaper.id, ownedThemePacks);
                      const requiredPack = wallpaper.requiredPackSlug;

                      return (
                        <button
                          key={wallpaper.id}
                          onClick={() => {
                            if (unlocked) {
                              onWallpaperChange(wallpaper.id);
                              return;
                            }

                            onOpenStore?.();
                          }}
                          className={cn(
                            'aspect-[3/4] rounded-xl overflow-hidden relative transition-all',
                            wallpaper.color,
                            wallpaper.pattern,
                            !unlocked && 'opacity-70',
                            currentWallpaper === wallpaper.id
                              ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                              : 'hover:scale-105'
                          )}
                        >
                          {wallpaper.preview && (
                            <img
                              src={wallpaper.preview}
                              alt={wallpaper.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                            <span className="text-xs text-white font-medium">{wallpaper.name}</span>
                            {!unlocked && (
                              <p className="text-[10px] text-white/90">
                                Requires {requiredPack === 'chat-theme-dark-variants' ? 'Dark Variants Pack' : 'Vibrant DMs Pack'}
                              </p>
                            )}
                          </div>
                          {!unlocked && (
                            <div className="absolute top-2 left-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                              <Lock className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {currentWallpaper === wallpaper.id && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <div className="p-4">
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search media..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Filter buttons */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {([
                      { id: 'all', label: 'All', icon: null },
                      { id: 'images', label: 'Images', icon: ImageIcon },
                      { id: 'videos', label: 'Videos', icon: Video },
                      { id: 'files', label: 'Files', icon: FileText },
                    ] as const).map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setMediaFilter(filter.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                          mediaFilter === filter.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        )}
                      >
                        {filter.icon && <filter.icon className="w-4 h-4" />}
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  {/* Media Grid */}
                  {filteredMedia.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {filteredMedia.map((item) => (
                        <a
                          key={item.id}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-80 transition-opacity relative group"
                        >
                          {item.type === 'image' ? (
                            <img
                              src={item.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : item.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                              <Video className="w-8 h-8 text-gray-500" />
                            </div>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2">
                              <FileText className="w-8 h-8 text-gray-500 mb-1" />
                              <span className="text-xs text-gray-500 truncate w-full text-center">
                                {item.fileName || 'File'}
                              </span>
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No media shared yet</p>
                      <p className="text-sm">Photos, videos, and files will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Export wallpaper options for use in other components
export { WALLPAPER_OPTIONS };
export type { MediaItem };

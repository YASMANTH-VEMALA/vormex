'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Lock } from 'lucide-react';
import Image from 'next/image';
import { getUserHighlights, getHighlightStories, type StoryHighlight, type Story } from '@/lib/api/stories';

interface StoryHighlightsProps {
  userId: string;
  isOwnProfile?: boolean;
  onCreateHighlight?: () => void;
}

export function StoryHighlights({ userId, isOwnProfile = false, onCreateHighlight }: StoryHighlightsProps) {
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHighlight, setSelectedHighlight] = useState<StoryHighlight | null>(null);
  const [highlightStories, setHighlightStories] = useState<Story[]>([]);

  useEffect(() => {
    fetchHighlights();
  }, [userId]);

  const fetchHighlights = async () => {
    try {
      const response = await getUserHighlights(userId);
      setHighlights(response.highlights);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHighlightClick = async (highlight: StoryHighlight) => {
    setSelectedHighlight(highlight);
    try {
      const response = await getHighlightStories(highlight.id);
      setHighlightStories(response.highlight.stories);
      // Open story viewer with these stories
    } catch (error) {
      console.error('Error fetching highlight stories:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800" />
            <div className="w-12 h-3 rounded bg-neutral-800" />
          </div>
        ))}
      </div>
    );
  }

  if (highlights.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-white font-semibold mb-4">Story Highlights</h3>
      
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Create New Highlight Button (for own profile) */}
        {isOwnProfile && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateHighlight}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="w-16 h-16 rounded-2xl bg-neutral-800/50 border-2 border-dashed border-neutral-700 flex items-center justify-center hover:border-blue-500/50 transition-colors">
              <Plus className="w-6 h-6 text-neutral-400" />
            </div>
            <span className="text-xs text-neutral-500">New</span>
          </motion.button>
        )}

        {/* Highlights */}
        {highlights.map((highlight, index) => (
          <motion.button
            key={highlight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleHighlightClick(highlight)}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            {/* Highlight Cover */}
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-neutral-700 group-hover:ring-blue-500 transition-all">
              {highlight.coverImage ? (
                <Image
                  src={highlight.coverImage}
                  alt={highlight.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xl">
                    {highlight.title.charAt(0)}
                  </span>
                </div>
              )}

              {/* Story Count Badge */}
              <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/60 rounded-full px-1.5 py-0.5">
                <Play className="w-2.5 h-2.5 text-white" fill="white" />
                <span className="text-[10px] text-white font-medium">{highlight.storiesCount}</span>
              </div>

              {/* Privacy Indicator */}
              {!highlight.isPublic && (
                <div className="absolute top-1 left-1 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5 text-white" />
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-6 h-6 text-white" fill="white" />
              </div>
            </div>

            {/* Highlight Title */}
            <span className="text-xs text-neutral-400 truncate max-w-16 group-hover:text-white transition-colors">
              {highlight.title}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

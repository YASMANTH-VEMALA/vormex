'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Send, Loader2 } from 'lucide-react';
import { getConnections } from '@/lib/api/connections';
import { searchUsersForMention } from '@/lib/api/posts';
import { getOrCreateConversation, sendMessage } from '@/lib/api/chat';
import { sharePostToUser } from '@/lib/api/posts';
import type { Connection } from '@/lib/api/connections';
import type { MentionUser } from '@/types/post';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postPreview?: string;
  postAuthor?: {
    name: string;
    username: string;
    profileImage?: string | null;
  };
  postMediaUrl?: string | null;
}

export function ShareModal({ isOpen, onClose, postId, postPreview, postAuthor, postMediaUrl }: ShareModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [searchResults, setSearchResults] = useState<MentionUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${postId}` : '';

  const loadConnections = useCallback(async () => {
    try {
      const res = await getConnections(1, 50);
      setConnections(res.connections?.filter((c) => c.status === 'ACCEPTED') || []);
    } catch (err) {
      console.error('Error loading connections:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadConnections();
      setSearchQuery('');
      setSearchResults([]);
      setSelectedIds(new Set());
      setError(null);
    }
  }, [isOpen, loadConnections]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchUsersForMention(searchQuery);
        setSearchResults(users);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) {
      setError('Select at least one person to share with');
      return;
    }
    setSending(true);
    setError(null);
    try {
      // Create shared post message content with metadata
      const sharedPostContent = JSON.stringify({
        type: 'shared_post',
        postId,
        postUrl,
        preview: postPreview?.slice(0, 200) || '',
        author: postAuthor || null,
        mediaUrl: postMediaUrl || null,
      });
      
      for (const userId of selectedIds) {
        const conv = await getOrCreateConversation(userId);
        await sendMessage(conv.id, {
          content: sharedPostContent,
          contentType: 'application/x-shared-post',
        });
        await sharePostToUser(postId, userId);
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to share');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const displayConnections = connections.filter(
    (c) =>
      !searchQuery ||
      c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const displaySearch = searchQuery.length >= 2 ? searchResults : [];
  const hasResults = displayConnections.length > 0 || displaySearch.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-neutral-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Share post</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-3 border-b border-gray-200 dark:border-neutral-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search connections or people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-neutral-800 border-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {searchQuery.length >= 2 && displaySearch.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-2">Search results</p>
                  {displaySearch.map((u) => (
                    <ProfileRow
                      key={u.id}
                      id={u.id}
                      name={u.name}
                      username={u.username}
                      avatar={u.profileImage}
                      selected={selectedIds.has(u.id)}
                      onToggle={() => toggleSelect(u.id)}
                    />
                  ))}
                </div>
              )}
              {(searchQuery.length < 2 || displayConnections.length > 0) && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-2">
                    {searchQuery.length < 2 ? 'Connections' : 'Matching connections'}
                  </p>
                  {displayConnections.map((c) => (
                    <ProfileRow
                      key={c.user.id}
                      id={c.user.id}
                      name={c.user.name}
                      username={c.user.username}
                      avatar={c.user.profileImage}
                      selected={selectedIds.has(c.user.id)}
                      onToggle={() => toggleSelect(c.user.id)}
                    />
                  ))}
                </div>
              )}
              {!hasResults && !loading && (
                <p className="text-center text-gray-500 dark:text-neutral-400 py-8">
                  {searchQuery.length >= 2 ? 'No users found' : 'No connections yet'}
                </p>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="px-4 py-2 text-sm text-red-500">{error}</p>
        )}

        <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={handleSend}
            disabled={selectedIds.size === 0 || sending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Send to {selectedIds.size} {selectedIds.size === 1 ? 'person' : 'people'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  id,
  name,
  username,
  avatar,
  selected,
  onToggle,
}: {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0">
        {avatar ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
            {(name || username)?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">{name || username}</p>
        <p className="text-sm text-gray-500 dark:text-neutral-400 truncate">@{username}</p>
      </div>
      <div
        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
          selected
            ? 'border-blue-600 bg-blue-600'
            : 'border-gray-300 dark:border-neutral-600'
        }`}
      >
        {selected && <span className="text-white text-xs">✓</span>}
      </div>
    </button>
  );
}

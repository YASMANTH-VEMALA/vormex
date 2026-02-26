'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  X, 
  Search, 
  Send, 
  Copy, 
  Check,
  Link2,
  MessageCircle,
  Loader2,
  User
} from 'lucide-react';
import { Reel } from '@/lib/api/reels';
import apiClient from '@/lib/api/client';
import { searchUsersForMention } from '@/lib/api/posts';

interface ReelShareSheetProps {
  reel: Reel;
  isOpen: boolean;
  onClose: () => void;
}

interface Conversation {
  id: string;
  otherParticipant: {
    id: string;
    username: string;
    name: string;
    profileImage: string | null;
  };
  lastMessage?: {
    content: string;
  };
}

export function ReelShareSheet({ reel, isOpen, onClose }: ReelShareSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchUsers, setSearchUsers] = useState<Array<{ id: string; name: string; username: string; profileImage?: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setSearchQuery('');
      setSentTo(new Set());
      setMessage('');
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/chat/conversations');
      setConversations((response as unknown as { conversations?: Conversation[] })?.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const shareToUser = async (userId: string) => {
    try {
      setSendingTo(userId);
      await apiClient.post(`/reels/${reel.id}/share/chat`, {
        recipientId: userId,
        message: message || undefined,
      });
      setSentTo(prev => new Set(prev).add(userId));
      setMessage('');
    } catch (error) {
      console.error('Failed to share reel:', error);
    } finally {
      setSendingTo(null);
    }
  };

  const copyLink = useCallback(async () => {
    try {
      const url = `${window.location.origin}/reels/${reel.id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Track share
      await apiClient.post(`/reels/${reel.id}/share`, {
        shareType: 'copy_link',
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [reel.id]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.otherParticipant.name?.toLowerCase().includes(query) ||
      conv.otherParticipant.username?.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await searchUsersForMention(searchQuery);
        setSearchUsers(users || []);
      } catch {
        setSearchUsers([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const conversationIds = new Set(conversations.map(c => c.otherParticipant.id));
  const usersToShow = searchUsers.filter(u => !conversationIds.has(u.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-neutral-900 rounded-t-3xl max-h-[90dvh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Share Reel</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Reel Preview */}
        <div className="p-4 border-b border-white/10">
          <div className="flex gap-3">
            <div className="w-16 h-24 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
              {reel.thumbnailUrl ? (
                <Image
                  src={reel.thumbnailUrl}
                  alt=""
                  width={64}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-neutral-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium line-clamp-2">
                {reel.title || reel.caption || 'Check out this reel!'}
              </p>
              <p className="text-white/60 text-sm mt-1">
                by @{reel.author.username}
              </p>
            </div>
          </div>
          
          {/* Optional message */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message..."
            className="w-full mt-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-white/10">
          <div className="flex gap-4">
            <button
              onClick={copyLink}
              className="flex flex-col items-center gap-2 flex-1"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                copied ? 'bg-green-500/20' : 'bg-white/10 hover:bg-white/20'
              }`}>
                {copied ? (
                  <Check className="w-6 h-6 text-green-500" />
                ) : (
                  <Link2 className="w-6 h-6 text-white" />
                )}
              </div>
              <span className="text-white/80 text-xs">
                {copied ? 'Copied!' : 'Copy Link'}
              </span>
            </button>
          </div>
        </div>

        {/* Search with dropdown results */}
        <div className="p-4 border-b border-white/10 relative shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people to share with..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>
          {searchQuery.length >= 2 && (
            <div className="absolute left-4 right-4 top-full mt-2 max-h-64 overflow-y-auto bg-neutral-800 rounded-xl border border-white/10 shadow-xl z-[110]">
              {isSearching ? (
                <div className="p-4 flex justify-center">
                  <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
                </div>
              ) : usersToShow.length === 0 ? (
                <div className="p-4 text-white/60 text-sm text-center">No people found</div>
              ) : (
                usersToShow.map((user) => {
                  const isSent = sentTo.has(user.id);
                  const isSending = sendingTo === user.id;
                  return (
                    <div
                      key={`search-${user.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-700 flex-shrink-0">
                        {user.profileImage ? (
                          <Image src={user.profileImage} alt="" width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-5 h-5 text-neutral-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{user.name}</p>
                        <p className="text-white/60 text-xs truncate">@{user.username}</p>
                      </div>
                      <button
                        onClick={() => shareToUser(user.id)}
                        disabled={isSending || isSent}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          isSent ? 'bg-green-500/20 text-green-500' : 'bg-white text-black hover:bg-white/90'
                        } disabled:opacity-50`}
                      >
                        {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : isSent ? 'Sent' : 'Send'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No recent conversations
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conv) => {
                const isSent = sentTo.has(conv.otherParticipant.id);
                const isSending = sendingTo === conv.otherParticipant.id;
                
                return (
                  <div
                    key={conv.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                      {conv.otherParticipant.profileImage ? (
                        <Image
                          src={conv.otherParticipant.profileImage}
                          alt={conv.otherParticipant.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {conv.otherParticipant.name}
                      </p>
                      <p className="text-white/60 text-sm truncate">
                        @{conv.otherParticipant.username}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => shareToUser(conv.otherParticipant.id)}
                      disabled={isSending || isSent}
                      className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                        isSent
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-white text-black hover:bg-white/90'
                      } disabled:opacity-50`}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isSent ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Sent
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Send className="w-4 h-4" />
                          Send
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

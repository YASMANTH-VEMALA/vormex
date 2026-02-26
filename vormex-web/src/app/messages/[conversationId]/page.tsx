'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { ChatMessages, ChatInput, ChatHeader, type UploadingMessage, type OptimisticMessage } from '@/components/chat';
import ChatSettingsPanel from '@/components/chat/ChatSettingsPanel';
import { getConversation, Conversation } from '@/lib/api/chat';
import { initializeSocket } from '@/lib/socket';
import * as storeAPI from '@/lib/api/store';
import {
  buildChatCustomizationEntitlements,
  DEFAULT_CHAT_CUSTOMIZATION_ENTITLEMENTS,
  isWallpaperUnlocked,
} from '@/lib/chat/customization';

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

// This page only renders the chat area - the layout.tsx handles the sidebar with ChatList
export default function ConversationPage({ params }: ConversationPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [wallpaper, setWallpaper] = useState('default');
  const [uploadingMessages, setUploadingMessages] = useState<UploadingMessage[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const [lastReceivedMessage, setLastReceivedMessage] = useState<string>('');
  const [chatCustomization, setChatCustomization] = useState(DEFAULT_CHAT_CUSTOMIZATION_ENTITLEMENTS);

  // Callback to track the last message received from other user
  const handleLastMessageUpdate = useCallback((message: string) => {
    setLastReceivedMessage(message);
  }, []);

  // Handle optimistic message - add to list for immediate display
  const handleOptimisticMessage = useCallback((message: OptimisticMessage) => {
    setOptimisticMessages(prev => [...prev, message]);
  }, []);

  // Remove optimistic messages when real messages arrive
  const handleMessageConfirmed = useCallback((confirmedContent: string) => {
    // Remove the first optimistic message with matching content
    setOptimisticMessages(prev => {
      const idx = prev.findIndex(m => m.content === confirmedContent);
      if (idx >= 0) {
        const updated = [...prev];
        updated.splice(idx, 1);
        return updated;
      }
      return prev;
    });
  }, []);

  // Load wallpaper preference from localStorage
  useEffect(() => {
    if (resolvedParams.conversationId) {
      const savedWallpaper = localStorage.getItem(`chat_wallpaper_${resolvedParams.conversationId}`);
      if (savedWallpaper) {
        setWallpaper(savedWallpaper);
      } else {
        setWallpaper('default');
      }
    }
  }, [resolvedParams.conversationId]);

  // Load purchased chat customization packs from inventory
  useEffect(() => {
    const loadChatCustomization = async () => {
      if (!user?.id) return;

      try {
        const inventory = await storeAPI.getMyInventory();
        // Handle case where inventory is undefined or not an array
        const ownedSlugs = Array.isArray(inventory) ? inventory.map((item) => item.itemSlug) : [];
        setChatCustomization(buildChatCustomizationEntitlements(ownedSlugs));
      } catch (error) {
        console.error('Failed to load chat customization packs:', error);
        setChatCustomization(DEFAULT_CHAT_CUSTOMIZATION_ENTITLEMENTS);
      }
    };

    loadChatCustomization();
  }, [user?.id]);

  // If current wallpaper is locked and user no longer owns required pack, fallback to default
  useEffect(() => {
    if (!isWallpaperUnlocked(wallpaper, chatCustomization.ownedThemePacks)) {
      setWallpaper('default');
      localStorage.setItem(`chat_wallpaper_${resolvedParams.conversationId}`, 'default');
    }
  }, [wallpaper, chatCustomization.ownedThemePacks, resolvedParams.conversationId]);

  // Save wallpaper preference
  const handleWallpaperChange = (newWallpaper: string) => {
    setWallpaper(newWallpaper);
    localStorage.setItem(`chat_wallpaper_${resolvedParams.conversationId}`, newWallpaper);
  };

  // Initialize socket
  useEffect(() => {
    if (user?.id) {
      initializeSocket();
    }
  }, [user?.id]);

  // Fetch conversation
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true);
        setError(null);
        const conv = await getConversation(resolvedParams.conversationId);
        setConversation(conv);
        // Clear reply, uploading and optimistic messages when switching conversations
        setReplyTo(null);
        setUploadingMessages([]);
        setOptimisticMessages([]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    if (resolvedParams.conversationId && user?.id) {
      fetchConversation();
    }
  }, [resolvedParams.conversationId, user?.id]);

  const handleBack = () => {
    router.push('/messages');
  };

  const otherUser = conversation?.otherParticipant;

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error || !conversation || !otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Conversation not found'}</p>
          <button
            onClick={handleBack}
            className="text-blue-600 hover:underline"
          >
            Go back to messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <ChatHeader 
          user={otherUser}
          conversationId={resolvedParams.conversationId}
          onBack={handleBack}
          onInfo={() => setShowSettings(true)}
        />

        {/* Messages */}
        <ChatMessages
          key={resolvedParams.conversationId}
          conversationId={resolvedParams.conversationId}
          currentUserId={user!.id}
          otherUser={otherUser}
          wallpaper={wallpaper}
          availableReactions={chatCustomization.availableReactions}
          animatedBubbles={chatCustomization.animatedBubbles}
          onReply={(msg) => setReplyTo(msg)}
          uploadingMessages={uploadingMessages}
          optimisticMessages={optimisticMessages}
          onLastMessageUpdate={handleLastMessageUpdate}
          onMessageConfirmed={handleMessageConfirmed}
        />

        {/* Input */}
        <ChatInput
          key={`input-${resolvedParams.conversationId}`}
          conversationId={resolvedParams.conversationId}
          currentUserId={user!.id}
          replyTo={replyTo || undefined}
          onCancelReply={() => setReplyTo(null)}
          onUploadingMessagesChange={setUploadingMessages}
          onOptimisticMessage={handleOptimisticMessage}
          otherUserId={otherUser.id}
          otherUserName={otherUser.name}
          lastReceivedMessage={lastReceivedMessage}
          enabledMessageEffects={chatCustomization.messageEffects}
        />
      </div>

      {/* Settings Panel */}
      <ChatSettingsPanel
        key={`settings-${resolvedParams.conversationId}`}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        conversationId={resolvedParams.conversationId}
        otherUser={otherUser}
        currentWallpaper={wallpaper}
        onWallpaperChange={handleWallpaperChange}
        ownedThemePacks={chatCustomization.ownedThemePacks}
        onOpenStore={() => router.push('/store')}
      />
    </>
  );
}

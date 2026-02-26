'use client';

import { useEffect, useCallback, useRef } from 'react';
import { 
  getSocket, 
  initializeSocket, 
  joinReelRoom, 
  leaveReelRoom 
} from '@/lib/socket';
import { Reel } from '@/lib/api/reels';

interface ReelEngagementUpdate {
  reelId: string;
  type: 'like' | 'comment' | 'share';
  userId?: string;
  liked?: boolean;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  comment?: {
    id: string;
    author: {
      id: string;
      username: string;
      name: string;
      profileImage: string | null;
    };
    content: string;
    parentId?: string;
  };
}

interface UseReelRealtimeOptions {
  reelId: string;
  onEngagementUpdate?: (update: ReelEngagementUpdate) => void;
  onNewComment?: (comment: ReelEngagementUpdate['comment']) => void;
  enabled?: boolean;
}

export function useReelRealtime({
  reelId,
  onEngagementUpdate,
  onNewComment,
  enabled = true,
}: UseReelRealtimeOptions) {
  const handlersRef = useRef({ onEngagementUpdate, onNewComment });
  
  useEffect(() => {
    handlersRef.current = { onEngagementUpdate, onNewComment };
  }, [onEngagementUpdate, onNewComment]);

  useEffect(() => {
    if (!enabled || !reelId) return;

    const socket = getSocket() || initializeSocket();
    
    // Join reel room
    joinReelRoom(reelId);

    // Handle engagement updates
    const handleEngagementUpdate = (data: ReelEngagementUpdate) => {
      if (data.reelId !== reelId) return;
      
      handlersRef.current.onEngagementUpdate?.(data);
      
      if (data.type === 'comment' && data.comment) {
        handlersRef.current.onNewComment?.(data.comment);
      }
    };

    socket?.on('reel:engagement_update', handleEngagementUpdate);

    return () => {
      leaveReelRoom(reelId);
      socket?.off('reel:engagement_update', handleEngagementUpdate);
    };
  }, [reelId, enabled]);
}

interface UseReelsFeedRealtimeOptions {
  reelIds: string[];
  onReelUpdate?: (reelId: string, updates: Partial<Reel>) => void;
  enabled?: boolean;
}

export function useReelsFeedRealtime({
  reelIds,
  onReelUpdate,
  enabled = true,
}: UseReelsFeedRealtimeOptions) {
  const handlersRef = useRef({ onReelUpdate });
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    handlersRef.current = { onReelUpdate };
  }, [onReelUpdate]);

  useEffect(() => {
    if (!enabled || reelIds.length === 0) return;

    const socket = getSocket() || initializeSocket();

    // Join rooms for new reels
    reelIds.forEach((reelId) => {
      if (!joinedRoomsRef.current.has(reelId)) {
        joinReelRoom(reelId);
        joinedRoomsRef.current.add(reelId);
      }
    });

    // Leave rooms for reels no longer in view
    joinedRoomsRef.current.forEach((reelId) => {
      if (!reelIds.includes(reelId)) {
        leaveReelRoom(reelId);
        joinedRoomsRef.current.delete(reelId);
      }
    });

    // Handle engagement updates
    const handleEngagementUpdate = (data: ReelEngagementUpdate) => {
      if (!reelIds.includes(data.reelId)) return;

      const updates: Partial<Reel> = {};
      
      if (data.type === 'like' && data.likesCount !== undefined) {
        updates.likesCount = data.likesCount;
      }
      if (data.type === 'comment' && data.commentsCount !== undefined) {
        updates.commentsCount = data.commentsCount;
      }
      if (data.type === 'share' && data.sharesCount !== undefined) {
        updates.sharesCount = data.sharesCount;
      }

      if (Object.keys(updates).length > 0) {
        handlersRef.current.onReelUpdate?.(data.reelId, updates);
      }
    };

    socket?.on('reel:engagement_update', handleEngagementUpdate);

    return () => {
      // Leave all rooms on unmount
      joinedRoomsRef.current.forEach((reelId) => {
        leaveReelRoom(reelId);
      });
      joinedRoomsRef.current.clear();
      socket?.off('reel:engagement_update', handleEngagementUpdate);
    };
  }, [reelIds, enabled]);
}

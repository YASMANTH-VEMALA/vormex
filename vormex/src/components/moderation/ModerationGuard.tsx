'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AccountBlockedScreen from '@/components/moderation/AccountBlockedScreen';

interface ModerationStatus {
  userId: string;
  isSuspended: boolean;
  isBanned: boolean;
  suspensionEndDate: string | null;
  suspensionReason: string | null;
  banReason: string | null;
}

export default function ModerationGuard({ children }: { children: React.ReactNode }) {
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkModerationStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, is_suspended, is_banned, suspension_end_date, suspension_reason, ban_reason')
          .eq('id', user.id)
          .single();

        if (profile) {
          // Check if suspension has expired
          if (profile.is_suspended && profile.suspension_end_date) {
            const endDate = new Date(profile.suspension_end_date);
            if (new Date() > endDate) {
              // Auto-clear expired suspension
              await supabase
                .from('profiles')
                .update({
                  is_suspended: false,
                  suspension_end_date: null,
                  suspension_reason: null,
                })
                .eq('id', user.id);
              
              setModerationStatus(null);
              setIsLoading(false);
              return;
            }
          }

          if (profile.is_suspended || profile.is_banned) {
            setModerationStatus({
              userId: profile.id,
              isSuspended: profile.is_suspended,
              isBanned: profile.is_banned,
              suspensionEndDate: profile.suspension_end_date,
              suspensionReason: profile.suspension_reason,
              banReason: profile.ban_reason,
            });
          }
        }
      } catch (error) {
        console.error('Error checking moderation status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkModerationStatus();

    // Set up realtime subscription for moderation status changes
    const channel = supabase
      .channel('moderation-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const newData = payload.new as { 
            id: string;
            is_suspended: boolean;
            is_banned: boolean;
            suspension_end_date: string | null;
            suspension_reason: string | null;
            ban_reason: string | null;
          };
          
          // Check if this update is for the current user
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && newData.id === user.id) {
              if (newData.is_suspended || newData.is_banned) {
                setModerationStatus({
                  userId: newData.id,
                  isSuspended: newData.is_suspended,
                  isBanned: newData.is_banned,
                  suspensionEndDate: newData.suspension_end_date,
                  suspensionReason: newData.suspension_reason,
                  banReason: newData.ban_reason,
                });
              } else {
                setModerationStatus(null);
              }
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Show blocked screen if user is suspended or banned
  if (moderationStatus && (moderationStatus.isSuspended || moderationStatus.isBanned)) {
    return (
      <AccountBlockedScreen
        userId={moderationStatus.userId}
        isSuspended={moderationStatus.isSuspended}
        isBanned={moderationStatus.isBanned}
        suspensionEndDate={moderationStatus.suspensionEndDate}
        suspensionReason={moderationStatus.suspensionReason}
        banReason={moderationStatus.banReason}
      />
    );
  }

  return <>{children}</>;
}

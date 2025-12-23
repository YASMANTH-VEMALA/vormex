'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ban, Clock, AlertTriangle, MessageCircle, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AccountBlockedScreenProps {
  userId: string;
  isSuspended: boolean;
  isBanned: boolean;
  suspensionEndDate: string | null;
  suspensionReason: string | null;
  banReason: string | null;
}

export default function AccountBlockedScreen({
  userId,
  isSuspended,
  isBanned,
  suspensionEndDate,
  suspensionReason,
  banReason,
}: AccountBlockedScreenProps) {
  const [appealMessage, setAppealMessage] = useState('');
  const [hasAppealed, setHasAppealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [adminId, setAdminId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Calculate time remaining for suspension
  useEffect(() => {
    if (isSuspended && suspensionEndDate) {
      const calculateTimeRemaining = () => {
        const now = new Date();
        const endDate = new Date(suspensionEndDate);
        const diff = endDate.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining('Expired');
          // Auto refresh when suspension expires
          window.location.reload();
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining(`${minutes}m`);
        }
      };

      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [isSuspended, suspensionEndDate]);

  // Check if user has already sent an appeal
  useEffect(() => {
    const checkAppealStatus = async () => {
      // Get admin user
      const { data: adminUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('premium_type', 'admin')
        .single();

      if (adminUser) {
        setAdminId(adminUser.id);

        // Check if there's already an appeal message
        const { data: existingAppeal } = await supabase
          .from('direct_messages')
          .select('id')
          .eq('sender_id', userId)
          .eq('receiver_id', adminUser.id)
          .or('content.ilike.%Appeal for Unsuspension%,content.ilike.%Appeal for Unban%')
          .limit(1);

        if (existingAppeal && existingAppeal.length > 0) {
          setHasAppealed(true);
        }
      }
    };

    checkAppealStatus();
  }, [userId, supabase]);

  const handleAppeal = async () => {
    if (!appealMessage.trim() || !adminId) return;

    setIsSubmitting(true);

    try {
      const appealType = isBanned ? 'Unban' : 'Unsuspension';
      const fullMessage = `🔔 Appeal for ${appealType}\n\nReason: ${isBanned ? banReason : suspensionReason}\n\nAppeal Message:\n${appealMessage}`;

      const { error } = await supabase.from('direct_messages').insert({
        sender_id: userId,
        receiver_id: adminId,
        content: fullMessage,
      });

      if (error) throw error;

      setHasAppealed(true);
      setShowAppealForm(false);
      setAppealMessage('');
    } catch (error) {
      console.error('Error sending appeal:', error);
      alert('Failed to send appeal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-2xl p-8 text-center">
        {/* Icon */}
        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
          isBanned ? 'bg-red-500/20' : 'bg-orange-500/20'
        }`}>
          {isBanned ? (
            <Ban className="w-10 h-10 text-red-500" />
          ) : (
            <Clock className="w-10 h-10 text-orange-500" />
          )}
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-bold mb-2 ${
          isBanned ? 'text-red-500' : 'text-orange-500'
        }`}>
          {isBanned ? 'Account Banned' : 'Account Suspended'}
        </h1>

        {/* Subtitle */}
        <p className="text-zinc-400 mb-6">
          {isBanned 
            ? 'Your account has been permanently banned from Vormex.'
            : 'Your account has been temporarily suspended.'}
        </p>

        {/* Reason Card */}
        <div className="bg-zinc-800 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-zinc-300">Reason</span>
          </div>
          <p className="text-zinc-400 text-sm">
            {isBanned ? banReason : suspensionReason || 'No reason provided'}
          </p>
        </div>

        {/* Time Remaining (for suspension only) */}
        {isSuspended && suspensionEndDate && (
          <div className="bg-orange-500/10 rounded-xl p-4 mb-6">
            <p className="text-sm text-zinc-400 mb-1">Time remaining</p>
            <p className="text-2xl font-bold text-orange-500">{timeRemaining}</p>
            <p className="text-xs text-zinc-500 mt-2">
              Your account will be automatically restored when the suspension ends.
            </p>
          </div>
        )}

        {/* Appeal Section */}
        {!hasAppealed ? (
          <>
            {!showAppealForm ? (
              <button
                onClick={() => setShowAppealForm(true)}
                className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                  isBanned 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                Request {isBanned ? 'Unban' : 'Unsuspension'}
              </button>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  placeholder="Explain why your account should be restored..."
                  className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAppealForm(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAppeal}
                    disabled={!appealMessage.trim() || isSubmitting}
                    className={`flex-1 py-3 px-4 rounded-xl transition-colors disabled:opacity-50 ${
                      isBanned
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Appeal'}
                  </button>
                </div>
                <p className="text-xs text-zinc-500">
                  ⚠️ You can only send one appeal message
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-green-500/10 rounded-xl p-4 mb-6">
            <p className="text-green-400 text-sm">
              ✓ Appeal sent! Admin will review your request.
            </p>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-4 w-full py-3 px-4 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}

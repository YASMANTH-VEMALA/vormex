'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Bell,
  BellOff,
  MessageCircle,
  Heart,
  UserPlus,
  AtSign,
  Users,
  Briefcase,
  GraduationCap,
  Award,
  Loader2,
  Check,
  Smartphone,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import apiClient from '@/lib/api/client';

interface NotificationPreferences {
  // Push Notifications
  pushEnabled: boolean;
  
  // Email Notifications
  emailEnabled: boolean;
  emailDigestFrequency: 'instant' | 'daily' | 'weekly' | 'never';
  
  // Activity Types
  connections: boolean;
  messages: boolean;
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  groups: boolean;
  jobs: boolean;
  learning: boolean;
  achievements: boolean;
  
  // Quiet Hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const defaultPreferences: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  emailDigestFrequency: 'daily',
  connections: true,
  messages: true,
  likes: true,
  comments: true,
  mentions: true,
  groups: true,
  jobs: true,
  learning: true,
  achievements: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ enabled, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled
          ? 'bg-blue-500'
          : 'bg-gray-300 dark:bg-neutral-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <motion.div
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function NotificationSettingsPage() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, subscribe, unsubscribe, isLoading: pushLoading } = usePushNotifications(user?.id);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/notifications/preferences');
      if (response?.data) {
        setPreferences({ ...defaultPreferences, ...response.data });
      }
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      setSaving(true);
      await apiClient.put('/notifications/preferences', newPreferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await subscribe();
      if (success) {
        updatePreference('pushEnabled', true);
      }
    } else {
      await unsubscribe();
      updatePreference('pushEnabled', false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/notifications" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Settings</h1>
                <p className="text-xs text-gray-500">Manage how you receive notifications</p>
              </div>
            </div>
            {(saving || saved) && (
              <div className="flex items-center gap-1.5 text-sm">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-gray-500">Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Saved</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Push Notifications */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-neutral-800">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Push Notifications
            </h2>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Enable Push Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications on your device</p>
              </div>
              <ToggleSwitch
                enabled={isSubscribed || preferences.pushEnabled}
                onChange={handlePushToggle}
                disabled={!isSupported || pushLoading}
              />
            </div>
            {!isSupported && (
              <p className="mt-3 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <BellOff className="w-4 h-4" />
                Push notifications are not supported in this browser
              </p>
            )}
          </div>
        </div>

        {/* Email Notifications */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-neutral-800">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Notifications
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <ToggleSwitch
                enabled={preferences.emailEnabled}
                onChange={(enabled) => updatePreference('emailEnabled', enabled)}
              />
            </div>
            
            {preferences.emailEnabled && (
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                  Email Digest Frequency
                </label>
                <select
                  value={preferences.emailDigestFrequency}
                  onChange={(e) => updatePreference('emailDigestFrequency', e.target.value as NotificationPreferences['emailDigestFrequency'])}
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="instant">Instant (as they happen)</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly digest</option>
                  <option value="never">Never</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-neutral-800">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Types
            </h2>
            <p className="text-sm text-gray-500 mt-1">Choose which notifications you want to receive</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-neutral-800">
            {[
              { key: 'connections' as const, icon: <UserPlus className="w-5 h-5" />, label: 'Connection Requests', description: 'New connection requests and acceptances' },
              { key: 'messages' as const, icon: <MessageCircle className="w-5 h-5" />, label: 'Messages', description: 'New messages and chat activity' },
              { key: 'likes' as const, icon: <Heart className="w-5 h-5" />, label: 'Likes & Reactions', description: 'When someone likes or reacts to your content' },
              { key: 'comments' as const, icon: <MessageCircle className="w-5 h-5" />, label: 'Comments', description: 'New comments on your posts' },
              { key: 'mentions' as const, icon: <AtSign className="w-5 h-5" />, label: 'Mentions', description: 'When someone mentions you' },
              { key: 'groups' as const, icon: <Users className="w-5 h-5" />, label: 'Groups', description: 'Group invites and activity' },
              { key: 'jobs' as const, icon: <Briefcase className="w-5 h-5" />, label: 'Jobs', description: 'Job recommendations and application updates' },
              { key: 'learning' as const, icon: <GraduationCap className="w-5 h-5" />, label: 'Learning', description: 'Course updates and reminders' },
              { key: 'achievements' as const, icon: <Award className="w-5 h-5" />, label: 'Achievements', description: 'Badges, streaks, and milestones' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={preferences[item.key]}
                  onChange={(enabled) => updatePreference(item.key, enabled)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-neutral-800">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BellOff className="w-5 h-5" />
              Quiet Hours
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Enable Quiet Hours</p>
                <p className="text-sm text-gray-500">Pause notifications during specific hours</p>
              </div>
              <ToggleSwitch
                enabled={preferences.quietHoursEnabled}
                onChange={(enabled) => updatePreference('quietHoursEnabled', enabled)}
              />
            </div>
            
            {preferences.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Start Time</label>
                  <input
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">End Time</label>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationSettingsWrapper() {
  return (
    <ProtectedRoute>
      <NotificationSettingsPage />
    </ProtectedRoute>
  );
}

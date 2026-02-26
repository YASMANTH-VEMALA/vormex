'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WelcomeGiftModal } from '@/components/gifts/WelcomeGiftModal';
import type { GiftVariant } from '@/components/gifts/GiftCard';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  LogOut,
  ChevronRight,
  Github,
  MapPin,
  AtSign,
  HelpCircle,
  FileText,
  Flag,
  Trash2,
  Moon,
  Sun,
  Trophy,
  Zap,
  Award,
  Gift,
  ShoppingBag,
  Briefcase,
  Code,
  BookOpen,
  MessageSquare,
  Users,
  Group,
  GraduationCap,
  UserPlus,
  Lock,
  Bookmark,
  Gamepad2,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GitHubIntegration, MentionsDashboard } from '@/components/settings';
import { useAuth } from '@/lib/auth/useAuth';
import { getPendingRequests } from '@/lib/api/connections';
import Cookies from 'js-cookie';

type Section = 'main' | 'integrations' | 'mentions' | 'appearance';

export default function MorePage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('main');
  const [isDark, setIsDark] = useState(
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  const [pendingConnectionsCount, setPendingConnectionsCount] = useState(0);
  const [showGiftModal, setShowGiftModal] = useState(false);

  // Fetch pending connection requests count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const data = await getPendingRequests(1, 1);
        setPendingConnectionsCount(data.total);
      } catch (error) {
        console.error('Failed to fetch pending connections:', error);
      }
    };
    fetchPendingCount();
  }, []);

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      Cookies.remove('authToken');
      localStorage.removeItem('authToken');
      logout();
      router.push('/login');
    }
  };

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  const menuItems = [
    // --- Unlocked Items ---
    {
      id: 'profile',
      label: 'Edit Profile',
      icon: User,
      href: '/profile',
      color: 'text-blue-500',
    },
    {
      id: 'saved',
      label: 'Saved Posts',
      icon: Bookmark,
      href: '/more/saved',
      color: 'text-blue-600',
    },
    {
      id: 'connections',
      label: 'Connection Requests',
      icon: UserPlus,
      href: '/more/connections',
      color: 'text-cyan-500',
      badge: pendingConnectionsCount > 0 ? pendingConnectionsCount : undefined,
    },
    {
      id: 'courses',
      label: 'Video Courses',
      icon: GraduationCap,
      href: '/courses',
      color: 'text-orange-500',
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: Group,
      href: '/groups',
      color: 'text-indigo-500',
    },
    {
      id: 'events',
      label: 'Campus Events',
      icon: Flag,
      href: '/events',
      color: 'text-teal-500',
    },
    {
      id: 'accountability',
      label: 'Grow Together',
      icon: Users,
      href: '/accountability',
      color: 'text-emerald-500',
    },
    {
      id: 'games',
      label: 'Games & XP',
      icon: Gamepad2,
      href: '/more/games',
      color: 'text-purple-600',
    },
    {
      id: 'streaks',
      label: 'Streaks',
      icon: Zap,
      href: '/streaks',
      color: 'text-orange-500',
    },
    {
      id: 'gifts',
      label: 'Gifts',
      icon: Gift,
      onClick: () => setShowGiftModal(true),
      color: 'text-rose-500',
      badge: user && !user.hasClaimedWelcomeGift ? 1 : undefined,
    },
    {
      id: 'nearby',
      label: 'Find Nearby People',
      icon: MapPin,
      href: '/find-people?tab=nearby',
      color: 'text-green-500',
    },
    {
      id: 'integrations',
      label: 'Connected Apps',
      icon: Github,
      onClick: () => setActiveSection('integrations'),
      color: 'text-gray-700 dark:text-gray-300',
    },
    {
      id: 'mentions',
      label: 'Your Mentions',
      icon: AtSign,
      onClick: () => setActiveSection('mentions'),
      color: 'text-purple-500',
    },
    {
      id: 'privacy',
      label: 'Privacy & Security',
      icon: Shield,
      href: '#',
      color: 'text-red-500',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      href: '#',
      color: 'text-cyan-500',
    },
    {
      id: 'terms',
      label: 'Terms of Service',
      icon: FileText,
      href: '#',
      color: 'text-gray-500',
    },
    {
      id: 'report',
      label: 'Report a Problem',
      icon: Flag,
      href: '#',
      color: 'text-orange-500',
    },

    // --- Locked Items ---
    {
      id: 'badges',
      label: 'Achievements & Badges',
      icon: Award,
      href: '/badges',
      color: 'text-amber-500',
      locked: true,
    },
    {
      id: 'store',
      label: 'XP Store',
      icon: ShoppingBag,
      href: '/store',
      color: 'text-emerald-500',
      locked: true,
    },
    {
      id: 'referrals',
      label: 'Invite Friends',
      icon: Gift,
      href: '/referrals',
      color: 'text-rose-500',
      locked: true,
    },
    {
      id: 'jobs',
      label: 'Job Board',
      icon: Briefcase,
      href: '/jobs',
      color: 'text-indigo-500',
      locked: true,
      subtext: 'Need more users to unlock this',
    },
    {
      id: 'challenges',
      label: 'Coding Challenges',
      icon: Code,
      href: '/challenges',
      color: 'text-violet-500',
      locked: true,
    },
    {
      id: 'learning',
      label: 'Learning Paths',
      icon: BookOpen,
      href: '/learning',
      color: 'text-teal-500',
      locked: true,
    },
    {
      id: 'interviews',
      label: 'Mock Interviews',
      icon: MessageSquare,
      href: '/interviews',
      color: 'text-sky-500',
      locked: true,
    },
    {
      id: 'notifications',
      label: 'Notification Settings',
      icon: Bell,
      href: '/notifications',
      color: 'text-yellow-500',
      locked: true,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Palette,
      onClick: () => setActiveSection('appearance'),
      color: 'text-pink-500',
      locked: true,
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              {activeSection !== 'main' && (
                <button
                  onClick={() => setActiveSection('main')}
                  className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-neutral-400 rotate-180" />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeSection === 'main' && 'Settings & More'}
                  {activeSection === 'integrations' && 'Connected Apps'}
                  {activeSection === 'mentions' && 'Mentions'}
                  {activeSection === 'appearance' && 'Appearance'}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {activeSection === 'main' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* User Card */}
              {user && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-xl">
                          {user.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-gray-900 dark:text-white">
                        {user.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-neutral-400">
                        @{user.username}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              )}

              {/* Menu Items */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const content = (
                    <div
                      className={`flex items-center gap-4 px-4 py-3.5 transition-colors ${
                        // @ts-ignore
                        item.locked
                          ? 'opacity-60 cursor-not-allowed bg-gray-50/50 dark:bg-neutral-800/30'
                          : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'
                        } ${index > 0 ? 'border-t border-gray-100 dark:border-neutral-800' : ''}`}
                    >
                      <div className={`${item.color} relative`}>
                        <Icon className="w-5 h-5" />
                        {/* Badge indicator for pending items */}
                        {item.badge && item.badge > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-red-500 text-white rounded-full">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`block text-gray-900 dark:text-white ${
                          // @ts-ignore
                          item.locked ? 'text-gray-500 dark:text-gray-500' : ''
                          }`}>
                          {item.label}
                        </span>
                        {
                          // @ts-ignore
                          item.subtext && (
                            <span className="block text-xs text-amber-600 dark:text-amber-500 font-medium mt-0.5">
                              {/* @ts-ignore */}
                              {item.subtext}
                            </span>
                          )}
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                          {item.badge} new
                        </span>
                      )}
                      {
                        // @ts-ignore
                        item.locked ? (
                          <Lock className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-neutral-600" />
                        )}
                    </div>
                  );

                  // @ts-ignore
                  if (item.locked) {
                    return <div key={item.id}>{content}</div>;
                  }

                  if (item.onClick) {
                    return (
                      <button
                        key={item.id}
                        onClick={item.onClick}
                        className="w-full text-left"
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <Link key={item.id} href={item.href!}>
                      {content}
                    </Link>
                  );
                })}
              </div>

              {/* Danger Zone */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-red-500" />
                  <span className="flex-1 text-left text-red-600 dark:text-red-400 font-medium">
                    Log Out
                  </span>
                </button>
              </div>

              {/* Version */}
              <p className="text-center text-xs text-gray-400 dark:text-neutral-600">
                Vormex v1.0.0
              </p>

              {/* Gifts Modal - show for unclaimed; also allow claimed users to change frame */}
              {user && (
                <WelcomeGiftModal
                  isOpen={showGiftModal}
                  onClose={() => setShowGiftModal(false)}
                  onClaimSuccess={(profileRing: GiftVariant) => {
                    updateUser({ ...user, profileRing, hasClaimedWelcomeGift: true });
                    setShowGiftModal(false);
                  }}
                  hasClaimed={user.hasClaimedWelcomeGift}
                />
              )}
            </motion.div>
          )}

          {activeSection === 'integrations' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <GitHubIntegration />

              {/* More integrations placeholder */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-200 dark:border-neutral-800 text-center">
                <Zap className="w-8 h-8 text-gray-300 dark:text-neutral-700 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-neutral-400 text-sm">
                  More integrations coming soon
                </p>
              </div>
            </motion.div>
          )}

          {activeSection === 'mentions' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <MentionsDashboard />
            </motion.div>
          )}

          {activeSection === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Theme
                  </h3>
                </div>
                <div className="p-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        document.documentElement.classList.remove('dark');
                        localStorage.setItem('theme', 'light');
                        setIsDark(false);
                      }}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${!isDark
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                        }`}
                    >
                      <Sun className={`w-6 h-6 ${!isDark ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${!isDark ? 'text-blue-600' : 'text-gray-600 dark:text-neutral-400'}`}>
                        Light
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        document.documentElement.classList.add('dark');
                        localStorage.setItem('theme', 'dark');
                        setIsDark(true);
                      }}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${isDark
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                        }`}
                    >
                      <Moon className={`w-6 h-6 ${isDark ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-gray-600 dark:text-neutral-400'}`}>
                        Dark
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}



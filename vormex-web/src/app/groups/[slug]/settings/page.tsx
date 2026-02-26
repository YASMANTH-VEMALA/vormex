'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GroupImageUploadModal } from '@/components/groups';
import { 
  getGroup, 
  updateGroup,
  getGroupMembers,
  updateMemberRole,
  removeMember,
  deleteGroup,
  getJoinRequests,
  handleJoinRequest,
  getGroupInvites,
  inviteToGroup,
  cancelInvite,
  Group, 
  GroupMember,
  GroupJoinRequest,
  GroupInvite
} from '@/lib/api/groups';
import { searchUsers, SearchUser } from '@/lib/api/people';

interface GroupSettingsPageProps {
  params: Promise<{ slug: string }>;
}

type SettingsTab = 'general' | 'members' | 'requests' | 'invites' | 'danger';

export default function GroupSettingsPage({ params }: GroupSettingsPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<GroupJoinRequest[]>([]);
  const [pendingInvites, setPendingInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  
  // Invite state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  
  // Image upload modal state
  const [showIconModal, setShowIconModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rules: '',
    category: '',
    privacy: 'PUBLIC' as 'PUBLIC' | 'PRIVATE' | 'SECRET',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [groupData, membersData] = await Promise.all([
          getGroup(resolvedParams.slug),
          getGroupMembers(resolvedParams.slug)
        ]);
        
        // Check if user is admin/owner
        const userRole = groupData.memberRole || groupData.userRole;
        if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
          router.push(`/groups/${resolvedParams.slug}`);
          return;
        }
        
        setGroup(groupData);
        setMembers(membersData.members || []);
        setFormData({
          name: groupData.name,
          description: groupData.description || '',
          rules: Array.isArray(groupData.rules) ? groupData.rules.join('\n') : (groupData.rules || ''),
          category: groupData.category || '',
          privacy: groupData.privacy,
        });

        // Fetch pending join requests for private groups
        if (groupData.privacy === 'PRIVATE') {
          try {
            const requests = await getJoinRequests(groupData.id, 'PENDING');
            setPendingRequests(requests);
          } catch {
            // Silently fail
          }
        }

        // Fetch pending invites for secret groups
        if (groupData.privacy === 'SECRET') {
          try {
            const { invites } = await getGroupInvites(groupData.id, 'PENDING');
            setPendingInvites(invites);
          } catch {
            // Silently fail
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load group settings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.slug, router]);

  // Search users for invite
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await searchUsers(searchQuery);
        // Filter out existing members and pending invites
        const memberIds = new Set(members.map(m => m.user.id));
        const inviteIds = new Set(pendingInvites.map(i => i.invitedUserId));
        const filtered = results.filter(
          u => !memberIds.has(u.id) && !inviteIds.has(u.id)
        );
        setSearchResults(filtered);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, members, pendingInvites]);

  const handleSaveGeneral = async () => {
    if (!group) return;
    
    try {
      setSaving(true);
      setError(null);
      // Convert rules string back to array
      const rulesArray = formData.rules.split('\n').map(r => r.trim()).filter(r => r);
      await updateGroup(group.id, {
        ...formData,
        rules: rulesArray,
      });
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleIconUpdated = (imageUrl: string) => {
    if (group) {
      setGroup({ ...group, iconImage: imageUrl });
      setSuccessMessage('Group icon updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleCoverUpdated = (imageUrl: string) => {
    if (group) {
      setGroup({ ...group, coverImage: imageUrl });
      setSuccessMessage('Group cover updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'ADMIN' | 'MODERATOR' | 'MEMBER') => {
    if (!group) return;
    
    try {
      await updateMemberRole(group.id, memberId, newRole);
      setMembers(prev => 
        prev.map(m => 
          m.id === memberId ? { ...m, role: newRole } : m
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!group || !confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await removeMember(group.id, memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!group) return;
    
    try {
      setProcessingRequest(requestId);
      setError(null);
      await handleJoinRequest(group.id, requestId, action);
      
      // Remove the request from the list
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      
      if (action === 'approve') {
        setSuccessMessage('Member approved successfully!');
        // Refresh members list
        const membersData = await getGroupMembers(group.id);
        setMembers(membersData.members || []);
      } else {
        setSuccessMessage('Request rejected');
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${action} request`);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleInviteUser = async (userId: string) => {
    if (!group) return;
    
    try {
      setInviting(userId);
      setError(null);
      await inviteToGroup(group.id, userId);
      
      // Refresh invites list
      const { invites } = await getGroupInvites(group.id, 'PENDING');
      setPendingInvites(invites);
      
      // Clear search
      setSearchQuery('');
      setSearchResults([]);
      
      setSuccessMessage('Invite sent successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send invite');
    } finally {
      setInviting(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!group) return;
    
    try {
      setProcessingRequest(inviteId);
      await cancelInvite(group.id, inviteId);
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
      setSuccessMessage('Invite cancelled');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel invite');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || deleteConfirmText !== group.name) return;
    
    try {
      setDeleting(true);
      await deleteGroup(group.id);
      router.push('/groups');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete group');
      setDeleting(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; badge?: number; hidden?: boolean }[] = [
    {
      id: 'general',
      label: 'General',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 'members',
      label: 'Members',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'requests',
      label: 'Requests',
      badge: pendingRequests.length,
      hidden: group?.privacy !== 'PRIVATE', // Only for PRIVATE groups
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    {
      id: 'invites',
      label: 'Invites',
      badge: pendingInvites.length,
      hidden: group?.privacy !== 'SECRET', // Only for SECRET groups
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'danger',
      label: 'Danger Zone',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!group) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <p className="text-red-500 mb-4">Group not found or you don&apos;t have permission</p>
            <Link href="/groups" className="text-blue-600 hover:underline">
              Go back to groups
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/groups/${group.slug}`}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Group Settings
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {group.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl"
              >
                {error}
              </motion.div>
            )}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl"
              >
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Tabs */}
            <div className="md:w-64 shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                {tabs.filter(tab => !tab.hidden).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } ${tab.id === 'danger' ? 'text-red-600 dark:text-red-400' : ''}`}
                  >
                    {tab.icon}
                    <span className="font-medium flex-1">{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              {/* General Settings */}
              {activeTab === 'general' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    General Settings
                  </h2>

                  <div className="space-y-6">
                    {/* Group Images */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Group Images
                      </h3>
                      
                      {/* Cover Image */}
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Cover Image
                        </label>
                        <div className="relative">
                          <div className="w-full h-32 rounded-xl overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500">
                            {group.coverImage && (
                              <Image
                                src={group.coverImage}
                                alt="Group cover"
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <button
                            onClick={() => setShowCoverModal(true)}
                            className="absolute bottom-2 right-2 px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 text-sm font-medium rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                          >
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Change Cover
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Click to upload and crop. Recommended: 1200x400 pixels
                        </p>
                      </div>

                      {/* Icon Image */}
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Group Icon
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            {group.iconImage ? (
                              <Image
                                src={group.iconImage}
                                alt="Group icon"
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-2xl font-bold text-white">
                                {group.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <button
                              onClick={() => setShowIconModal(true)}
                              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              Change Icon
                            </button>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Click to upload and crop. Square image recommended
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Group Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter group name"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="What is this group about?"
                      />
                    </div>

                    {/* Rules */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Group Rules
                      </label>
                      <textarea
                        value={formData.rules}
                        onChange={e => setFormData({ ...formData, rules: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Enter group rules (one per line)"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Separate each rule with a new line
                      </p>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Technology, Sports, Art"
                      />
                    </div>

                    {/* Privacy */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Privacy
                      </label>
                      <div className="space-y-3">
                        {[
                          { value: 'PUBLIC', label: 'Public', desc: 'Anyone can find and join' },
                          { value: 'PRIVATE', label: 'Private', desc: 'Anyone can find, but must request to join' },
                          { value: 'SECRET', label: 'Secret', desc: 'Only members can find and invite others' },
                        ].map(option => (
                          <label
                            key={option.value}
                            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                              formData.privacy === option.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                          >
                            <input
                              type="radio"
                              name="privacy"
                              value={option.value}
                              checked={formData.privacy === option.value}
                              onChange={e => setFormData({ ...formData, privacy: e.target.value as any })}
                              className="mt-1"
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {option.label}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {option.desc}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                      <button
                        onClick={handleSaveGeneral}
                        disabled={saving}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Members Management */}
              {activeTab === 'members' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Manage Members
                  </h2>

                  <div className="space-y-4">
                    {members.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                            {(member.user.profileImage || member.user.avatar) ? (
                              <Image
                                src={member.user.profileImage || member.user.avatar || ''}
                                alt={member.user.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                                {member.user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {member.user.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{member.user.username}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            member.role === 'OWNER'
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                              : member.role === 'ADMIN'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : member.role === 'MODERATOR'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                          }`}>
                            {member.role}
                          </span>
                        </div>

                        {member.role !== 'OWNER' && (group.memberRole === 'OWNER' || group.userRole === 'OWNER') && (
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={e => handleUpdateRole(member.id, e.target.value as any)}
                              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="MODERATOR">Moderator</option>
                              <option value="MEMBER">Member</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remove member"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {members.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No members found</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Join Requests (for Private/Secret groups) */}
              {activeTab === 'requests' && (group.privacy === 'PRIVATE' || group.privacy === 'SECRET') && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Pending Requests
                  </h2>

                  <div className="space-y-4">
                    {pendingRequests.map(request => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                            {request.user.profileImage ? (
                              <Image
                                src={request.user.profileImage}
                                alt={request.user.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium text-lg">
                                {request.user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {request.user.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{request.user.username}
                            </p>
                            {request.message && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">
                                &ldquo;{request.message}&rdquo;
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Requested {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRequest(request.id, 'approve')}
                            disabled={processingRequest === request.id}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {processingRequest === request.id ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleRequest(request.id, 'reject')}
                            disabled={processingRequest === request.id}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}

                    {pendingRequests.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">No pending requests</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          When someone requests to join, they&apos;ll appear here
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Invites (for Secret groups) */}
              {activeTab === 'invites' && group.privacy === 'SECRET' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Invite Members
                  </h2>

                  {/* Search to invite */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search users to invite
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by name or username..."
                        className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {searching && (
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                    </div>

                    {/* Search results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                        {searchResults.map(user => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                                {user.profileImage ? (
                                  <Image
                                    src={user.profileImage}
                                    alt={user.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {user.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleInviteUser(user.id)}
                              disabled={inviting === user.id}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {inviting === user.id ? 'Sending...' : 'Invite'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pending invites */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Pending Invites ({pendingInvites.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingInvites.map(invite => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                              {invite.invitedUser.profileImage ? (
                                <Image
                                  src={invite.invitedUser.profileImage}
                                  alt={invite.invitedUser.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                                  {invite.invitedUser.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {invite.invitedUser.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                @{invite.invitedUser.username}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Invited {new Date(invite.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelInvite(invite.id)}
                            disabled={processingRequest === invite.id}
                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}

                      {pendingInvites.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No pending invites. Search for users above to invite them.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Danger Zone */}
              {activeTab === 'danger' && (group.memberRole === 'OWNER' || group.userRole === 'OWNER') && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-2 border-red-200 dark:border-red-800"
                >
                  <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">
                    Danger Zone
                  </h2>

                  <div className="space-y-6">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">
                        Delete Group
                      </h3>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                        Once you delete a group, there is no going back. All posts, messages, and members will be permanently deleted.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete Group
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Delete Group?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    This action cannot be undone. Type <strong>{group.name}</strong> to confirm.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="Type group name to confirm"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteGroup}
                    disabled={deleteConfirmText !== group.name || deleting}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting...' : 'Delete Group'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Upload Modals */}
        <GroupImageUploadModal
          isOpen={showIconModal}
          onClose={() => setShowIconModal(false)}
          groupId={group.id}
          type="icon"
          currentImageUrl={group.iconImage}
          onImageUpdated={handleIconUpdated}
        />
        <GroupImageUploadModal
          isOpen={showCoverModal}
          onClose={() => setShowCoverModal(false)}
          groupId={group.id}
          type="cover"
          currentImageUrl={group.coverImage}
          onImageUpdated={handleCoverUpdated}
        />
      </div>
    </ProtectedRoute>
  );
}

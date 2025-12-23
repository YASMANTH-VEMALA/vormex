'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Users2, Lock, Globe, UserPlus, UserMinus, Plus, X, AlertCircle, Loader2, MessageCircle, Bell, BellOff } from 'lucide-react'
import Image from 'next/image'
import { notificationService, useNotificationPermission } from '@/lib/notifications'

interface GroupWithMembers {
  id: string
  name: string
  description: string | null
  visibility: 'public' | 'private'
  avatar_url: string | null
  created_at: string
  member_count: number
  is_member: boolean
  unread_count: number
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null)
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false)
  const { requestPermission, hasPermission, isSupported } = useNotificationPermission()
  const lastMessageTimestamps = useRef<Map<string, string>>(new Map())
  const hasLoadedRef = useRef(false)

  const router = useRouter()
  const supabase = createClient()

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUserId(user.id)

      // Check if user is admin - ONLY by email
      const adminEmails = ['yasmanthvemala007@gmail.com']
      setIsAdmin(adminEmails.includes(user.email || ''))

      // Get all groups first
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (groupsError) throw groupsError

      // Get all memberships separately (without last_read_at for now - migration may not be run)
      const { data: membershipsData } = await supabase
        .from('group_members')
        .select('group_id, user_id')

      const memberships = membershipsData || []

      // Transform data (unread counts will be 0 until migration is run)
      const transformedGroups = (groupsData || []).map(group => {
        const groupMembers = memberships.filter(m => m.group_id === group.id)
        const isMember = groupMembers.some(m => m.user_id === user.id)
        return {
          id: group.id,
          name: group.name,
          description: group.description,
          visibility: group.visibility as 'public' | 'private',
          avatar_url: group.avatar_url,
          created_at: group.created_at,
          member_count: groupMembers.length,
          is_member: isMember,
          unread_count: 0 // Will be populated after migration is run
        }
      })

      setGroups(transformedGroups)

      // Check if we should prompt for notifications (only once)
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'default' && !localStorage.getItem('notification_prompt_dismissed')) {
            setShowNotificationPrompt(true)
          }
        }
      }

    } catch (error) {
      console.error('Error loading groups:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  // Realtime subscription for new group messages - simplified to avoid infinite loops
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel('group-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as {
            id: string
            group_id: string
            sender_id: string
            content: string
            created_at: string
          }

          // Ignore own messages or non-group messages
          if (newMessage.sender_id === currentUserId || !newMessage.group_id) return

          // Prevent duplicate notifications
          const lastTimestamp = lastMessageTimestamps.current.get(newMessage.group_id)
          if (lastTimestamp === newMessage.created_at) return
          lastMessageTimestamps.current.set(newMessage.group_id, newMessage.created_at)

          // Update unread count using callback to avoid stale state
          setGroups(prev => {
            const group = prev.find(g => g.id === newMessage.group_id)
            if (!group || !group.is_member) return prev
            
            return prev.map(g => 
              g.id === newMessage.group_id
                ? { ...g, unread_count: g.unread_count + 1 }
                : g
            )
          })

          // Show notification if permission granted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            // Get group name from current state
            const { data: groupData } = await supabase
              .from('groups')
              .select('name')
              .eq('id', newMessage.group_id)
              .single()

            const { data: senderData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMessage.sender_id)
              .single()

            if (groupData) {
              notificationService.showGroupMessageNotification(
                groupData.name,
                senderData?.full_name || 'Someone',
                newMessage.content,
                newMessage.group_id
              )
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, supabase])

  const handleJoinGroup = async (groupId: string) => {
    try {
      setJoiningGroup(groupId)

      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: currentUserId!,
          role: 'member'
        })

      if (error) throw error

      // Update local state
      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, is_member: true, member_count: g.member_count + 1 }
          : g
      ))
    } catch (error) {
      console.error('Error joining group:', error)
    } finally {
      setJoiningGroup(null)
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    try {
      setJoiningGroup(groupId)

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUserId!)

      if (error) throw error

      // Update local state
      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, is_member: false, member_count: g.member_count - 1 }
          : g
      ))
    } catch (error) {
      console.error('Error leaving group:', error)
    } finally {
      setJoiningGroup(null)
    }
  }

  const handleEnableNotifications = async () => {
    const granted = await requestPermission()
    if (granted) {
      setShowNotificationPrompt(false)
    }
  }

  const handleDismissNotificationPrompt = () => {
    setShowNotificationPrompt(false)
    localStorage.setItem('notification_prompt_dismissed', 'true')
  }

  // Calculate total unread count
  const totalUnreadCount = groups.reduce((sum, g) => sum + g.unread_count, 0)

  return (
    <div className="min-h-screen bg-black">
      {/* Notification Permission Prompt */}
      {showNotificationPrompt && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Enable Notifications</p>
                <p className="text-white/70 text-xs">Get notified when you receive new messages</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDismissNotificationPrompt}
                className="p-2 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleEnableNotifications}
                className="px-4 py-1.5 bg-white text-indigo-600 rounded-full text-sm font-medium"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`sticky ${showNotificationPrompt ? 'top-[60px]' : 'top-0'} z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800/50 transition-all`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Groups</h1>
            {totalUnreadCount > 0 && (
              <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </div>
          
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </header>

      {/* Floating Action Button for Mobile */}
      {isAdmin && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 md:hidden"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Content */}
      <div className="px-4 py-4 pb-32">
        {loading ? (
          <LoadingState />
        ) : groups.length === 0 ? (
          <EmptyState isAdmin={isAdmin} onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <GroupCard 
                key={group.id} 
                group={group}
                onJoin={() => handleJoinGroup(group.id)}
                onLeave={() => handleLeaveGroup(group.id)}
                isLoading={joiningGroup === group.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadGroups()
          }}
        />
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-900/50 rounded-2xl p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 bg-gray-800 rounded-xl" />
            <div className="flex-1">
              <div className="h-4 bg-gray-800 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-full mb-2" />
              <div className="h-3 bg-gray-800 rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ isAdmin, onCreateClick }: { isAdmin: boolean; onCreateClick: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users2 className="w-8 h-8 text-gray-600" />
      </div>
      <h4 className="text-white font-medium mb-2">No groups yet</h4>
      <p className="text-gray-500 text-sm max-w-xs mx-auto mb-4">
        {isAdmin 
          ? 'Create the first group to get started'
          : 'Groups will appear here once admins create them'
        }
      </p>
      {isAdmin && (
        <button
          onClick={onCreateClick}
          className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          Create Group
        </button>
      )}
    </div>
  )
}

function GroupCard({ 
  group, 
  onJoin, 
  onLeave, 
  isLoading 
}: { 
  group: GroupWithMembers
  onJoin: () => void
  onLeave: () => void
  isLoading: boolean
}) {
  const router = useRouter()

  const handleCardClick = () => {
    if (group.is_member) {
      router.push(`/groups/${group.id}`)
    }
  }

  return (
    <div 
      className={`bg-gray-900/50 border ${
        group.unread_count > 0 ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-gray-800/50'
      } rounded-2xl p-4 ${
        group.is_member ? 'cursor-pointer hover:bg-gray-900/70 transition-colors' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        {/* Avatar with unread badge */}
        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-gray-800 overflow-hidden flex-shrink-0">
            {group.avatar_url ? (
              <Image
                src={group.avatar_url}
                alt=""
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center">
                <Users2 className="w-6 h-6 text-indigo-400" />
              </div>
            )}
          </div>
          {/* Unread count badge */}
          {group.unread_count > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-indigo-500 rounded-full flex items-center justify-center px-1.5">
              <span className="text-white text-xs font-bold">
                {group.unread_count > 99 ? '99+' : group.unread_count}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium truncate">{group.name}</h3>
            {group.visibility === 'private' ? (
              <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            )}
            {group.unread_count > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full">
                {group.unread_count} new
              </span>
            )}
          </div>
          
          {group.description && (
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">
              {group.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-gray-500 text-xs">
              {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
            </span>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {group.is_member && (
                <button
                  onClick={() => router.push(`/groups/${group.id}`)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    group.unread_count > 0 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-indigo-500/20 text-indigo-400'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  {group.unread_count > 0 ? 'View Messages' : 'Chat'}
                </button>
              )}
              
              {group.visibility === 'public' && (
                <button
                  onClick={group.is_member ? onLeave : onJoin}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    group.is_member
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-indigo-500 text-white'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : group.is_member ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Leave
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Join
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateGroupModal({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void
  onSuccess: () => void 
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: group, error: createError } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          visibility,
          created_by: user.id
        })
        .select()
        .single()

      if (createError) throw createError

      // Add creator as admin member
      await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        })

      onSuccess()
    } catch (err) {
      console.error(err)
      setError('Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 rounded-t-3xl animate-slide-up">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create Group</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-colors ${
                  visibility === 'public'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                <Globe className="w-4 h-4" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-colors ${
                  visibility === 'private'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                <Lock className="w-4 h-4" />
                Private
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-indigo-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Group'
            )}
          </button>
        </form>

        <div className="safe-area-bottom" />
      </div>
    </div>
  )
}

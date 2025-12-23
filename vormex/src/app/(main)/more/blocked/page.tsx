'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserX, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'

interface BlockedUser {
  id: string
  blocked_id: string
  profile: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

export default function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [unblocking, setUnblocking] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const loadBlockedUsers = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch blocked user records
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_users')
        .select('id, blocked_id')
        .eq('blocker_id', user.id)

      if (blockedError) throw blockedError
      if (!blockedData || blockedData.length === 0) {
        setBlockedUsers([])
        return
      }

      // Fetch profiles for blocked users
      const blockedIds = blockedData.map(b => b.blocked_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', blockedIds)

      if (profilesError) throw profilesError

      // Combine the data
      const result: BlockedUser[] = blockedData.map(blocked => ({
        id: blocked.id,
        blocked_id: blocked.blocked_id,
        profile: profilesData?.find(p => p.id === blocked.blocked_id) || null
      }))
      
      setBlockedUsers(result)
    } catch (error) {
      console.error('Error loading blocked users:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadBlockedUsers()
  }, [loadBlockedUsers])

  const handleUnblock = async (blockedUserId: string, recordId: string) => {
    try {
      setUnblocking(blockedUserId)

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', recordId)

      if (error) throw error

      setBlockedUsers(prev => prev.filter(b => b.id !== recordId))
    } catch (error) {
      console.error('Error unblocking user:', error)
    } finally {
      setUnblocking(null)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-white">Blocked Users</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserX className="w-8 h-8 text-gray-600" />
            </div>
            <h4 className="text-white font-medium mb-2">No blocked users</h4>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              When you block someone, they&apos;ll appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((blocked) => (
              <div 
                key={blocked.id}
                className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden">
                    {blocked.profile?.avatar_url ? (
                      <Image
                        src={blocked.profile.avatar_url}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400 font-medium">
                          {blocked.profile?.full_name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-white font-medium">
                    {blocked.profile?.full_name || 'Unknown User'}
                  </p>
                </div>

                <button
                  onClick={() => handleUnblock(blocked.blocked_id, blocked.id)}
                  disabled={unblocking === blocked.blocked_id}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {unblocking === blocked.blocked_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Unblock'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

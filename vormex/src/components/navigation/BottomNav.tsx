'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Home, Users, Users2, User, Shield, MoreHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/people', label: 'People', icon: Users },
  { href: '/groups', label: 'Groups', icon: Users2 },
  { href: '/more', label: 'More', icon: MoreHorizontal },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [groupsUnreadCount, setGroupsUnreadCount] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  const loadGroupsUnreadCount = useCallback(async (userId: string) => {
    try {
      // Get user's group memberships with last_read_at
      const { data: membershipsData } = await supabase
        .from('group_members')
        .select('group_id, last_read_at')
        .eq('user_id', userId)

      if (!membershipsData || membershipsData.length === 0) {
        setGroupsUnreadCount(0)
        return
      }

      let totalUnread = 0

      // Count unread messages for each group
      for (const membership of membershipsData) {
        let query = supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', membership.group_id)
          .neq('sender_id', userId)

        if (membership.last_read_at) {
          query = query.gt('created_at', membership.last_read_at)
        }

        const { count } = await query
        totalUnread += count || 0
      }

      setGroupsUnreadCount(totalUnread)
    } catch (error) {
      console.error('Error loading groups unread count:', error)
    }
  }, [supabase])

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        
        // ONLY yasmanthvemala007@gmail.com is admin - no role table check
        const adminEmails = ['yasmanthvemala007@gmail.com']
        setIsAdmin(adminEmails.includes(user.email || ''))

        // Load initial unread count
        loadGroupsUnreadCount(user.id)
      }
    }
    checkAdmin()
  }, [supabase, loadGroupsUnreadCount])

  // Realtime subscription for new messages
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel('bottomnav-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as { group_id: string; sender_id: string }
          
          // Only count group messages not sent by current user
          if (newMessage.group_id && newMessage.sender_id !== currentUserId) {
            // Don't increment if user is on groups page (they'll see it there)
            if (!pathname.startsWith('/groups')) {
              setGroupsUnreadCount(prev => prev + 1)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, pathname, supabase])

  // Reset count when visiting groups
  useEffect(() => {
    if (pathname.startsWith('/groups') && currentUserId) {
      // Reload to get accurate count after viewing
      const timer = setTimeout(() => {
        loadGroupsUnreadCount(currentUserId)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [pathname, currentUserId, loadGroupsUnreadCount])

  const allNavItems = isAdmin 
    ? [navItems[0], navItems[1], navItems[2], { href: '/admin', label: 'Admin', icon: Shield }, navItems[3], navItems[4]]
    : navItems

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-gray-800/50 z-50">
      <div className="safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-2">
          {allNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            const showBadge = item.href === '/groups' && groupsUnreadCount > 0
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-1 py-1.5 px-2 min-w-[50px] transition-colors ${
                  isActive 
                    ? 'text-indigo-400' 
                    : 'text-gray-500'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-indigo-500 rounded-full flex items-center justify-center px-1">
                      <span className="text-white text-[10px] font-bold">
                        {groupsUnreadCount > 99 ? '99+' : groupsUnreadCount}
                      </span>
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-medium ${
                  isActive 
                    ? 'text-indigo-400' 
                    : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

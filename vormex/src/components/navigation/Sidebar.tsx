'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, Users, Users2, MoreHorizontal, User, LogOut, Shield, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { InstallButton } from '@/components/pwa/InstallPrompt'

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/people', label: 'People', icon: Users },
  { href: '/groups', label: 'Groups', icon: Users2 },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/more', label: 'More', icon: MoreHorizontal },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // ONLY yasmanthvemala007@gmail.com is admin - no role table check
        const adminEmails = ['yasmanthvemala007@gmail.com']
        setIsAdmin(adminEmails.includes(user.email || ''))

        // Check unread messages
        const { count } = await supabase
          .from('direct_messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false)
        
        setUnreadCount(count || 0)
      }
    }
    checkAdmin()
  }, [supabase])

  const allNavItems = isAdmin 
    ? [...navItems, { href: '/admin', label: 'Admin Panel', icon: Shield }]
    : navItems

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gray-950 border-r border-gray-800/50 h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800/50">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-indigo-400">V</span>ormex
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {allNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            const showBadge = item.href === '/messages' && unreadCount > 0
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                    isActive 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                  <span className="font-medium">{item.label}</span>
                  {showBadge && (
                    <span className="absolute right-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Install App Button */}
        <div className="mt-6 pt-4 border-t border-gray-800/50">
          <InstallButton />
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-800/50">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800/50 hover:text-red-400 transition-all w-full"
        >
          <LogOut className="w-5 h-5 stroke-[1.5]" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import { Bell, Megaphone, Loader2, MessageCircle, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

interface Announcement {
  id: string
  title: string
  content: string
  image_url: string | null
  is_highlighted: boolean
  created_at: string
  created_by: string
  group_id?: string | null
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  }
}

interface UserProfile {
  full_name: string | null
  avatar_url: string | null
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallModal, setShowInstallModal] = useState(false)
  
  const supabase = createClient()

  const loadAnnouncements = useCallback(async () => {
    try {
      // Get announcements
      const { data: announcementsData, error } = await supabase
        .from('announcements')
        .select('*')
        .is('group_id', null)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching announcements:', error)
        return
      }

      if (!announcementsData || announcementsData.length === 0) {
        setAnnouncements([])
        return
      }

      // Get creator profiles
      const creatorIds = [...new Set(announcementsData.map(a => a.created_by))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', creatorIds)

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
      )

      // Combine data
      const announcementsWithProfiles = announcementsData.map(announcement => ({
        ...announcement,
        profiles: profilesMap.get(announcement.created_by)
      }))

      setAnnouncements(announcementsWithProfiles)
    } catch (error) {
      console.error('Error loading announcements:', error)
    }
  }, [supabase])

  const loadUserProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUserProfile(profile)
    }

    // Load unread messages count
    const { count } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)
    
    setUnreadCount(count || 0)
  }, [supabase])

  // PWA Install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowInstallModal(true)
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowInstallModal(false)
    }
    setDeferredPrompt(null)
  }

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([loadAnnouncements(), loadUserProfile()])
      setLoading(false)
    }
    init()
  }, [loadAnnouncements, loadUserProfile])

  // Real-time subscription for announcements
  useEffect(() => {
    const channel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        async (payload) => {
          console.log('Announcement change:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newAnnouncement = payload.new as Announcement
            
            // Only add if it's a global announcement (no group_id)
            if (newAnnouncement.group_id) return
            
            // Get profile for the new announcement
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', newAnnouncement.created_by)
              .single()

            setAnnouncements(prev => [{
              ...newAnnouncement,
              profiles: profile || undefined
            }, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const updatedAnnouncement = payload.new as Announcement
            setAnnouncements(prev => prev.map(a => 
              a.id === updatedAnnouncement.id 
                ? { ...a, ...updatedAnnouncement }
                : a
            ))
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setAnnouncements(prev => prev.filter(a => a.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">V</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Vormex</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Download Button */}
            <button 
              onClick={handleInstall}
              className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors"
            >
              <Download className="w-5 h-5 text-gray-400" />
            </button>
            
            {/* Messages Button */}
            <Link 
              href="/messages"
              className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors relative"
            >
              <MessageCircle className="w-5 h-5 text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            
            {/* Notifications Button */}
            <button className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="px-4 py-6 border-b border-gray-800/50">
        <p className="text-gray-400 text-sm">Welcome back,</p>
        <h2 className="text-xl font-bold text-white mt-1">
          {userProfile?.full_name || 'Student'}
        </h2>
      </div>

      {/* Announcements */}
      <div className="px-4 py-4 pb-24">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-white">Announcements</h3>
        </div>

        {announcements.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </div>
        )}
      </div>

      {/* Install Instructions Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Install Vormex</h3>
              <p className="text-gray-400 text-center text-sm mb-6">
                Add Vormex to your home screen for the best experience!
              </p>
              
              <div className="space-y-4 text-sm">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-indigo-400 font-medium mb-2">On iPhone/iPad:</p>
                  <ol className="text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Tap the Share button</li>
                    <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                    <li>Tap &quot;Add&quot; to confirm</li>
                  </ol>
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-indigo-400 font-medium mb-2">On Android:</p>
                  <ol className="text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Tap the menu (⋮) button</li>
                    <li>Tap &quot;Install app&quot; or &quot;Add to Home Screen&quot;</li>
                    <li>Tap &quot;Install&quot; to confirm</li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-800">
              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <Megaphone className="w-8 h-8 text-gray-600" />
      </div>
      <h4 className="text-white font-medium mb-2">No announcements yet</h4>
      <p className="text-gray-500 text-sm max-w-xs mx-auto">
        Stay tuned for updates from the community
      </p>
    </div>
  )
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <div 
      className={`rounded-2xl overflow-hidden ${
        announcement.is_highlighted 
          ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20' 
          : 'bg-gray-900/50 border border-gray-800/50'
      }`}
    >
      {/* Image */}
      {announcement.image_url && (
        <div className="relative w-full h-48">
          <Image
            src={announcement.image_url}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex-shrink-0">
            {announcement.profiles?.avatar_url ? (
              <Image
                src={announcement.profiles.avatar_url}
                alt=""
                width={40}
                height={40}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center">
                <span className="text-indigo-400 text-sm font-semibold">
                  {announcement.profiles?.full_name?.[0] || 'A'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {announcement.profiles?.full_name || 'Admin'}
            </p>
            <p className="text-gray-500 text-xs">
              {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
            </p>
          </div>
          {announcement.is_highlighted && (
            <div className="px-2 py-1 bg-indigo-500/20 rounded-full">
              <span className="text-indigo-400 text-xs font-medium">Pinned</span>
            </div>
          )}
        </div>

        {/* Content */}
        <h4 className="text-white font-semibold mb-2">{announcement.title}</h4>
        <p className="text-gray-400 text-sm leading-relaxed">{announcement.content}</p>
      </div>
    </div>
  )
}

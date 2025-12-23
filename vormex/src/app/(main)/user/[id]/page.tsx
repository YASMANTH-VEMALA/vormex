'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Calendar,
  MoreVertical,
  Flag,
  UserX,
  Loader2,
  Crown,
  MessageCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ReportUserModal, BlockUserModal } from '@/components/moderation/ReportBlockModals'
import PremiumAvatar, { PremiumSvgFilters } from '@/components/premium/PremiumAvatar'

interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  city: string | null
  state: string | null
  created_at: string
  college_name: string | null
  is_premium: boolean
  premium_type: 'basic' | 'super' | 'admin' | null
  user_settings: {
    show_location_publicly: boolean
  } | null
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserIsPremium, setCurrentUserIsPremium] = useState(false)
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false)
  const [isProfileUserAdmin, setIsProfileUserAdmin] = useState(false)
  const [messageLoading, setMessageLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)

        // Check if this user is blocked
        const { data: blockData } = await supabase
          .from('blocked_users')
          .select('id')
          .eq('blocker_id', user.id)
          .eq('blocked_id', id)
          .single()

        setIsBlocked(!!blockData)

        // Get current user's premium status
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single()
        
        setCurrentUserIsPremium(currentUserProfile?.is_premium || false)

        // Check if current user is admin - ONLY by email
        const adminEmails = ['yasmanthvemala007@gmail.com']
        setIsCurrentUserAdmin(adminEmails.includes(user.email || ''))
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city, state, created_at, college_name, is_premium, premium_type')
        .eq('id', id)
        .single()

      if (profileError) throw profileError
      if (!profileData) {
        setProfile(null)
        return
      }

      // Fetch user settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('show_location_publicly')
        .eq('user_id', id)
        .single()

      const userProfile: UserProfile = {
        id: profileData.id,
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
        city: profileData.city,
        state: profileData.state,
        created_at: profileData.created_at,
        college_name: profileData.college_name,
        is_premium: profileData.is_premium || false,
        premium_type: profileData.premium_type as 'basic' | 'super' | 'admin' | null,
        user_settings: settingsData ? { show_location_publicly: settingsData.show_location_publicly } : null
      }

      setProfile(userProfile)

      // Check if the profile user is an admin (based on premium_type for display purposes)
      setIsProfileUserAdmin(userProfile.premium_type === 'admin')
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, id])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleBlock = () => {
    setShowBlockModal(false)
    setIsBlocked(true)
    router.back()
  }

  const handleMessage = async () => {
    if (!currentUserId || !profile) return
    
    setMessageLoading(true)
    
    try {
      // Current user is admin or premium → can message anyone
      if (currentUserIsPremium || isCurrentUserAdmin) {
        router.push(`/messages?user=${profile.id}`)
      } 
      // Non-premium user clicking on Admin profile → allowed to chat
      else if (isProfileUserAdmin) {
        router.push(`/messages?user=${profile.id}`)
      }
      // Non-premium user clicking on non-admin profile → redirect to premium
      else {
        router.push('/premium?context=unlock_messaging')
      }
    } catch (error) {
      console.error('Error handling message:', error)
    } finally {
      setMessageLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  if (!profile || isBlocked) {
    return (
      <div className="min-h-screen bg-black">
        <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <h1 className="text-xl font-bold text-white">Profile</h1>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">User not found</p>
        </div>
      </div>
    )
  }

  const showLocation = profile.user_settings?.show_location_publicly !== false
  const isOwnProfile = currentUserId === profile.id

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <h1 className="text-xl font-bold text-white">Profile</h1>
          </div>

          {!isOwnProfile && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>

              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMenu(false)} 
                  />
                  <div className="absolute right-0 top-12 w-48 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden z-50 animate-fade-in">
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        setShowReportModal(true)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors"
                    >
                      <Flag className="w-4 h-4 text-yellow-400" />
                      Report User
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        setShowBlockModal(true)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-gray-800 transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                      Block User
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Premium SVG Filters */}
      <PremiumSvgFilters />

      {/* Content */}
      <div className="px-4 py-6">
        {/* Avatar and Name */}
        <div className="flex flex-col items-center mb-8">
          <PremiumAvatar
            src={profile.avatar_url}
            alt={profile.full_name || ''}
            size="xl"
            isPremium={profile.is_premium}
            premiumType={profile.premium_type}
          />
          <div className="flex items-center gap-2 mt-4 mb-1">
            <h2 className="text-xl font-bold text-white">
              {profile.full_name || 'Anonymous'}
            </h2>
            {profile.is_premium && profile.premium_type && (
              <Crown className={`w-5 h-5 ${
                profile.premium_type === 'admin' 
                  ? 'text-purple-400' 
                  : profile.premium_type === 'super' 
                    ? 'text-amber-400' 
                    : 'text-blue-400'
              }`} />
            )}
          </div>
          {/* Premium Badge */}
          {profile.is_premium && profile.premium_type && (
            <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${
              profile.premium_type === 'admin'
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                : profile.premium_type === 'super' 
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30' 
                  : 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30'
            }`}>
              <span className={`text-sm font-medium ${
                profile.premium_type === 'admin'
                  ? 'text-purple-400'
                  : profile.premium_type === 'super' 
                    ? 'text-amber-400' 
                    : 'text-blue-400'
              }`}>
                {profile.premium_type === 'admin' 
                  ? 'Admin Premium' 
                  : profile.premium_type === 'super' 
                    ? 'Super Supporter' 
                    : 'Premium'}
              </span>
            </div>
          )}

          {/* Message Button */}
          {!isOwnProfile && (
            <button
              onClick={handleMessage}
              disabled={messageLoading}
              className="mt-4 w-full max-w-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {messageLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  Message
                </>
              )}
            </button>
          )}
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          {profile.college_name && (
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">College</p>
                <p className="text-white">{profile.college_name}</p>
              </div>
            </div>
          )}

          {showLocation && (profile.city || profile.state) && (
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Location</p>
                <p className="text-white">
                  {[profile.city, profile.state].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}

          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Member since</p>
              <p className="text-white">
                {format(new Date(profile.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showReportModal && (
        <ReportUserModal
          userId={profile.id}
          userName={profile.full_name || 'User'}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showBlockModal && (
        <BlockUserModal
          userId={profile.id}
          userName={profile.full_name || 'User'}
          onClose={() => setShowBlockModal(false)}
          onSuccess={handleBlock}
        />
      )}
    </div>
  )
}

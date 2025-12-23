'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Building2, Filter, X, User, AlertCircle, Crown } from 'lucide-react'
import PremiumAvatar, { PremiumSvgFilters } from '@/components/premium/PremiumAvatar'

interface PublicProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  city: string | null
  state: string | null
  college_name: string | null
  is_premium: boolean
  premium_type: 'basic' | 'super' | 'admin' | null
  user_settings: {
    show_location_publicly: boolean
  } | null
}

interface FilterState {
  college: string
  state: string
}

export default function PeoplePage() {
  const [people, setPeople] = useState<PublicProfile[]>([])
  const [filteredPeople, setFilteredPeople] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({ college: '', state: '' })
  const [colleges, setColleges] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [blockedUsers, setBlockedUsers] = useState<string[]>([])

  const supabase = createClient()

  const loadPeople = useCallback(async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        
        // Get blocked users
        const { data: blockedData } = await supabase
          .from('blocked_users')
          .select('blocked_id')
          .eq('blocker_id', user.id)

        if (blockedData) {
          setBlockedUsers(blockedData.map(b => b.blocked_id))
        }
      }

      // Get profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city, state, college_name, is_premium, premium_type')
        .eq('is_profile_complete', true)

      if (profilesError) throw profilesError
      if (!profilesData) {
        setPeople([])
        setFilteredPeople([])
        return
      }

      // Get user settings
      const userIds = profilesData.map(p => p.id)
      let settingsMap: Record<string, { show_location_publicly: boolean }> = {}
      if (userIds.length > 0) {
        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('user_id, show_location_publicly')
          .in('user_id', userIds)
        
        if (settingsData) {
          settingsMap = Object.fromEntries(settingsData.map(s => [s.user_id, { show_location_publicly: s.show_location_publicly }]))
        }
      }

      // Combine data
      const combinedPeople: PublicProfile[] = profilesData.map(p => ({
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        city: p.city,
        state: p.state,
        college_name: p.college_name,
        is_premium: p.is_premium || false,
        premium_type: p.premium_type as 'basic' | 'super' | 'admin' | null,
        user_settings: settingsMap[p.id] || null
      }))

      // Filter out current user
      const visiblePeople = combinedPeople.filter(p => {
        if (p.id === user?.id) return false
        return true
      })

      setPeople(visiblePeople)
      setFilteredPeople(visiblePeople)

      // Extract unique colleges and states for filters
      const uniqueColleges = [...new Set(visiblePeople
        .map(p => p.college_name)
        .filter(Boolean))] as string[]
      const uniqueStates = [...new Set(visiblePeople
        .map(p => p.state)
        .filter(Boolean))] as string[]

      setColleges(uniqueColleges.sort())
      setStates(uniqueStates.sort())

    } catch (error) {
      console.error('Error loading people:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadPeople()
  }, [loadPeople])

  useEffect(() => {
    let result = people

    // Filter out blocked users
    result = result.filter(p => !blockedUsers.includes(p.id))

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.full_name?.toLowerCase().includes(query) ||
        p.college_name?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query)
      )
    }

    // Apply college filter
    if (filters.college) {
      result = result.filter(p => p.college_name === filters.college)
    }

    // Apply state filter
    if (filters.state) {
      result = result.filter(p => p.state === filters.state)
    }

    // Sort by premium status: admin > super > basic > non-premium
    result = result.sort((a, b) => {
      const getPriority = (user: PublicProfile) => {
        if (!user.is_premium) return 0
        if (user.premium_type === 'admin') return 4
        if (user.premium_type === 'super') return 3
        if (user.premium_type === 'basic') return 2
        return 1
      }
      return getPriority(b) - getPriority(a)
    })

    setFilteredPeople(result)
  }, [searchQuery, filters, people, blockedUsers])

  const clearFilters = () => {
    setFilters({ college: '', state: '' })
    setSearchQuery('')
  }

  const hasActiveFilters = !!(filters.college || filters.state)

  return (
    <div className="min-h-screen bg-black">
      {/* Premium SVG Filters */}
      <PremiumSvgFilters />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-white mb-3">People</h1>
          
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, college..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 rounded-xl border transition-colors ${
                hasActiveFilters 
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' 
                  : 'bg-gray-900 border-gray-800 text-gray-400'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 p-3 bg-gray-900/50 rounded-xl border border-gray-800/50 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-400">Filters</span>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-indigo-400 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.college}
                  onChange={(e) => setFilters({ ...filters, college: e.target.value })}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="">All Colleges</option>
                  {colleges.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                
                <select
                  value={filters.state}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="">All States</option>
                  {states.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <LoadingState />
        ) : filteredPeople.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters || !!searchQuery} />
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-4">
              {filteredPeople.length} {filteredPeople.length === 1 ? 'person' : 'people'} found
            </p>
            <div className="space-y-3">
              {filteredPeople.map((person) => (
                <PersonCard 
                  key={person.id} 
                  person={person} 
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-gray-900/50 rounded-2xl p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-800 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-800 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
        {hasFilters ? (
          <AlertCircle className="w-8 h-8 text-gray-600" />
        ) : (
          <User className="w-8 h-8 text-gray-600" />
        )}
      </div>
      <h4 className="text-white font-medium mb-2">
        {hasFilters ? 'No matches found' : 'No people yet'}
      </h4>
      <p className="text-gray-500 text-sm max-w-xs mx-auto">
        {hasFilters 
          ? 'Try adjusting your search or filters'
          : 'Be the first to join the community!'
        }
      </p>
    </div>
  )
}

function PersonCard({ person, currentUserId }: { person: PublicProfile; currentUserId: string | null }) {
  const showLocation = person.user_settings?.show_location_publicly !== false
  const router = useRouter()

  return (
    <button 
      onClick={() => router.push(`/user/${person.id}`)}
      className="w-full bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4 transition-all active:scale-[0.99] text-left"
    >
      <div className="flex items-center gap-3">
        {/* Avatar with Premium Effect */}
        <PremiumAvatar
          src={person.avatar_url}
          alt={person.full_name || ''}
          size="md"
          isPremium={person.is_premium}
          premiumType={person.premium_type}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium truncate">
              {person.full_name || 'Anonymous'}
            </h3>
            {person.is_premium && person.premium_type && (
              <Crown className={`w-4 h-4 flex-shrink-0 ${
                person.premium_type === 'super' ? 'text-amber-400' : 'text-blue-400'
              }`} />
            )}
          </div>
          
          {person.college_name && (
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <span className="text-gray-400 text-sm truncate">
                {person.college_name}
              </span>
            </div>
          )}
          
          {showLocation && (person.city || person.state) && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <span className="text-gray-500 text-xs truncate">
                {[person.city, person.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

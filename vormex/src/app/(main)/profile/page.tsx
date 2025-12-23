'use client'

import { createClient } from '@/lib/supabase/client'
import { getStates, getDistricts, getCities } from '@/data/locations'
import { useState, useEffect, useCallback } from 'react'
import { 
  Camera, 
  ChevronDown, 
  Save, 
  Loader2, 
  Calendar, 
  Shield,
  Building2,
  MapPin,
  AlertCircle,
  Check,
  Crown
} from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import PremiumAvatar, { PremiumSvgFilters } from '@/components/premium/PremiumAvatar'

interface ProfileData {
  full_name: string
  avatar_url: string | null
  college_name: string | null
  state: string
  district: string
  city: string
  created_at: string
  is_premium: boolean
  premium_type: 'basic' | 'super' | 'admin' | null
  premium_expires_at: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [collegeName, setCollegeName] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('')

  const supabase = createClient()

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, college_name, state, district, city, created_at, is_premium, premium_type, premium_expires_at')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const typedProfile: ProfileData = {
        full_name: profileData?.full_name || '',
        avatar_url: profileData?.avatar_url || null,
        college_name: profileData?.college_name || null,
        state: profileData?.state || '',
        district: profileData?.district || '',
        city: profileData?.city || '',
        created_at: profileData?.created_at || '',
        is_premium: profileData?.is_premium || false,
        premium_type: profileData?.premium_type as 'basic' | 'super' | 'admin' | null,
        premium_expires_at: profileData?.premium_expires_at || null
      }
      setProfile(typedProfile)
      
      // Set form values
      setFullName(typedProfile.full_name || '')
      setAvatarUrl(typedProfile.avatar_url)
      setCollegeName(typedProfile.college_name || '')
      setState(typedProfile.state || '')
      setDistrict(typedProfile.district || '')
      setCity(typedProfile.city || '')

    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setError(null)

      if (!e.target.files || e.target.files.length === 0) return

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const filePath = `${user.id}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
    } catch (err) {
      console.error(err)
      setError('Error uploading avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleStateChange = (newState: string) => {
    setState(newState)
    setDistrict('')
    setCity('')
  }

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict)
    setCity('')
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          avatar_url: avatarUrl,
          college_name: collegeName.trim() || null,
          state: state || null,
          district: district || null,
          city: city || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess(true)
      setIsEditing(false)
      loadProfile()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const states = getStates()
  const districts = state ? getDistricts(state) : []
  const cities = district ? getCities(state, district) : []

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
          <h1 className="text-xl font-bold text-white">Profile</h1>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium"
            >
              Edit
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-green-400 text-sm">Profile updated successfully</p>
          </div>
        )}

        {/* Premium SVG Filters */}
        <PremiumSvgFilters />

        {/* Avatar with Premium Effect */}
        <div className="flex flex-col items-center mb-8">
          <label className={`relative ${isEditing ? 'cursor-pointer' : ''}`}>
            {isEditing && (
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            )}
            <PremiumAvatar
              src={avatarUrl}
              alt={fullName || 'Profile'}
              size="xl"
              isPremium={profile?.is_premium || false}
              premiumType={profile?.premium_type}
            />
            {isEditing && (
              <div className="absolute bottom-0 right-0 w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center border-4 border-black z-10">
                {uploading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </div>
            )}
          </label>
          
          {/* Premium Badge */}
          {profile?.is_premium && profile.premium_type && (
            <div className={`mt-3 px-3 py-1 rounded-full flex items-center gap-1.5 ${
              profile.premium_type === 'super' 
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30' 
                : 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30'
            }`}>
              <Crown className={`w-4 h-4 ${
                profile.premium_type === 'super' ? 'text-amber-400' : 'text-blue-400'
              }`} />
              <span className={`text-sm font-medium ${
                profile.premium_type === 'super' ? 'text-amber-400' : 'text-blue-400'
              }`}>
                {profile.premium_type === 'super' ? 'Super Supporter' : 'Premium'}
              </span>
            </div>
          )}
        </div>

        {/* Editable Fields */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <p className="text-white font-medium">{profile?.full_name || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                College
                <span className="text-gray-600 text-xs">(Optional)</span>
              </div>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="Enter your college name"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <p className="text-white">{profile?.college_name || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </div>
            </label>
            {isEditing ? (
              <div className="space-y-3">
                <div className="relative">
                  <select
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select state</option>
                    {states.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    disabled={!state}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="">Select district</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!district}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="">Select city/town</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>
              </div>
            ) : (
              <p className="text-white">
                {[profile?.city, profile?.district, profile?.state].filter(Boolean).join(', ') || '-'}
              </p>
            )}
          </div>
        </div>

        {/* Read-only Fields */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-400">Account Info</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Member since</p>
                <p className="text-white text-sm">
                  {profile?.created_at 
                    ? format(new Date(profile.created_at), 'MMMM d, yyyy')
                    : '-'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Login provider</p>
                <p className="text-white text-sm">Google</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

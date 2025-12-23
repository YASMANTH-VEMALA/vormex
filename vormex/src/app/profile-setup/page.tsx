'use client'

import { createClient } from '@/lib/supabase/client'
import { getStates, getDistricts, getCities } from '@/data/locations'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, ChevronDown, Check, Loader2, User } from 'lucide-react'
import Image from 'next/image'

export default function ProfileSetupPage() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  
  // Form state
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [collegeName, setCollegeName] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const loadInitialData = useCallback(async () => {
    // Load user data if exists
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || user.user_metadata?.full_name || '')
        setAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null)
        setCollegeName(profile.college_name || '')
        setState(profile.state || '')
        setDistrict(profile.district || '')
        setCity(profile.city || '')
      }
    }
  }, [supabase])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setError(null)

      if (!e.target.files || e.target.files.length === 0) {
        return
      }

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const filePath = `${user.id}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
    } catch (err) {
      setError('Error uploading avatar')
      console.error(err)
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

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!fullName.trim() && !!avatarUrl
      case 2:
        // College is optional, always valid
        return true
      case 3:
        return !!state && !!district && !!city
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Starting profile save...')
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('User:', user?.id, 'Error:', userError)
      
      if (userError) throw userError
      if (!user) throw new Error('No user found')

      const profileData = {
        id: user.id,
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        college_name: collegeName.trim() || null,
        state,
        district,
        city,
        is_profile_complete: true,
        updated_at: new Date().toISOString(),
      }

      console.log('Saving profile with:', profileData)

      // Use upsert to insert or update
      const { data, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()

      console.log('Upsert result:', data, 'Error:', upsertError)

      if (upsertError) throw upsertError

      console.log('Profile saved successfully, redirecting...')
      
      // Small delay to ensure DB write is complete, then hard redirect
      await new Promise(resolve => setTimeout(resolve, 300))
      window.location.replace('/home')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 
        (typeof err === 'object' && err !== null && 'message' in err) ? String((err as {message: unknown}).message) : 
        'Failed to save profile'
      setError(errorMessage)
      console.error('Profile save error:', err)
    } finally {
      setLoading(false)
    }
  }

  const states = getStates()
  const districts = state ? getDistricts(state) : []
  const cities = district ? getCities(state, district) : []

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="safe-area-top" />
      
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Complete Profile</h1>
          <span className="text-sm text-gray-500">{step}/3</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Step 1: Avatar and Name */}
        {step === 1 && (
          <div className="animate-fade-in">
            <p className="text-gray-400 text-sm mb-8">
              Let&apos;s start with your photo and name
            </p>

            {/* Avatar upload */}
            <div className="flex justify-center mb-8">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="w-28 h-28 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-gray-700">
                  {avatarUrl ? (
                    <Image 
                      src={avatarUrl} 
                      alt="Avatar" 
                      width={112}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-500" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center border-4 border-black">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </div>
              </label>
            </div>

            {/* Name input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 2: College (Optional) */}
        {step === 2 && (
          <div className="animate-fade-in">
            <p className="text-gray-400 text-sm mb-8">
              Enter your college name (optional)
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                College Name
                <span className="text-gray-600 ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g., National Institute of Art and Technology"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-gray-600 text-xs mt-2">
                You can skip this step if you don&apos;t want to share your college
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="animate-fade-in">
            <p className="text-gray-400 text-sm mb-8">
              Where are you located?
            </p>

            <div className="space-y-4">
              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  State
                </label>
                <div className="relative">
                  <select
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Select state</option>
                    {states.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  District
                </label>
                <div className="relative">
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    disabled={!state}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  >
                    <option value="">Select district</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  City / Town
                </label>
                <div className="relative">
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!district}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  >
                    <option value="">Select city/town</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with buttons */}
      <div className="px-6 pb-6">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 bg-gray-800 text-white font-semibold py-4 rounded-xl transition-all active:scale-[0.98]"
            >
              Back
            </button>
          )}
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!validateStep(step)}
              className="flex-1 bg-indigo-500 text-white font-semibold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!validateStep(step) || loading}
              className="flex-1 bg-indigo-500 text-white font-semibold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Complete Setup
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="safe-area-bottom" />
    </div>
  )
}

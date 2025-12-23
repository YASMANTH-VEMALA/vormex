'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Eye, 
  MessageSquare, 
  MapPin,
  Loader2,
  AlertCircle,
  Shield
} from 'lucide-react'

interface UserSettings {
  show_in_people_list: boolean
  allow_direct_messages: boolean
  show_location_publicly: boolean
}

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const loadSettings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      
      setSettings({
        show_in_people_list: data.show_in_people_list,
        allow_direct_messages: data.allow_direct_messages,
        show_location_publicly: data.show_location_publicly
      })
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const updateSetting = async (key: keyof UserSettings, value: boolean) => {
    try {
      setSaving(key)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_settings')
        .update({ 
          [key]: value,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      setSettings(prev => prev ? { ...prev, [key]: value } : null)
    } catch (error) {
      console.error('Error updating setting:', error)
    } finally {
      setSaving(null)
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
          <h1 className="text-xl font-bold text-white">Privacy Settings</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Info Banner */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-medium text-sm mb-1">Your Privacy Matters</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Control who can see your profile and how others can interact with you. These settings are enforced across the entire platform.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : settings ? (
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl overflow-hidden divide-y divide-gray-800/50">
            <PrivacySetting
              icon={Eye}
              title="Profile Visibility"
              description="When enabled, your profile will appear in the People section where others can find and view your basic information."
              value={settings.show_in_people_list}
              onChange={(v) => updateSetting('show_in_people_list', v)}
              loading={saving === 'show_in_people_list'}
            />
            
            <PrivacySetting
              icon={MessageSquare}
              title="Direct Messages"
              description="Control whether other members can send you direct messages. Disabling this will prevent anyone from messaging you."
              value={settings.allow_direct_messages}
              onChange={(v) => updateSetting('allow_direct_messages', v)}
              loading={saving === 'allow_direct_messages'}
            />
            
            <PrivacySetting
              icon={MapPin}
              title="Location Display"
              description="Show your city and state on your profile. Hiding this will only show your name and college to others."
              value={settings.show_location_publicly}
              onChange={(v) => updateSetting('show_location_publicly', v)}
              loading={saving === 'show_location_publicly'}
            />
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            <p className="text-gray-400">Unable to load privacy settings</p>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-6 px-2">
          <p className="text-gray-500 text-xs leading-relaxed">
            Your privacy settings are immediately applied and enforced at the database level. 
            Even if someone tries to access your data through the API, these restrictions will still apply.
          </p>
        </div>
      </div>
    </div>
  )
}

interface PrivacySettingProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  value: boolean
  onChange: (value: boolean) => void
  loading?: boolean
}

function PrivacySetting({ 
  icon: Icon, 
  title, 
  description, 
  value, 
  onChange,
  loading 
}: PrivacySettingProps) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-white font-medium text-sm mb-1">{title}</h4>
            <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
          </div>
        </div>
        
        <button
          onClick={() => onChange(!value)}
          disabled={loading}
          className={`w-14 h-8 rounded-full transition-colors relative flex-shrink-0 mt-1 ${
            value ? 'bg-indigo-500' : 'bg-gray-700'
          } ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
          ) : (
            <span
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${
                value ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          )}
        </button>
      </div>
    </div>
  )
}

'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Settings, 
  Shield, 
  LogOut, 
  ChevronRight, 
  Eye, 
  MessageSquare, 
  MapPin,
  Loader2,
  AlertCircle,
  Info,
  UserX,
  HelpCircle,
  Crown,
  Download
} from 'lucide-react'
import { usePWAInstall } from '@/components/pwa/InstallPrompt'

interface UserSettings {
  show_in_people_list: boolean
  allow_direct_messages: boolean
  show_location_publicly: boolean
}

export default function MorePage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall()

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
      setSaving(true)
      
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
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      await supabase.auth.signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
      setSigningOut(false)
    }
  }

  const handleInstallApp = async () => {
    if (canInstall && !isIOS) {
      await install()
    } else {
      setShowInstallModal(true)
    }
  }

  // Don't show install option if already installed
  const showInstallOption = !isInstalled

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-white">More</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Settings Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Settings className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Settings</h2>
          </div>

          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl overflow-hidden divide-y divide-gray-800/50">
            {/* Premium Button */}
            <button
              onClick={() => router.push('/premium')}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-800/50 transition-colors bg-gradient-to-r from-yellow-500/10 to-amber-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-white font-medium">Get Premium</span>
                  <p className="text-yellow-500/80 text-xs">Priority support & special badge</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-yellow-500" />
            </button>

            <button
              onClick={() => router.push('/more/privacy')}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-white font-medium">Privacy Settings</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
            
            <button
              onClick={() => router.push('/more/blocked')}
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <UserX className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-white font-medium">Blocked Users</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Privacy Quick Settings */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Shield className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Privacy</h2>
          </div>

          {loading ? (
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : settings ? (
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl overflow-hidden divide-y divide-gray-800/50">
              <PrivacyToggle
                icon={Eye}
                label="Show profile in People"
                description="Others can find you in the People list"
                value={settings.show_in_people_list}
                onChange={(v) => updateSetting('show_in_people_list', v)}
                disabled={saving}
              />
              <PrivacyToggle
                icon={MessageSquare}
                label="Allow direct messages"
                description="Others can send you messages"
                value={settings.allow_direct_messages}
                onChange={(v) => updateSetting('allow_direct_messages', v)}
                disabled={saving}
              />
              <PrivacyToggle
                icon={MapPin}
                label="Show location publicly"
                description="Display your city and state on profile"
                value={settings.show_location_publicly}
                onChange={(v) => updateSetting('show_location_publicly', v)}
                disabled={saving}
              />
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <p className="text-gray-400 text-sm">Unable to load settings</p>
            </div>
          )}
        </div>

        {/* Support Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <HelpCircle className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Support</h2>
          </div>

          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl overflow-hidden divide-y divide-gray-800/50">
            {/* Install App Button - only show if not installed */}
            {showInstallOption && (
              <button
                onClick={handleInstallApp}
                className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-800/50 transition-colors bg-gradient-to-r from-green-500/10 to-emerald-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="text-white font-medium">Install App</span>
                    <p className="text-green-500/80 text-xs">Faster access & notifications</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-green-500" />
              </button>
            )}

            <button
              className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-white font-medium">Help & FAQ</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Info className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">About</h2>
          </div>

          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-white">V</span>
              </div>
              <div>
                <p className="text-white font-medium">Vormex</p>
                <p className="text-gray-500 text-xs">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Privacy-first community platform for NIAT students. Your data, your control.
            </p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full bg-red-500/10 border border-red-500/20 text-red-400 font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 active:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {signingOut ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <LogOut className="w-5 h-5" />
              Sign Out
            </>
          )}
        </button>
      </div>

      {/* Install Instructions Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-sm w-full p-6 border border-gray-800">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {isIOS ? 'Install on iPhone' : 'Install App'}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {isIOS 
                  ? "Safari doesn't support automatic install. Follow these steps:"
                  : "Follow these steps to install:"}
              </p>
              
              <div className="text-left space-y-3 mb-6">
                {isIOS ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">1</span>
                      <span className="text-gray-300 text-sm">Tap the <strong>Share</strong> button below</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">2</span>
                      <span className="text-gray-300 text-sm">Tap <strong>&quot;Add to Home Screen&quot;</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">3</span>
                      <span className="text-gray-300 text-sm">Tap <strong>&quot;Add&quot;</strong></span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">1</span>
                      <span className="text-gray-300 text-sm">Tap the <strong>menu</strong> (⋮) in your browser</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">2</span>
                      <span className="text-gray-300 text-sm">Select <strong>&quot;Install app&quot;</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">3</span>
                      <span className="text-gray-300 text-sm">Tap <strong>&quot;Install&quot;</strong></span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full bg-gray-800 text-white py-3 rounded-xl font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface PrivacyToggleProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

function PrivacyToggle({ 
  icon: Icon, 
  label, 
  description, 
  value, 
  onChange,
  disabled 
}: PrivacyToggleProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3 flex-1 mr-4">
        <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-medium text-sm">{label}</p>
          <p className="text-gray-500 text-xs mt-0.5">{description}</p>
        </div>
      </div>
      
      <button
        onClick={() => onChange(!value)}
        disabled={disabled}
        className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${
          value ? 'bg-indigo-500' : 'bg-gray-700'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

'use client'

import { createClient } from '@/lib/supabase/client'
import { Chrome } from 'lucide-react'
import { useState } from 'react'

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Status bar space */}
      <div className="safe-area-top" />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo and branding */}
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
            <span className="text-3xl font-bold text-white">V</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Vormex</h1>
          <p className="text-gray-400 text-sm">Connect with your community</p>
        </div>

        {/* Welcome message */}
        <div className="text-center mb-10">
          <h2 className="text-xl font-semibold text-white mb-2">Welcome</h2>
          <p className="text-gray-500 text-sm max-w-xs">
            Join the privacy-first community platform for NIAT students
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full max-w-sm mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Sign in button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full max-w-sm bg-white text-black font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Chrome className="w-5 h-5" />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Privacy notice */}
        <p className="text-gray-600 text-xs text-center mt-6 max-w-xs">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Bottom decoration */}
      <div className="h-32 bg-gradient-to-t from-indigo-950/20 to-transparent" />
      
      {/* Safe area bottom */}
      <div className="safe-area-bottom" />
    </div>
  )
}

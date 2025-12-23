'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Crown, 
  Star, 
  Sparkles, 
  Check, 
  Loader2,
  Shield,
  MessageCircle,
  Users,
  Zap,
  Lock
} from 'lucide-react'

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill: {
    name?: string
    email?: string
  }
  theme: {
    color: string
  }
  modal?: {
    ondismiss?: () => void
  }
}

interface RazorpayInstance {
  open: () => void
  close: () => void
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  is_premium: boolean
  premium_type: 'basic' | 'super' | 'admin' | null
  premium_expires_at: string | null
}

const plans = [
  {
    id: 'basic',
    name: 'Basic Premium',
    price: 100,
    duration: '50 days',
    variant: 'hue' as const,
    features: [
      'Bronze profile badge',
      'Highlighted in admin view',
      'Priority support from admin',
      'Special chat indicator',
      'Support the community'
    ]
  },
  {
    id: 'super',
    name: 'Super Supporter',
    price: 200,
    duration: '50 days',
    variant: 'original' as const,
    features: [
      'Gold crown badge',
      'Top priority in admin view',
      'Fastest admin response',
      'Premium chat badge',
      'Profile golden border',
      'Support the community'
    ]
  },
  {
    id: 'admin',
    name: 'Admin Premium',
    price: 499,
    duration: '50 days',
    variant: 'admin' as const,
    popular: true,
    features: [
      'Exclusive diamond badge',
      'VIP admin recognition',
      'Instant admin response',
      'Premium purple border',
      'Top of all lists',
      'Maximum community support'
    ]
  }
]

// SVG Filters Component for animated card effects
function SvgFilters() {
  return (
    <svg className="absolute w-0 h-0">
      <defs>
        {/* Original filter - orange glow with displacement */}
        <filter id="filter-original" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
          <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
            <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
          <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
            <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1b" seed="2" />
          <feOffset in="noise1b" dx="0" dy="0" result="offsetNoise3">
            <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2b" seed="2" />
          <feOffset in="noise2b" dx="0" dy="0" result="offsetNoise4">
            <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>
          <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
          <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
          <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
          <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="20" xChannelSelector="R" yChannelSelector="B" />
        </filter>
        {/* Hue filter - rainbow animated */}
        <filter id="filter-hue" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="7" />
          <feColorMatrix type="hueRotate" result="pt1">
            <animate attributeName="values" values="0;360;" dur=".6s" repeatCount="indefinite" calcMode="paced" />
          </feColorMatrix>
          <feComposite />
          <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="7" seed="5" />
          <feColorMatrix type="hueRotate" result="pt2">
            <animate attributeName="values" values="0; 333; 199; 286; 64; 168; 256; 157; 360;" dur="5s" repeatCount="indefinite" calcMode="paced" />
          </feColorMatrix>
          <feBlend in="pt1" in2="pt2" mode="normal" result="combinedNoise" />
          <feDisplacementMap in="SourceGraphic" scale="20" xChannelSelector="R" yChannelSelector="B" />
        </filter>
        {/* Admin filter - purple/pink premium glow */}
        <filter id="filter-admin" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="8" result="noise1" seed="3" />
          <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
            <animate attributeName="dy" values="500; 0" dur="4s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>
          <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="8" result="noise2" seed="3" />
          <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
            <animate attributeName="dy" values="0; -500" dur="4s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>
          <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="8" result="noise1b" seed="4" />
          <feOffset in="noise1b" dx="0" dy="0" result="offsetNoise3">
            <animate attributeName="dx" values="400; 0" dur="4s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>
          <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="8" result="noise2b" seed="4" />
          <feOffset in="noise2b" dx="0" dy="0" result="offsetNoise4">
            <animate attributeName="dx" values="0; -400" dur="4s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>
          <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
          <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
          <feBlend in="part1" in2="part2" mode="screen" result="combinedNoise" />
          <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="25" xChannelSelector="R" yChannelSelector="B" />
        </filter>
      </defs>
    </svg>
  )
}

// Premium Card Component with animated border
function PremiumCard({ 
  plan, 
  onPurchase, 
  processing,
  isPremiumActive
}: { 
  plan: typeof plans[0]
  onPurchase: (planId: string, amount: number) => void
  processing: string | null
  isPremiumActive: boolean
}) {
  const isOriginal = plan.variant === 'original'
  const isAdmin = plan.variant === 'admin'
  const borderColor = isAdmin ? '#a855f7' : isOriginal ? '#dd8448' : '#1e90ff'
  const filterUrl = isAdmin ? 'url(#filter-admin)' : isOriginal ? 'url(#filter-original)' : 'url(#filter-hue)'
  
  return (
    <div 
      className="relative p-[2px] rounded-3xl"
      style={{
        background: `linear-gradient(-30deg, ${borderColor}40, transparent, ${borderColor}40), linear-gradient(to bottom, #1a1a1a, #1a1a1a)`
      }}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold px-4 py-1 rounded-full shadow-lg">
          POPULAR
        </div>
      )}
      
      {/* Inner container with animated border */}
      <div className="relative">
        <div 
          className="rounded-3xl"
          style={{ 
            border: `2px solid ${borderColor}80`,
            padding: '0.15em'
          }}
        >
          <div 
            className="w-full rounded-3xl"
            style={{ 
              aspectRatio: '7 / 10',
              border: `2px solid ${borderColor}`,
              filter: filterUrl,
              marginTop: '-4px',
              marginLeft: '-4px',
              width: 'calc(100% + 4px)'
            }}
          />
        </div>
        
        {/* Glow layer 1 */}
        <div 
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{ 
            border: `2px solid ${borderColor}99`,
            filter: 'blur(1px)'
          }}
        />
        
        {/* Glow layer 2 */}
        <div 
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{ 
            border: `2px solid ${borderColor}`,
            filter: 'blur(4px)'
          }}
        />
      </div>
      
      {/* Overlay effects */}
      <div 
        className="absolute inset-0 rounded-3xl pointer-events-none mix-blend-overlay"
        style={{
          filter: 'blur(16px)',
          transform: 'scale(1.1)',
          background: 'linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)'
        }}
      />
      <div 
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-50 mix-blend-overlay"
        style={{
          filter: 'blur(16px)',
          transform: 'scale(1.1)',
          background: 'linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)'
        }}
      />
      
      {/* Background glow */}
      <div 
        className="absolute inset-0 rounded-3xl -z-10 opacity-30 pointer-events-none"
        style={{
          filter: 'blur(32px)',
          transform: 'scale(1.1)',
          background: `linear-gradient(-30deg, ${borderColor}, transparent, ${borderColor})`
        }}
      />
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col">
        {/* Top content */}
        <div className="flex flex-col h-full p-8 pb-4">
          {/* Duration tag */}
          <div 
            className="relative w-fit px-4 py-2 rounded-xl text-xs uppercase font-bold text-white/80"
            style={{
              background: 'radial-gradient(47.2% 50% at 50.39% 88.37%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.04)'
            }}
          >
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                padding: '1px',
                background: 'linear-gradient(150deg, rgba(255, 255, 255, 0.48) 16.73%, rgba(255, 255, 255, 0.08) 30.2%, rgba(255, 255, 255, 0.08) 68.2%, rgba(255, 255, 255, 0.6) 81.89%)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude'
              }}
            />
            {plan.duration}
          </div>
          
          {/* Plan name */}
          <p className="text-2xl font-medium text-white mt-auto">
            {plan.name}
          </p>
        </div>
        
        {/* Divider */}
        <div 
          className="h-px mx-8 bg-white"
          style={{
            opacity: 0.1,
            maskImage: 'linear-gradient(to right, transparent, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black, transparent)'
          }}
        />
        
        {/* Bottom content */}
        <div className="flex flex-col p-8 pt-4">
          {/* Price */}
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-bold text-white">₹{plan.price}</span>
          </div>
          
          {/* Features */}
          <div className="space-y-2 mb-6">
            {plan.features.slice(0, 4).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className={`w-4 h-4 flex-shrink-0 ${isAdmin ? 'text-purple-400' : isOriginal ? 'text-amber-400' : 'text-blue-400'}`} />
                <span className="text-white/70 text-sm">{feature}</span>
              </div>
            ))}
          </div>
          
          {/* CTA Button */}
          <button
            onClick={() => onPurchase(plan.id, plan.price)}
            disabled={processing !== null}
            className={`w-full py-4 rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isAdmin
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                : isOriginal
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-90'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:opacity-90'
            }`}
          >
            {processing === plan.id ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                {isPremiumActive ? 'Extend Premium' : `Get ${plan.name}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PremiumPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    }>
      <PremiumContent />
    </Suspense>
  )
}

function PremiumContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  
  // Get context from URL params
  const context = searchParams.get('context')

  const loadUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/auth')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, is_premium, premium_type, premium_expires_at')
      .eq('id', authUser.id)
      .single()

    if (profile) {
      setUser({
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        is_premium: profile.is_premium ?? false,
        premium_type: profile.premium_type as 'basic' | 'super' | 'admin' | null,
        premium_expires_at: profile.premium_expires_at,
        email: authUser.email || null
      })
    }
    setLoading(false)
  }, [supabase, router])

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setScriptLoaded(true)
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const handlePurchase = async (planId: string, amount: number) => {
    if (!user || !scriptLoaded) return

    setProcessing(planId)

    try {
      // Create order in our backend
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          plan_type: planId,
          user_id: user.id
        })
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Create subscription record in Supabase
      const { data: subscription, error: subError } = await supabase
        .from('premium_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: planId as 'basic' | 'super' | 'admin',
          amount,
          razorpay_order_id: orderData.order_id,
          status: 'pending' as const
        })
        .select()
        .single()

      if (subError) throw subError

      // Open Razorpay checkout
      const planNames: Record<string, string> = {
        basic: 'Basic Premium',
        super: 'Super Supporter',
        admin: 'Admin Premium'
      }
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Vormex Premium',
        description: `${planNames[planId] || 'Premium'} - 50 Days`,
        order_id: orderData.order_id,
        handler: async (response: RazorpayResponse) => {
          // Verify payment
          try {
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                subscription_id: subscription.id
              })
            })

            const verifyData = await verifyResponse.json()

            if (verifyResponse.ok && verifyData.success) {
              // Reload user data
              await loadUser()
              alert('Payment successful! Welcome to Premium!')
            } else {
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (error) {
            console.error('Verification error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            alert(`Payment verification failed: ${errorMessage}\n\nPlease contact support if money was deducted.`)
          }
          setProcessing(null)
        },
        prefill: {
          name: user.full_name || '',
          email: user.email || ''
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: () => {
            setProcessing(null)
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Error initiating payment:', error)
      alert('Failed to initiate payment. Please try again.')
      setProcessing(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  const isPremiumActive = user?.is_premium && user?.premium_expires_at && new Date(user.premium_expires_at) > new Date()

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 overflow-x-hidden">
      {/* SVG Filters for animated cards */}
      <SvgFilters />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h1 className="text-xl font-bold text-white">Premium</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative px-4 py-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent" />
        <div className="relative">
          <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Premium</h2>
          <p className="text-gray-400 max-w-sm mx-auto">
            Get priority access to admin support and stand out in the community
          </p>
        </div>
      </div>

      {/* Context Banner - Shown when redirected from messaging */}
      {context && (
        <div className="px-4 mb-6">
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            context === 'unlock_messaging' 
              ? 'bg-indigo-500/10 border-indigo-500/30'
              : context === 'view_message'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-purple-500/10 border-purple-500/30'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              context === 'unlock_messaging'
                ? 'bg-indigo-500/20'
                : context === 'view_message'
                  ? 'bg-amber-500/20'
                  : 'bg-purple-500/20'
            }`}>
              <Lock className={`w-5 h-5 ${
                context === 'unlock_messaging'
                  ? 'text-indigo-400'
                  : context === 'view_message'
                    ? 'text-amber-400'
                    : 'text-purple-400'
              }`} />
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${
                context === 'unlock_messaging'
                  ? 'text-indigo-400'
                  : context === 'view_message'
                    ? 'text-amber-400'
                    : 'text-purple-400'
              }`}>
                {context === 'unlock_messaging' && 'Unlock Messaging'}
                {context === 'view_message' && 'Unlock Hidden Messages'}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                {context === 'unlock_messaging' && 'Upgrade to premium to message any user in the community!'}
                {context === 'view_message' && 'You have unread messages! Upgrade to see who messaged you.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Status */}
      {isPremiumActive && (
        <div className="px-4 mb-6">
          <div className={`p-4 rounded-2xl border ${
            user?.premium_type === 'super' 
              ? 'bg-amber-500/10 border-amber-500/30' 
              : 'bg-blue-500/10 border-blue-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                user?.premium_type === 'super' 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-500'
              }`}>
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">
                  {user?.premium_type === 'super' ? 'Super Supporter' : 'Basic Premium'}
                </p>
                <p className="text-gray-400 text-sm">
                  {getDaysRemaining(user!.premium_expires_at!)} days remaining - Expires {formatDate(user!.premium_expires_at!)}
                </p>
              </div>
              <Sparkles className={`w-6 h-6 ${
                user?.premium_type === 'super' ? 'text-amber-500' : 'text-blue-500'
              }`} />
            </div>
          </div>
        </div>
      )}

      {/* Benefits Overview */}
      <div className="px-4 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Premium Benefits</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-white font-medium text-sm">Priority Support</p>
            <p className="text-gray-500 text-xs mt-1">Get faster responses from admin</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mb-3">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-white font-medium text-sm">Special Badge</p>
            <p className="text-gray-500 text-xs mt-1">Stand out in the community</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mb-3">
              <MessageCircle className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-white font-medium text-sm">Chat Badge</p>
            <p className="text-gray-500 text-xs mt-1">Premium indicator in chats</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
            <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-pink-400" />
            </div>
            <p className="text-white font-medium text-sm">Highlighted</p>
            <p className="text-gray-500 text-xs mt-1">Visible to admin instantly</p>
          </div>
        </div>
      </div>

      {/* Premium Cards */}
      <div className="px-4">
        <h3 className="text-lg font-semibold text-white mb-6">Choose Your Plan</h3>
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.id} className="w-full max-w-[320px]">
              <PremiumCard
                plan={plan}
                onPurchase={handlePurchase}
                processing={processing}
                isPremiumActive={isPremiumActive || false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 mt-12">
        <h3 className="text-lg font-semibold text-white mb-4">FAQ</h3>
        <div className="space-y-3">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
            <p className="text-white font-medium text-sm">What happens after 50 days?</p>
            <p className="text-gray-400 text-xs mt-1">
              Your premium badge will expire, but you can always renew to continue enjoying benefits.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
            <p className="text-white font-medium text-sm">Is the payment secure?</p>
            <p className="text-gray-400 text-xs mt-1">
              Yes! We use Razorpay, India&apos;s most trusted payment gateway with bank-level security.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
            <p className="text-white font-medium text-sm">Can I upgrade my plan?</p>
            <p className="text-gray-400 text-xs mt-1">
              Yes! You can upgrade from Basic to Super Supporter anytime. The new plan duration will be added.
            </p>
          </div>
        </div>
      </div>

      {/* Support Note */}
      <div className="px-4 mt-8 mb-8">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-center">
          <p className="text-indigo-400 text-sm">
            Your support helps us maintain and improve Vormex for everyone!
          </p>
        </div>
      </div>
    </div>
  )
}
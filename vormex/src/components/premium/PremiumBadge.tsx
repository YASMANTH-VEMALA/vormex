'use client'

import { Crown } from 'lucide-react'

interface PremiumBadgeProps {
  type: 'basic' | 'super' | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function PremiumBadge({ type, size = 'sm', showLabel = false, className = '' }: PremiumBadgeProps) {
  if (!type) return null

  const sizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  }

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  if (type === 'super') {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <div 
          className={`${sizeClasses[size]} bg-gradient-to-br from-yellow-500 to-amber-500 rounded-full flex items-center justify-center shadow-sm shadow-yellow-500/30`}
          title="Super Supporter"
        >
          <Crown className={`${iconSizes[size]} text-white`} />
        </div>
        {showLabel && (
          <span className="text-yellow-500 font-medium text-xs">Super</span>
        )}
      </div>
    )
  }

  // Basic Premium
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div 
        className={`${sizeClasses[size]} bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center`}
        title="Basic Premium"
      >
        <span className="text-white">🥉</span>
      </div>
      {showLabel && (
        <span className="text-amber-500 font-medium text-xs">Premium</span>
      )}
    </div>
  )
}

// Profile border component for premium users
export function PremiumProfileBorder({ type, children, className = '' }: { 
  type: 'basic' | 'super' | null
  children: React.ReactNode
  className?: string
}) {
  if (!type) {
    return <div className={className}>{children}</div>
  }

  if (type === 'super') {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 p-[2px]">
          <div className="w-full h-full rounded-full bg-black" />
        </div>
        <div className="relative">{children}</div>
      </div>
    )
  }

  // Basic Premium
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 p-[2px]">
        <div className="w-full h-full rounded-full bg-black" />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

// Chat message badge
export function PremiumChatBadge({ type }: { type: 'basic' | 'super' | null }) {
  if (!type) return null

  if (type === 'super') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/20 rounded-full ml-1">
        <Crown className="w-3 h-3 text-yellow-500" />
        <span className="text-yellow-500 text-[10px] font-medium">VIP</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/20 rounded-full ml-1">
      <span className="text-[10px]">🥉</span>
      <span className="text-amber-500 text-[10px] font-medium">PRO</span>
    </span>
  )
}

'use client'

import Image from 'next/image'
import { User } from 'lucide-react'

// SVG Filters for animated premium border effects
export function PremiumSvgFilters() {
  return (
    <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
      <defs>
        {/* Original filter - orange glow for Super Supporter (₹200) */}
        <filter id="premium-filter-super" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
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
          <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="8" xChannelSelector="R" yChannelSelector="B" />
        </filter>
        {/* Hue filter - rainbow animated for Basic Premium (₹100) */}
        <filter id="premium-filter-basic" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
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
          <feDisplacementMap in="SourceGraphic" scale="8" xChannelSelector="R" yChannelSelector="B" />
        </filter>
        {/* Admin filter - purple/pink glow for Admin Premium (₹500) */}
        <filter id="premium-filter-admin" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
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
          <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="10" xChannelSelector="R" yChannelSelector="B" />
        </filter>
      </defs>
    </svg>
  )
}

interface PremiumAvatarProps {
  src: string | null
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isPremium?: boolean
  premiumType?: 'basic' | 'super' | 'admin' | null
  className?: string
  fallbackClassName?: string
}

const sizeMap = {
  xs: { container: 32, border: 3, gap: 2 },
  sm: { container: 40, border: 3, gap: 2 },
  md: { container: 48, border: 3, gap: 3 },
  lg: { container: 64, border: 4, gap: 3 },
  xl: { container: 96, border: 5, gap: 4 },
}

export default function PremiumAvatar({
  src,
  alt = '',
  size = 'md',
  isPremium = false,
  premiumType = null,
  className = '',
  fallbackClassName = ''
}: PremiumAvatarProps) {
  const dimensions = sizeMap[size]
  const isSuper = premiumType === 'super'
  const isBasic = premiumType === 'basic'
  const isAdmin = premiumType === 'admin'
  const hasPremiumEffect = isPremium && (isSuper || isBasic || isAdmin)
  
  const borderColor = isAdmin ? '#a855f7' : isSuper ? '#dd8448' : '#1e90ff'
  const filterUrl = isAdmin ? 'url(#premium-filter-admin)' : isSuper ? 'url(#premium-filter-super)' : 'url(#premium-filter-basic)'
  
  // Total size including animated border
  const totalSize = hasPremiumEffect 
    ? dimensions.container + (dimensions.border * 2) + (dimensions.gap * 2) 
    : dimensions.container
  
  // Non-premium avatar
  if (!hasPremiumEffect) {
    return (
      <div 
        className={`relative rounded-full overflow-hidden bg-gray-800 flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: dimensions.container, height: dimensions.container }}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={dimensions.container}
            height={dimensions.container}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={`text-gray-500 ${fallbackClassName}`} style={{ width: dimensions.container * 0.4, height: dimensions.container * 0.4 }} />
        )}
      </div>
    )
  }
  
  // Premium avatar with animated circle border
  return (
    <div 
      className={`relative flex-shrink-0 ${className}`}
      style={{ 
        width: totalSize, 
        height: totalSize 
      }}
    >
      {/* Animated border ring with SVG filter */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          border: `${dimensions.border}px solid ${borderColor}`,
          filter: filterUrl,
        }}
      />
      
      {/* Glow layer 1 - subtle */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ 
          border: `${dimensions.border}px solid ${borderColor}99`,
          filter: 'blur(2px)'
        }}
      />
      
      {/* Glow layer 2 - more blur */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ 
          border: `${dimensions.border}px solid ${borderColor}`,
          filter: 'blur(4px)'
        }}
      />
      
      {/* Background glow effect */}
      <div 
        className="absolute inset-0 rounded-full -z-10 opacity-50 pointer-events-none"
        style={{
          filter: 'blur(8px)',
          transform: 'scale(1.15)',
          background: `radial-gradient(circle, ${borderColor} 0%, transparent 70%)`
        }}
      />
      
      {/* Avatar container - centered inside the border */}
      <div 
        className="absolute rounded-full overflow-hidden bg-gray-800 flex items-center justify-center"
        style={{ 
          top: dimensions.border + dimensions.gap,
          left: dimensions.border + dimensions.gap,
          width: dimensions.container,
          height: dimensions.container
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={dimensions.container}
            height={dimensions.container}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={`text-gray-500 ${fallbackClassName}`} style={{ width: dimensions.container * 0.4, height: dimensions.container * 0.4 }} />
        )}
      </div>
    </div>
  )
}

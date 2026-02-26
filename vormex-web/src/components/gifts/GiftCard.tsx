'use client';

import { motion } from 'framer-motion';

export type GiftVariant = 'original' | 'hue';

const variantConfig: Record<GiftVariant, { label: string; title: string; description: string }> = {
  original: {
    label: 'Profile Frame',
    title: 'Amber',
    description: 'Warm amber glow around your avatar.',
  },
  hue: {
    label: 'Profile Frame',
    title: 'Vibrant',
    description: 'Blue-to-purple gradient around your avatar.',
  },
};

interface GiftCardProps {
  variant: GiftVariant;
  onClick?: () => void;
  isSelectable?: boolean;
  selected?: boolean;
  /** Show as compact circle (for modals) instead of full card */
  compact?: boolean;
}

export function GiftCard({ variant, onClick, isSelectable, selected, compact }: GiftCardProps) {
  const config = variantConfig[variant];

  if (compact) {
    return (
      <motion.div
        className="gift-card-circle"
        data-variant={variant}
        onClick={isSelectable ? onClick : undefined}
        whileHover={isSelectable ? { scale: 1.05 } : undefined}
        whileTap={isSelectable ? { scale: 0.95 } : undefined}
        style={{
          cursor: isSelectable ? 'pointer' : 'default',
          outline: selected ? '3px solid var(--gift-electric-border-color)' : undefined,
          outlineOffset: 2,
        }}
      >
        <div className="gift-card-circle-inner" />
        <span className="gift-card-circle-label">{config.title}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="gift-card-container"
      data-variant={variant}
      onClick={isSelectable ? onClick : undefined}
      whileHover={isSelectable ? { scale: 1.02 } : undefined}
      whileTap={isSelectable ? { scale: 0.98 } : undefined}
      style={{
        cursor: isSelectable ? 'pointer' : 'default',
        outline: selected ? '3px solid var(--gift-electric-border-color)' : undefined,
        outlineOffset: 2,
      }}
    >
      <div className="gift-inner-container">
        <div className="gift-border-outer">
          <div className={`gift-main-card gift-main-card-${variant}`} />
        </div>
        <div className="gift-glow-layer-1" />
        <div className="gift-glow-layer-2" />
      </div>
      <div className="gift-overlay-1" />
      <div className="gift-overlay-2" />
      <div className="gift-background-glow" />
      <div className="gift-content-container">
        <div className="gift-content-top">
          <div className="gift-scrollbar-glass">{config.label}</div>
          <p className="gift-title">{config.title}</p>
        </div>
        <hr className="gift-divider" />
        <div className="gift-content-bottom">
          <p className="gift-description">{config.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

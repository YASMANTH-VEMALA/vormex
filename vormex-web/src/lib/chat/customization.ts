export const DEFAULT_CHAT_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

export const REACTION_PACK_EMOJIS: Record<string, string[]> = {
  'chat-reaction-startup-vibes': ['🚀', '💡', '🔥', '🙌', '⚡', '📈'],
  'chat-reaction-desi-memes': ['🤣', '😎', '🫡', '🤌', '💃', '😏'],
  'chat-reaction-finance-bros': ['💸', '🤑', '📉', '💰', '🏦', '🤝'],
};

export const WALLPAPER_PACK_REQUIREMENTS: Record<string, string> = {
  'gradient-2': 'chat-theme-vibrant-dms',
  'gradient-5': 'chat-theme-vibrant-dms',
  'pattern-1': 'chat-theme-vibrant-dms',
  'gradient-4': 'chat-theme-dark-variants',
  'gradient-6': 'chat-theme-dark-variants',
  'pattern-2': 'chat-theme-dark-variants',
};

export interface MessageEffectEntitlements {
  confetti: boolean;
  fireworks: boolean;
  voiceSfx: boolean;
}

export interface ChatCustomizationEntitlements {
  ownedItemSlugs: string[];
  ownedThemePacks: string[];
  availableReactions: string[];
  animatedBubbles: boolean;
  messageEffects: MessageEffectEntitlements;
}

export const DEFAULT_CHAT_CUSTOMIZATION_ENTITLEMENTS: ChatCustomizationEntitlements = {
  ownedItemSlugs: [],
  ownedThemePacks: [],
  availableReactions: DEFAULT_CHAT_REACTIONS,
  animatedBubbles: false,
  messageEffects: {
    confetti: false,
    fireworks: false,
    voiceSfx: false,
  },
};

export function buildChatCustomizationEntitlements(
  ownedItemSlugs: string[]
): ChatCustomizationEntitlements {
  const ownedSet = new Set(ownedItemSlugs);

  const availableReactions = new Set(DEFAULT_CHAT_REACTIONS);
  for (const [packSlug, emojis] of Object.entries(REACTION_PACK_EMOJIS)) {
    if (ownedSet.has(packSlug)) {
      for (const emoji of emojis) {
        availableReactions.add(emoji);
      }
    }
  }

  const ownedThemePacks = [
    'chat-theme-vibrant-dms',
    'chat-theme-dark-variants',
    'chat-theme-animated-bubbles',
  ].filter((slug) => ownedSet.has(slug));

  return {
    ownedItemSlugs: ownedItemSlugs,
    ownedThemePacks,
    availableReactions: Array.from(availableReactions),
    animatedBubbles: ownedSet.has('chat-theme-animated-bubbles'),
    messageEffects: {
      confetti: ownedSet.has('chat-effect-confetti'),
      fireworks: ownedSet.has('chat-effect-fireworks'),
      voiceSfx: ownedSet.has('chat-effect-voice-sfx'),
    },
  };
}

export function isWallpaperUnlocked(
  wallpaperId: string,
  ownedThemePacks: string[]
): boolean {
  const requiredPack = WALLPAPER_PACK_REQUIREMENTS[wallpaperId];
  if (!requiredPack) {
    return true;
  }

  return ownedThemePacks.includes(requiredPack);
}

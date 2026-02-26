export type FeedTheme = 'default' | 'grid';

const STORAGE_KEY = 'vormex_feed_theme';

export function getFeedTheme(): FeedTheme {
  if (typeof window === 'undefined') return 'default';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'grid') return 'grid';
  return 'default';
}

export function setFeedTheme(theme: FeedTheme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, theme);
}

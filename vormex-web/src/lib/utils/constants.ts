function normalizeApiUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function resolveApiUrl(): string {
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicApiUrl) {
    return normalizeApiUrl(publicApiUrl);
  }

  const publicBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (publicBackendUrl) {
    return normalizeApiUrl(publicBackendUrl);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing NEXT_PUBLIC_API_URL (or NEXT_PUBLIC_BACKEND_URL) in production');
  }

  // Development: use relative /api so requests go through Next.js proxy (avoids CORS, Network Error)
  // Remove NEXT_PUBLIC_API_URL from .env.local to use this. Proxy forwards to localhost:5000.
  return '/api';
}

export const API_URL = resolveApiUrl();
export const BACKEND_ORIGIN = API_URL.replace(/\/api$/, '');
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';


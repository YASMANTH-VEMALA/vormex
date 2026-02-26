export interface User {
  id: string; // UUID string from backend
  email: string;
  username: string;
  name: string;
  college?: string | null;
  branch?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  graduationYear?: number | null;
  isVerified: boolean;
  authProvider?: 'email' | 'google';
  profileRing?: string | null; // "original" | "hue" - animated ring from welcome gift
  hasClaimedWelcomeGift?: boolean;
  onboardingCompleted?: boolean;
  coinsBalance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  college?: string;
  branch?: string;
}

export interface ApiError {
  error: string;
  requiresVerification?: boolean;
}


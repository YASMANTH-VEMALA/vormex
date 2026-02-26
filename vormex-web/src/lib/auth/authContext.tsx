'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api/auth';
import { setToken, removeToken, getToken, getPendingUser } from './authHelpers';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';
import { handleApiError } from '@/lib/utils/errorHandler';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<AuthResponse>;
  setAuth: (response: AuthResponse) => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = Cookies.get('authToken') || getToken();
        if (storedToken) {
          setTokenState(storedToken);
          const pendingUser = getPendingUser();
          if (pendingUser) {
            setUser(pendingUser as any);
            setLoading(false);
            return;
          }
          try {
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
            if (userData.onboardingCompleted) {
              Cookies.set('onboardingCompleted', 'true', { expires: 7 });
            }
          } catch (error: any) {
            const status = error.response?.status;
            if (status === 401 || status === 404 || status === 403) {
              Cookies.remove('authToken');
              removeToken();
              setTokenState(null);
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      const response = await authAPI.login(credentials);
      
      // Store token in both cookie and localStorage
      Cookies.set('authToken', response.token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      setToken(response.token);
      
      // Track onboarding status in cookie for middleware
      if (response.user.onboardingCompleted) {
        Cookies.set('onboardingCompleted', 'true', { expires: 7 });
      } else {
        Cookies.remove('onboardingCompleted');
      }
      
      setUser(response.user);
      setTokenState(response.token);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await authAPI.register(data);
      
      // Store token in both cookie and localStorage
      Cookies.set('authToken', response.token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      setToken(response.token);
      
      setUser(response.user);
      setTokenState(response.token);
      
      return response;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }, []);

  const logout = useCallback(() => {
    Cookies.remove('authToken');
    Cookies.remove('onboardingCompleted');
    removeToken();
    setUser(null);
    setTokenState(null);
  }, []);

  const setAuth = useCallback((response: AuthResponse) => {
    // Store token in both cookie and localStorage
    Cookies.set('authToken', response.token, {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    setToken(response.token);
    
    if (response.user.onboardingCompleted) {
      Cookies.set('onboardingCompleted', 'true', { expires: 7 });
    } else {
      Cookies.remove('onboardingCompleted');
    }
    
    setUser(response.user);
    setTokenState(response.token);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    if (updatedUser.onboardingCompleted) {
      Cookies.set('onboardingCompleted', 'true', { expires: 7 });
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user, // Authenticated only when both token and user exist
    login,
    logout,
    register,
    setAuth,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}


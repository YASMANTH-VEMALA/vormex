import { useAuthContext } from './authContext';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

export function useAuth() {
  const context = useAuthContext();
  
  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    loading: context.loading,
    login: context.login,
    logout: context.logout,
    register: context.register,
    setAuth: context.setAuth,
    updateUser: context.updateUser,
  };
}


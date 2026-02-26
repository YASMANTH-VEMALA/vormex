import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/utils/constants';
import { getToken, removeToken } from '@/lib/auth/authHelpers';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from cookies (for backward compatibility) or localStorage
    if (typeof window !== 'undefined') {
      const token = Cookies.get('authToken') || getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Remove Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    // Return response data directly
    return response.data;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    
    // Handle 401 Unauthorized or 404 on auth/me (user not found after db reset)
    if (status === 401 || (status === 404 && url.includes('/auth/me'))) {
      // Remove token from both cookies and localStorage
      if (typeof window !== 'undefined') {
        Cookies.remove('authToken');
        removeToken();
        // Only redirect if not already on login page and not during auth request
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath === '/login';
        const isAuthRequest = url.includes('/auth/login') || 
                            url.includes('/auth/register');
        
        if (!isAuthPage && !isAuthRequest) {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle 403 Forbidden (email not verified)
    if (status === 403) {
      // Let the component handle this error
    }
    
    // Return rejected promise with error
    return Promise.reject(error);
  }
);

export default apiClient;


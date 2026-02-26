'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestNotificationToken, onForegroundMessage } from '@/lib/firebase';
import apiClient from '@/lib/api/client';

interface PushNotificationState {
  isSupported: boolean;
  isPermissionGranted: boolean;
  isTokenRegistered: boolean;
  isLoading: boolean;
}

/**
 * usePushNotifications — manages web push notification lifecycle
 * 1. Checks browser support
 * 2. Requests permission
 * 3. Gets FCM token
 * 4. Registers token with backend via POST /api/devices/register
 * 5. Listens for foreground messages
 */
export function usePushNotifications(userId: string | undefined) {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isPermissionGranted: false,
    isTokenRegistered: false,
    isLoading: false,
  });
  const [foregroundNotification, setForegroundNotification] = useState<any>(null);
  const registeredRef = useRef(false);
  const tokenRef = useRef<string | null>(null);

  // Check support on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    const granted = supported && Notification.permission === 'granted';

    setState(prev => ({
      ...prev,
      isSupported: supported,
      isPermissionGranted: granted,
    }));

    // If already granted + user logged in, register silently
    if (granted && userId && !registeredRef.current) {
      registerToken();
    }
  }, [userId]);

  // Listen for foreground messages
  useEffect(() => {
    if (!state.isPermissionGranted) return;

    const unsubscribe = onForegroundMessage((payload) => {
      setForegroundNotification(payload);

      // Auto-dismiss after 5s
      setTimeout(() => setForegroundNotification(null), 5000);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [state.isPermissionGranted]);

  const registerToken = useCallback(async () => {
    if (registeredRef.current || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const token = await requestNotificationToken();
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Register with backend
      await apiClient.post('/devices/register', {
        token,
        platform: 'web',
        deviceId: `web-${navigator.userAgent.slice(0, 50)}`,
      });

      registeredRef.current = true;
      tokenRef.current = token;
      setState(prev => ({
        ...prev,
        isPermissionGranted: true,
        isTokenRegistered: true,
        isLoading: false,
      }));

      // Store in localStorage to avoid re-registering
      localStorage.setItem('push_token_registered', 'true');
    } catch (err) {
      console.error('Push notification registration failed:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isLoading]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setState(prev => ({ ...prev, isPermissionGranted: true }));
        await registerToken();
        setState(prev => ({ ...prev, isLoading: false }));
        return registeredRef.current;
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.isSupported, registerToken]);

  const dismissNotification = useCallback(() => {
    setForegroundNotification(null);
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    return requestPermission();
  }, [requestPermission]);

  const unsubscribe = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    try {
      await apiClient.delete('/devices/unregister', { data: { token } });
      registeredRef.current = false;
      tokenRef.current = null;
      localStorage.removeItem('push_token_registered');
      setState(prev => ({
        ...prev,
        isTokenRegistered: false,
        isPermissionGranted: false,
      }));
    } catch (err) {
      console.error('Push notification unregister failed:', err);
    }
  }, []);

  return {
    ...state,
    isSubscribed: state.isTokenRegistered,
    foregroundNotification,
    requestPermission,
    dismissNotification,
    subscribe,
    unsubscribe,
  };
}

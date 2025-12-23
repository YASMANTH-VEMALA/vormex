'use client';

// Notification service for browser push notifications

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: {
    url?: string;
    groupId?: string;
    messageId?: string;
  };
}

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  // Get current permission status
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      // Store permission status in localStorage
      localStorage.setItem('notification_permission', permission);
      
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // Show a notification
  async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.isSupported()) return;
    
    if (this.getPermission() !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      // Check if service worker is available for better notifications
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192.png',
          badge: '/icon-192.png',
          tag: options.tag,
          data: options.data,
          vibrate: [200, 100, 200],
          requireInteraction: false,
        } as any);
      } else {
        // Fallback to basic notification
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192.png',
          tag: options.tag,
          data: options.data,
        });

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          if (options.data?.url) {
            window.location.href = options.data.url;
          }
          notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Show group message notification
  async showGroupMessageNotification(
    groupName: string,
    senderName: string,
    messagePreview: string,
    groupId: string
  ): Promise<void> {
    await this.showNotification({
      title: `New message in ${groupName}`,
      body: `${senderName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
      tag: `group-${groupId}`,
      data: {
        url: `/groups/${groupId}`,
        groupId,
      },
    });
  }

  // Show DM notification
  async showDMNotification(
    senderName: string,
    messagePreview: string,
    senderId: string
  ): Promise<void> {
    await this.showNotification({
      title: `Message from ${senderName}`,
      body: messagePreview.substring(0, 50) + (messagePreview.length > 50 ? '...' : ''),
      tag: `dm-${senderId}`,
      data: {
        url: `/messages?chat=${senderId}`,
      },
    });
  }
}

export const notificationService = NotificationService.getInstance();

// Hook for requesting notification permission with UI feedback
import { useCallback, useState, useEffect } from 'react';

export const useNotificationPermission = () => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const permission = await notificationService.requestPermission();
    setPermissionState(permission);
    return permission === 'granted';
  }, []);

  const hasPermission = permissionState === 'granted';

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  return { requestPermission, hasPermission, isSupported };
};

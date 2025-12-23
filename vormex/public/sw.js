// Service Worker for Push Notifications
// This file should be placed in /public folder

const CACHE_NAME = 'vormex-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/groups';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push events (for future FCM integration)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'You have a new message',
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      data: {
        url: data.url || '/groups',
      },
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Vormex', options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Handle notification action clicks
self.addEventListener('notificationclick', (event) => {
  const action = event.action;

  if (action === 'dismiss') {
    event.notification.close();
    return;
  }

  // Default action or 'view' action
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/groups';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          return client.navigate(urlToOpen);
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

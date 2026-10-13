// Service Worker for Pro Placement - 3LLION Ventures
// Handles Phone Streak Retention Notifications & Offline Caching

const CACHE_NAME = 'pro-placement-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'Pro Placement — Streak Reminder',
      body: event.data ? event.data.text() : 'Keep your practice streak alive!'
    };
  }

  const title = data.title || '🔥 Streak Freeze Warning — Pro Placement';
  const options = {
    body: data.body || 'You have less than 8 hours left to practice today and protect your active streak!',
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    tag: data.tag || 'streak-alert-tag',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 300],
    data: {
      url: data.url || '/?tab=dsa'
    },
    actions: [
      { action: 'practice', title: '⚡ Practice Now' },
      { action: 'arcade', title: '🎮 Play Byte Runner' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification interaction (clicking the notification on phone lock screen or notification shade)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let targetUrl = '/';
  if (event.action === 'arcade') {
    targetUrl = '/?tab=game';
  } else if (event.action === 'practice') {
    targetUrl = '/?tab=dsa';
  } else if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_STREAK_NOTIFICATION') {
    const { title, body, tag, url } = event.data;
    self.registration.showNotification(title || '🔥 Streak Freeze Warning', {
      body: body || 'Less than 8 hours remaining! Open Pro Placement to keep your streak alive.',
      icon: '/pwa-192x192.png',
      badge: '/icon.svg',
      tag: tag || 'streak-retention-reminder',
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 300],
      data: { url: url || '/?tab=contents' },
      actions: [
        { action: 'practice', title: '⚡ Practice Now' },
        { action: 'arcade', title: '🎮 Byte Runner' }
      ]
    });
  }
});

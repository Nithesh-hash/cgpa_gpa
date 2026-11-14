const CACHE_NAME = 'vgrade-cache-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Cache addAll non-fatal warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      }),
    ])
  );
});

// Notification click listener: focuses open window or opens app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Keep track of active scheduled reminder timers in service worker
const activeReminderTimers = new Map();

// Support showing notification directly from service worker via postMessage
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } else if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, options, delayMs } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title, options);
    }, delayMs || 0);
  } else if (event.data.type === 'SYNC_SCHEDULED_REMINDERS') {
    // Clear old timers
    activeReminderTimers.forEach((timerId) => clearTimeout(timerId));
    activeReminderTimers.clear();

    const reminders = event.data.reminders || [];
    reminders.forEach((rem) => {
      if (rem.delayMs && rem.delayMs > 0) {
        const timerId = setTimeout(() => {
          self.registration.showNotification(rem.title || 'VGrade Daily Reminder', {
            body: rem.body,
            icon: '/icon-192.png',
            badge: '/favicon.png',
            tag: `vgrade-rem-${rem.id}`,
            renotify: true,
            vibrate: [200, 100, 200],
            data: { url: '/', timestamp: Date.now() },
          });
        }, rem.delayMs);
        activeReminderTimers.set(rem.id, timerId);
      }
    });
  }
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and exclude Chrome extensions or third-party resources if needed
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background (stale-while-revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => { /* ignore network error */ });
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Handle network errors
      });
    })
  );
});

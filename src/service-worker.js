// Service Worker für Wetter-App
// Ermöglicht Offline-Funktionalität, Caching und Push-Notifications

const CACHE_NAME = 'wetter-app-v1';
const urlsToCache = [
  '/',
  '/src/index.html',
  '/src/style.css',
  '/src/app.js',
  '/src/utils/constants.js',
  '/src/utils/cache.js',
  '/src/utils/validation.js',
  '/src/api/weather.js',
  '/src/api/brightsky.js',
  '/src/ui/errorHandler.js',
  '/src/ui/searchInput.js',
  '/src/ui/weatherDisplay.js',
  '/manifest.json'
];

// Installation
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching app shell');
      return cache.addAll(urlsToCache);
    }).catch(err => {
      // Wenn ein einzelner Fetch in addAll fehlschlägt, logge und install trotzdem abschließen
      console.warn('Service Worker: cache.addAll failed (continuing):', err);
      return Promise.resolve();
    })
  );

  // Skip waiting - aktiviere sofort
  self.skipWaiting();
});

// Aktivierung
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Claim clients sofort
  self.clients.claim();
});

// Fetch - Network First, dann Cache
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignoriere API-Requests (werden separat behandelt)
  if (request.url.includes('api.open-meteo.com') ||
      request.url.includes('api.brightsky.dev') ||
      request.url.includes('nominatim.openstreetmap.org') ||
      request.url.includes('geocoding-api.open-meteo.com')) {
    return;
  }

  // Network First Strategy für App
  event.respondWith(
    fetch(request)
      .then(response => {
        // Speichere neue Responses im Cache
        if (response && response.status === 200 && response.type !== 'error') {
              const responseClone = response.clone();
              // Cache only http(s) requests and avoid unsupported schemes (e.g., chrome-extension://)
              try {
                const reqUrl = new URL(request.url);
                if ((reqUrl.protocol === 'http:' || reqUrl.protocol === 'https:')) {
                  // Optionally only cache same-origin app shell assets
                  if (reqUrl.origin === self.location.origin) {
                    caches.open(CACHE_NAME).then(cache => {
                      try {
                        // Use the parsed absolute href to avoid passing unsupported Request objects
                        cache.put(reqUrl.href, responseClone).catch(err => {
                          console.warn('Service Worker: cache.put failed', err, reqUrl.href);
                        });
                      } catch (e) {
                        console.warn('Service Worker: cache.put wrapper failed', e, request.url);
                      }
                    });
                  }
                }
              } catch (err) {
                // If URL parsing or cache put fails, ignore to avoid breaking fetch
                console.warn('Service Worker: skipping cache for', request.url, err);
              }
        }
        return response;
      })
      .catch(error => {
        // Fallback auf Cache wenn Netzwerk fehlt
        console.log('Service Worker: Network request failed, trying cache', request.url);
        return caches.match(request).then(response => {
          return response || new Response(
            'Offline - Diese Seite ist im Offline-Modus nicht verfügbar',
            { status: 503, statusText: 'Service Unavailable' }
          );
        });
      })
  );
});

// Background Sync für Weather Updates
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'weather-update') {
    event.waitUntil(
      updateWeatherData()
    );
  }
});

/**
 * Update Wetterdaten im Hintergrund
 */
async function updateWeatherData() {
  try {
    console.log('Service Worker: Updating weather data...');
    
    // Holo gespeicherte Städte aus Cache
    const cache = await caches.open(CACHE_NAME);
    const allResponses = await cache.keys();
    
    console.log('Service Worker: Weather update completed');
    
    // Benachrichtige Client
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'WEATHER_UPDATE',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('Service Worker: Weather update failed', error);
  }
}

// Push Notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {
    title: 'Wetter Update',
    body: 'Wetterdaten verfügbar',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" font-size="80" text-anchor="middle" dy=".3em">🌦️</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" font-size="80" text-anchor="middle" dy=".3em">🌦️</text></svg>',
    tag: 'weather-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Öffnen',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" font-size="40" text-anchor="middle" dy=".3em">📖</text></svg>'
      },
      {
        action: 'close',
        title: 'Schließen',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" font-size="40" text-anchor="middle" dy=".3em">✕</text></svg>'
      }
    ]
  };

  if (event.data) {
    try {
      notificationData = Object.assign(notificationData, event.data.json());
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Push Subscription Change - best-effort handling
self.addEventListener('pushsubscriptionchange', event => {
  console.log('Service Worker: pushsubscriptionchange event', event);
  event.waitUntil((async () => {
    try {
      const reg = await self.registration;
      // In a real app you'd re-subscribe with the server's VAPID key and send new subscription to server
      const newSub = await reg.pushManager.subscribe({ userVisibleOnly: true });
      console.log('Service Worker: re-subscribed after change', newSub);
    } catch (err) {
      console.warn('Service Worker: failed to re-subscribe', err);
    }
  })());
});
// Notification Clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Prüfe ob App schon offen ist
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Sonst öffne neue
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Notification Close
self.addEventListener('notificationclose', event => {
  console.log('Service Worker: Notification closed');
});

// Periodic Background Sync (optional, für neuere Browser)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-weather') {
    event.waitUntil(updateWeatherData());
  }
});

// Message Events von Client
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'REQUEST_WEATHER_UPDATE') {
    event.waitUntil(updateWeatherData());
  }
});

console.log('Service Worker: Loaded');

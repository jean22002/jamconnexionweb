/* eslint-disable no-restricted-globals */
// Service Worker pour les notifications push et fonctionnement en arrière-plan
// Compatible avec les futures applications smartphone

const CACHE_NAME = 'jam-connexion-v2'; // Incremented version to force cache update
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Écouter les notifications push
self.addEventListener('push', (event) => {
  console.log('Notification push reçue');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message || data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      tag: data.id || 'notification',
      requireInteraction: false,
      data: {
        url: data.link || '/',
        ...data
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Jam Connexion', options)
    );
  }
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('Clic sur notification');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si une fenêtre est déjà ouverte, la focus
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Gérer les messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
  
  // Skip waiting pour mise à jour immédiate
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background Sync - Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
  
  if (event.tag === 'sync-events') {
    event.waitUntil(syncEvents());
  }
});

// Periodic Background Sync - Synchronisation périodique (pour les futures apps)
self.addEventListener('periodicsync', (event) => {
  console.log('[Service Worker] Periodic sync:', event.tag);
  
  if (event.tag === 'update-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Stratégie de cache : Network First, puis Cache
self.addEventListener('fetch', (event) => {
  // Skip pour les requêtes non-GET
  if (event.request.method !== 'GET') return;
  
  // Skip pour les requêtes API (toujours en ligne)
  if (event.request.url.includes('/api/')) return;
  
  // Pour les fichiers HTML, JS, CSS : toujours essayer le réseau d'abord
  const isNavigationRequest = event.request.mode === 'navigate' || 
                               event.request.destination === 'document' ||
                               event.request.url.endsWith('.html') ||
                               event.request.url.endsWith('.js') ||
                               event.request.url.endsWith('.css');
  
  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone la réponse avant de la mettre en cache
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          // Si le réseau échoue, utiliser le cache (offline fallback)
          return caches.match(event.request);
        })
    );
  } else {
    // Pour les autres ressources (images, fonts, etc.) : Cache First
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then((response) => {
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
        })
    );
  }
});

// Fonctions de synchronisation
async function syncNotifications() {
  try {
    console.log('[Service Worker] Synchronisation des notifications...');
    // Cette fonction sera appelée même quand l'app est fermée
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_NOTIFICATIONS',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('[Service Worker] Erreur sync notifications:', error);
  }
}

async function syncEvents() {
  try {
    console.log('[Service Worker] Synchronisation des événements...');
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_EVENTS',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('[Service Worker] Erreur sync événements:', error);
  }
}

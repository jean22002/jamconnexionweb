/* eslint-disable no-restricted-globals */
// Service Worker PWA pour Jam Connexion
// Support du mode hors ligne, notifications push et cache intelligent

const CACHE_VERSION = 'v3.0';
const CACHE_NAME = `jam-connexion-${CACHE_VERSION}`;
const RUNTIME_CACHE = `jam-connexion-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `jam-connexion-images-${CACHE_VERSION}`;

// URLs critiques à mettre en cache lors de l'installation
const CRITICAL_URLS = [
  '/',
  '/manifest.json'
];

// Durée de vie du cache (en millisecondes)
const CACHE_EXPIRATION = {
  images: 7 * 24 * 60 * 60 * 1000,  // 7 jours
  runtime: 24 * 60 * 60 * 1000,      // 24 heures
  api: 5 * 60 * 1000                 // 5 minutes
};

self.addEventListener('install', (event) => {
  console.log('[SW] Installation - Version', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Mise en cache des ressources critiques');
        return cache.addAll(CRITICAL_URLS).catch(err => {
          console.warn('[SW] Erreur cache initial:', err);
        });
      })
      .then(() => {
        console.log('[SW] Installation terminée, activation immédiate');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activation');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprimer tous les anciens caches sauf les actuels
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Prise de contrôle des clients');
      return self.clients.claim();
    })
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

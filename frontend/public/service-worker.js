/* eslint-disable no-restricted-globals */
// Service Worker PWA pour Jam Connexion
// Support du mode hors ligne, notifications push et cache intelligent

const CACHE_VERSION = 'v5.1';
const CACHE_NAME = `jam-connexion-${CACHE_VERSION}`;
const RUNTIME_CACHE = `jam-connexion-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `jam-connexion-images-${CACHE_VERSION}`;

// URLs critiques à mettre en cache lors de l'installation
const CRITICAL_URLS = [
  '/',
  '/manifest.json'
];

// Endpoints critiques qui ne doivent JAMAIS être mis en cache
const NO_CACHE_ENDPOINTS = [
  '/api/my-subscriptions',
  '/api/friends',
  '/api/friends/requests',
  '/api/friends/sent',
  '/api/musicians/me',
  '/api/venues/me'
];

// Durée de vie du cache (en millisecondes)
const CACHE_EXPIRATION = {
  images: 7 * 24 * 60 * 60 * 1000,  // 7 jours
  runtime: 24 * 60 * 60 * 1000,      // 24 heures
  api: 30 * 1000                     // 30 secondes (réduit de 5 minutes)
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
        // Si une fenêtre est déjà ouverte sur ce site, la focus SANS changer l'URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          const clientOrigin = new URL(client.url).origin;
          const targetOrigin = new URL(urlToOpen, self.location.origin).origin;
          
          if (clientOrigin === targetOrigin && 'focus' in client) {
            // Focus la fenêtre existante mais ne change PAS l'URL
            return client.focus();
          }
        }
        // Seulement si aucune fenêtre n'est ouverte, en ouvrir une nouvelle
        if (self.clients.openWindow && clientList.length === 0) {
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

// Stratégie de cache intelligente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip pour les requêtes non-GET
  if (request.method !== 'GET') return;
  
  // Skip pour les requêtes vers des domaines externes (sauf images)
  if (url.origin !== location.origin && !isImageRequest(request)) return;
  
  // NOUVEAU: Skip cache pour les endpoints critiques de données utilisateur
  if (NO_CACHE_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
    console.log('[SW] Network only (no cache) for:', url.pathname);
    event.respondWith(fetch(request));
    return;
  }
  
  // 1. STRATÉGIE POUR LES IMAGES : Cache First (longue durée)
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // 2. STRATÉGIE POUR LES API : Network First avec cache court
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // 3. STRATÉGIE POUR LES PAGES HTML/JS/CSS : Network First avec fallback
  if (isNavigationRequest(request) || isAssetRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // 4. STRATÉGIE PAR DÉFAUT : Network avec fallback cache
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Helpers
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(request.url);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         request.destination === 'document' ||
         request.url.endsWith('.html');
}

function isAssetRequest(request) {
  return request.destination === 'script' || 
         request.destination === 'style' ||
         /\.(js|css)$/i.test(request.url);
}

// Handler pour les images : Cache First avec expiration
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      // Vérifier l'âge du cache
      const cacheDate = cached.headers.get('sw-cache-date');
      if (cacheDate) {
        const age = Date.now() - parseInt(cacheDate);
        if (age < CACHE_EXPIRATION.images) {
          return cached;
        }
      }
    }
    
    // Fetch et mise en cache
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const newHeaders = new Headers(clone.headers);
      newHeaders.append('sw-cache-date', Date.now().toString());
      
      const newResponse = new Response(clone.body, {
        status: clone.status,
        statusText: clone.statusText,
        headers: newHeaders
      });
      
      cache.put(request, newResponse);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Retourner une image placeholder en cas d'échec total
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#ddd"/></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' }}
    );
  }
}

// Handler pour les API : Network First avec cache court
async function handleAPIRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const clone = response.clone();
      const cache = await caches.open(RUNTIME_CACHE);
      
      // Ajouter metadata de cache
      const newHeaders = new Headers(clone.headers);
      newHeaders.append('sw-cache-date', Date.now().toString());
      
      const cachedResponse = new Response(clone.body, {
        status: clone.status,
        statusText: clone.statusText,
        headers: newHeaders
      });
      
      cache.put(request, cachedResponse);
    }
    return response;
  } catch (error) {
    // Fallback sur le cache si disponible et pas trop vieux
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      const cacheDate = cached.headers.get('sw-cache-date');
      if (cacheDate) {
        const age = Date.now() - parseInt(cacheDate);
        if (age < CACHE_EXPIRATION.api) {
          console.log('[SW] Using cached API response');
          return cached;
        }
      }
    }
    
    throw error;
  }
}

// Handler pour la navigation : Network First avec fallback offline
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
    }
    
    return response;
  } catch (error) {
    // Fallback sur le cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Si aucun cache, retourner la page d'accueil en cache
    const indexCache = await caches.match('/');
    if (indexCache) {
      return indexCache;
    }
    
    // Dernière option : page offline basique
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Hors ligne - Jam Connexion</title>
          <style>
            body{font-family:system-ui;text-align:center;padding:50px;background:#0a0118;color:#fff}
            .icon{font-size:64px;margin:20px}
            button{background:#a855f7;color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:16px}
            button:hover{background:#9333ea}
          </style>
        </head>
        <body>
          <div class="icon">📡</div>
          <h1>Vous êtes hors ligne</h1>
          <p>Vérifiez votre connexion Internet et réessayez.</p>
          <button onclick="location.reload()">Réessayer</button>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' }}
    );
  }
}

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

/**
 * Budget Manager — Service Worker (PWA)
 * Gestion du cache hors-ligne pour un fonctionnement autonome
 */

const CACHE_NAME = 'budget-manager-cache-v5.1.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
  './favicon.ico',
  './icon.svg',
  './icon.png'
];

// Installation : mise en cache initiale des ressources.
// Une nouvelle version reste « en attente » : l'application affiche alors le bandeau
// « Nouvelle version disponible » et c'est l'utilisateur qui déclenche l'activation.
self.addEventListener('install', (event) => {
  event.waitUntil(
    // cache: 'reload' contourne le cache HTTP du navigateur pour récupérer la vraie nouvelle version
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE.map((url) => new Request(url, { cache: 'reload' }))))
  );
});

// Activation demandée depuis la page (bouton « Mettre à jour »)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes : Réseau d'abord, secours sur le cache si hors-ligne
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non GET, d'autres schémas ou d'autres origines
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }
  if (new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
          );
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          // Toujours renvoyer une Response (respondWith n'accepte pas undefined)
          return Response.error();
        });
      })
  );
});

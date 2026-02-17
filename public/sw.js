const CACHE_NAME = 'medplanner-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install - apenas cache recursos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Cache aberto');
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('⚠️ Alguns recursos não puderam ser cacheados:', err);
        });
      })
  );
  self.skipWaiting();
});

// Activate - limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch - Network First com fallback
self.addEventListener('fetch', (event) => {
  // Ignora requisições para APIs externas e chrome-extension
  if (
    event.request.url.includes('unsplash.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('firebasestorage.googleapis.com') ||
    event.request.url.includes('chrome-extension') ||
    event.request.url.includes('generativelanguage.googleapis.com')
  ) {
    return; // Deixa o fetch normal acontecer
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, retorna e cacheia
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tenta buscar do cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se não tiver no cache, retorna resposta offline
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
const CACHE_NAME = 'rimas-coleta-v3';

const STATIC_ASSETS = [
  './',
  './index.html',
  './wells.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap',
];

// Install: cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url).catch(() => null)));
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for tiles, cache-first for app assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Map tiles: network-first with cache fallback
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open('rimas-tiles-v3').then(tileCache =>
        fetch(event.request)
          .then(response => {
            if (response.ok) tileCache.put(event.request, response.clone());
            return response;
          })
          .catch(() => tileCache.match(event.request))
      )
    );
    return;
  }

  // App resources: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

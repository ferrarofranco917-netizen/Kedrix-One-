// AQ65 anagrafiche fornitori price lists foundation
const STATIC_CACHE = 'kedrix-one-stepaq65-static-v1';
const RUNTIME_CACHE = 'kedrix-one-stepaq65-runtime-v1';
const STATIC_FILES = [
  './',
  './index.html',
  './style.css',
  './style-density.css',
  './manifest.json',
  './favicon.ico',
  './brand/kedrix-one-mark.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => caches.open(STATIC_CACHE))
      .then((cache) => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCodeAsset = sameOrigin && /\.(?:js|css|html|json)$/i.test(url.pathname);

  if (isCodeAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (!sameOrigin) return response;
      const clone = response.clone();
      caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone)).catch(() => {});
      return response;
    }))
  );
});

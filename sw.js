const CACHE = 'kedrix-one-step5d-search-v1';
const FILES = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './favicon.ico',
  './brand/kedrix-one-mark.svg',
  './js/storage.js',
  './js/data.js',
  './js/utils.js',
  './js/wisemind.js',
  './js/i18n.js',
  './js/practice-schemas.js',
  './js/module-registry.js',
  './js/licensing.js',
  './js/templates.js',
  './js/search-index.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
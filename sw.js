const CACHE = 'kedrix-one-stepah-master-data-expansion-v1';
const FILES = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './favicon.ico',
  './brand/kedrix-one-mark.svg',
  './js/storage.js',
  './js/data/ports.js',
  './js/data/customs.js',
  './js/data/taric.js',
  './js/data/goods-master.js',
  './js/data/transport-units.js',
  './js/config/integrations-endpoints.js',
  './js/data.js',
  './js/utils.js',
  './js/ui/app-feedback.js',
  './js/wisemind.js',
  './js/i18n.js',
  './js/master-data/entity-records.js',
  './js/master-data/vat-autofill.js',
  './js/master-data/master-data-overview.js',
  './js/master-data/quick-add.js',
  './js/practice-schemas.js',
  './js/practices/practice-readiness-board.js',
  './js/practices/practice-logistics-intelligence.js',
  './js/practices/practice-logistics-board.js',
  './js/practices/practice-document-readiness.js',
  './js/practices/practice-operational-hub.js',
  './js/practices/linked-entity-summary.js',
  './js/practices/sea-schema-cleanup.js',
  './js/practices/reference-normalizer.js',
  './js/practices/verification.js',
  './js/practices/draft-validator.js',
  './js/practices/form-layout.js',
  './js/practices/linked-parties-board.js',
  './js/practices/practice-overview.js',
  './js/practices/form-renderer.js',
  './js/practices/open-edit.js',
  './js/practices/identity.js',
  './js/practices/persistence.js',
  './js/practices/save-pipeline.js',
  './js/practices/container-integrity.js',
  './js/practices/weight-integrity.js',
  './js/practices/attachments.js',
  './js/practices/duplicate.js',
  './js/documents/document-engine.js',
  './js/search/practice-search-ui.js',
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

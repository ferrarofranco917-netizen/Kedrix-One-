const CACHE='kedrix-one-step3-fix';
const FILES=['./','./index.html','./style.css','./manifest.json','./favicon.ico','./js/storage.js','./js/data.js','./js/utils.js','./js/wisemind.js','./js/templates.js','./js/app.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});

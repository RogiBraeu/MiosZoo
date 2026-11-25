/* Service Worker – Mios Zoo – Vokabeln
   Muster wie Familienbank: versionierter Cache, Network-First mit Cache-Fallback,
   fremde Server (CDN usw.) werden nie gecacht, Update per Banner "Jetzt aktualisieren". */
const CACHE_PREFIX = 'mios-zoo-pub-v';
const CACHE_NAME = 'mios-zoo-pub-v1.38';
const ASSETS = ['./', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png',
  './apple-touch-icon.png', './favicon-64.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME && k.startsWith(CACHE_PREFIX)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Die App schickt diese Nachricht, wenn auf "Jetzt aktualisieren" getippt wird
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return; // nur eigene Dateien
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});

/* Hellscape Horror — offline service worker */
const CACHE = 'hellscape-v1';
const ASSETS = [
  './', './index.html', './three.min.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(ASSETS.map((u) => c.add(u))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        try {
          if (res && res.ok && new URL(req.url).origin === location.origin) {
            const cp = res.clone();
            caches.open(CACHE).then((c) => c.put(req, cp));
          }
        } catch (_) {}
        return res;
      }).catch(() => hit);
    })
  );
});

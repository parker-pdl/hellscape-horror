/* Hellscape Horror — offline service worker */
const CACHE = 'hellscape-v3';
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

// HTML/navigation requests: always try the network first so a fresh deploy
// shows up immediately; only fall back to the cached copy when offline.
// Everything else (three.min.js, icons, manifest): cache-first, since those
// rarely change and this keeps the game fast + playable offline.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Range-requested media (the <audio> element scrubbing/streaming music.mp3) must
  // go straight to the network, untouched. The Cache API can't store a 206 Partial
  // Content response, and if an earlier *unranged* request for the same URL got
  // cached as a full 200, caches.match() here would hand that whole-file response
  // back to a ranged request instead of forwarding it — Chrome's media demuxer
  // chokes on that mismatch ("DEMUXER_ERROR_COULD_NOT_OPEN") and playback silently
  // fails. This is what broke the background music.
  if (req.headers.has('range')) return;

  const isHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const cp = res.clone();
          caches.open(CACHE).then((c) => c.put(req, cp));
        }
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

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

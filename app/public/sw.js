const CACHE = 'mia-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-180.png'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((a) => c.add(a)))));
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/')) return;

  ev.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp.ok && url.origin === location.origin) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return resp;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
  );
});

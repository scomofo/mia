// sw.js — Mia offline cache
const CACHE = 'mia-v1';
const ASSETS = [
  './mia.html',
  './manifest.webmanifest',
  './src/styles.css',
  './src/app.jsx',
  './src/chat-flow.jsx',
  './src/chat-ui.jsx',
  './src/home-screens.jsx',
  './src/plan-screen.jsx',
  './src/prompt-builder.jsx',
  './src/prompt-select.jsx',
  './src/prompts.jsx',
  './src/questions.jsx',
  './frames/ios-frame.jsx',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://unpkg.com/react@18.3.1/umd/react.development.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE).then((c) =>
      // cache best-effort; don't fail install if one asset 404s
      Promise.allSettled(ASSETS.map((a) => c.add(a)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  ev.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((resp) => {
          // opportunistically cache same-origin + unpkg
          const u = new URL(req.url);
          if (resp.ok && (u.origin === location.origin || u.hostname === 'unpkg.com')) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return resp;
        })
        .catch(() => caches.match('./mia.html'));
    })
  );
});

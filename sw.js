/* Service Worker de BÚNKER. Generado en el build: VERSION y PRECACHE se inyectan. */
const VERSION = 'e7cf750826';
const PRECACHE = [
 "./",
 "./index.html",
 "./assets/index-83NYDm9R.css",
 "./assets/index-2jE6TXZH.js",
 "./manifest.webmanifest",
 "./icons/icon-192.png",
 "./icons/icon-512.png",
 "./icons/icon-maskable-192.png",
 "./icons/icon-maskable-512.png",
 "./icons/apple-touch-icon.png",
 "./icons/favicon.svg"
];
const CACHE = `bunker-${VERSION}`;
const RUNTIME = 'bunker-runtime';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)),
  );
  // No hacemos skipWaiting automático: la app pregunta "Nueva versión → Recargar".
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('bunker-') && k !== CACHE && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Navegación: app shell (index.html) desde la caché, también con ?seed=...
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html', { ignoreSearch: true }).then((cached) => cached || fetch(req).catch(() => caches.match('./', { ignoreSearch: true }))),
    );
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});

/* Service Worker de BÚNKER. Generado en el build: VERSION y PRECACHE se inyectan. */
const VERSION = '2133a1cfb9';
const PRECACHE = [
 "./",
 "./index.html",
 "./assets/pixelify-sans-latin-400-normal-NSWc6_3u.woff2",
 "./assets/pixelify-sans-latin-600-normal-3CrG1hjo.woff2",
 "./assets/silkscreen-latin-400-normal-BPgV6gMp.woff2",
 "./assets/silkscreen-latin-700-normal-3tFNWi8e.woff2",
 "./assets/pixelify-sans-latin-400-normal-DObCLyZY.woff",
 "./assets/pixelify-sans-latin-600-normal-CcgOpmdR.woff",
 "./assets/silkscreen-latin-400-normal-Nzwutdwa.woff",
 "./assets/silkscreen-latin-700-normal-CAHVpo4o.woff",
 "./assets/index-A22A8Hrn.css",
 "./assets/index-B4iVjDpX.js",
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

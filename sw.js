// Lincoln Park Wildlife Watch — minimal service worker
//
// This exists mainly to satisfy browsers' "installable app" requirements
// (a manifest plus a registered service worker). It caches the app shell
// itself so the page still loads if you're briefly offline, but it does
// NOT cache map tiles, Firestore data, or photos — those genuinely need
// a connection, which is expected for a live community map.

const CACHE_NAME = 'wildlife-watch-shell-v2';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle same-origin navigation/shell requests; let everything else
  // (Firestore, tiles, Google auth, Storage) go straight to the network.
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

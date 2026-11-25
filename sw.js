const CACHE_NAME = 'j2me-emul-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/', '/index.html']).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Shudhu nijer origin-er file cache korbe
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request, { ignoreSearch: false });

      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          // Shudhu valid 200 OK response cache korbe (502/503 error page na)
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => null);

      // Jodi aage theke cache thake: instant cache dibe + background-e update korbe
      if (cachedResponse) {
        event.waitUntil(networkFetch);
        return cachedResponse;
      }

      // 1st bar (cache nei): network theke anbe
      const netRes = await networkFetch;
      if (netRes) return netRes;

      // Jodi navigation hoy ar exact URL cache-e na thake, '/' fallback try korbe
      if (event.request.mode === 'navigate') {
        return (await cache.match('/')) || (await cache.match('/index.html'));
      }

      return Response.error();
    })
  );
});

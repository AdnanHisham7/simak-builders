const CACHE_VERSION = "v2";
const SHELL_CACHE = `simak-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `simak-static-${CACHE_VERSION}`;

const APP_SHELL_ASSETS = [
  "/",
  "/index.html",
  "/logo-mark.svg",
  "/manifest.webmanifest"
];

// Install Event - Precache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS).catch((err) => {
        console.warn("[SW] Cache addAll warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up stale versioned caches and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== SHELL_CACHE && key !== STATIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message Event (for instant updates)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Ignore non-GET requests, non-http(s), and API calls (API is handled by IndexedDB & sync engine)
  if (
    request.method !== "GET" ||
    !url.protocol.startsWith("http") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // 2. Navigation / HTML requests (SPA routes): Network-first, fallback to cached index.html
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            const cache = await caches.open(SHELL_CACHE);
            cache.put(request, clone);
          }
          return networkResponse;
        } catch (err) {
          // Offline navigation: try exact URL first, then fallback to /index.html
          const cached = await caches.match(request);
          if (cached) return cached;

          const shell = (await caches.match("/index.html")) || (await caches.match("/"));
          if (shell) return shell;

          return new Response(
            "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>SIMAK Offline</title><meta name='viewport' content='width=device-width, initial-scale=1.0'><style>body{font-family:sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:1rem;}h1{font-size:1.5rem;margin-bottom:0.5rem;}p{color:#94a3b8;margin-bottom:1.5rem;}button{background:#2563eb;color:#fff;border:none;padding:0.75rem 1.5rem;border-radius:0.5rem;font-weight:600;cursor:pointer;}</style></head><body><div><h1>SIMAK Builders - Offline</h1><p>You are currently offline. Please reconnect to load new pages.</p><button onclick='window.location.reload()'>Retry</button></div></body></html>",
            {
              headers: { "Content-Type": "text/html; charset=utf-8" },
              status: 200,
            }
          );
        }
      })()
    );
    return;
  }

  // 3. Static Assets: Cache-First with network fallback & dynamic caching
  const isStatic =
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".ttf") ||
    url.pathname.endsWith(".webmanifest");

  if (isStatic) {
    event.respondWith(
      (async () => {
        // 3a. Check cache first (fast, reliable offline, avoids redundant network errors)
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // 3b. If not in cache, fetch from network
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Offline and asset not in cache: NEVER return undefined or let promise reject!
          if (url.pathname.endsWith(".js")) {
            return new Response("/* Offline: asset unavailable */", {
              status: 503,
              statusText: "Offline",
              headers: { "Content-Type": "application/javascript" },
            });
          }
          if (url.pathname.endsWith(".css")) {
            return new Response("/* Offline: styles unavailable */", {
              status: 503,
              statusText: "Offline",
              headers: { "Content-Type": "text/css" },
            });
          }
          return new Response(null, { status: 503, statusText: "Offline" });
        }
      })()
    );
    return;
  }

  // 4. Default fallback: Cache-first, then Network, safe fallback
  event.respondWith(
    (async () => {
      try {
        const cached = await caches.match(request);
        if (cached) return cached;

        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(null, { status: 503, statusText: "Offline" });
      }
    })()
  );
});

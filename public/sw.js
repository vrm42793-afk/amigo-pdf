// AMIGO PDF — Service Worker
// Provides offline caching for static assets and API-first navigation

const CACHE_NAME = "amigo-pdf-v2";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/login",
  "/manifest.json",
];

// Install: pre-cache key shell assets
// skipWaiting is chained inside waitUntil so it only fires after caching is done
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clear stale caches from previous versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first for API/dynamic, Cache-first for static
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests (covers Supabase, Cloudinary, etc.)
  if (request.method !== "GET" || url.origin !== location.origin) return;

  // Cache-first for static assets (fonts, images, scripts, icons)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/screenshots/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/favicon.ico"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Skip API routes — always fetch fresh, never cache
  if (url.pathname.startsWith("/api/")) return;

  // Network-first for page navigations, fall back to cache or offline response
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful navigation responses
        if (response.ok && request.mode === "navigate") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        // Try cache first
        const cached = await caches.match(request);
        if (cached) return cached;

        // Final fallback: return cached home page for navigations
        if (request.mode === "navigate") {
          const home = await caches.match("/");
          if (home) return home;
        }

        // Return a minimal offline response so the SW doesn't crash
        return new Response(
          JSON.stringify({ error: "You are offline. Please check your connection." }),
          {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "application/json" },
          }
        );
      })
  );
});

// Background Sync — retry failed uploads when back online
self.addEventListener("sync", (event) => {
  if (event.tag === "upload-retry") {
    event.waitUntil(retryPendingUploads());
  }
});

async function retryPendingUploads() {
  // Notify all open windows to retry their pending uploads
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach((client) => client.postMessage({ type: "RETRY_UPLOADS" }));
}

// Push notifications (battle invites, share alerts, collaboration)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  // Guard against malformed push payloads
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "AMIGO PDF", body: event.data.text() };
  }

  const options = {
    body: data.body || "You have a new notification from AMIGO PDF",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    tag: data.tag || "amigo-notification",
    data: { url: data.url || "/dashboard" },
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "AMIGO PDF", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      })
  );
});

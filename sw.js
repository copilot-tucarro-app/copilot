const CACHE_NAME = "copilot-v8";
const APP_SHELL = ["./", "./manifest.webmanifest", "./copilot-icon-192.png", "./copilot-icon-512.png", "./favicon.png", "./apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./", responseCopy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match("./")),
    );
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match("./"));
    }),
  );
});

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event);
  const title = payload.title || "COPILOT";
  const options = {
    body: payload.body || "Tienes una alerta pendiente en COPILOT.",
    icon: payload.icon || "./copilot-icon-192.png",
    badge: payload.badge || "./copilot-icon-192.png",
    tag: payload.tag || "copilot-push",
    renotify: Boolean(payload.renotify),
    requireInteraction: Boolean(payload.requireInteraction),
    data: {
      url: payload.url || "./",
      type: payload.type || "push",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "./", self.location.href).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const appClient = clientList.find((client) => client.url.startsWith(self.registration.scope));
        if (appClient) {
          return appClient.focus();
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }

        return undefined;
      }),
  );
});

function readPushPayload(event) {
  if (!event.data) return {};

  try {
    return event.data.json();
  } catch {
    return {
      body: event.data.text(),
    };
  }
}

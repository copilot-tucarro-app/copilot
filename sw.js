const ASSET_VERSION = "20260605-copilot360-iphoneinstructions";
const CACHE_NAME = `copilot360-v6-${ASSET_VERSION}`;
const withVersion = (url) => `${url}?v=${ASSET_VERSION}`;
const APP_SHELL = [
  "./",
  withVersion("./manifest.webmanifest"),
  withVersion("./copilot-icon-192.png"),
  withVersion("./copilot-icon-512.png"),
  withVersion("./favicon.png"),
  withVersion("./apple-touch-icon.png"),
  withVersion("./copilot360-logo.png"),
];

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

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
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
  const title = payload.title || "copilot360";
  const options = {
    body: payload.body || "Tienes una alerta pendiente en copilot360.",
    icon: payload.icon || withVersion("./copilot-icon-192.png"),
    badge: payload.badge || withVersion("./copilot-icon-192.png"),
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

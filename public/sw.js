/// <reference lib="webworker" />

// Take control as soon as a new worker is installed, so a deployed fix does not
// wait for every tab to be closed first.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Chrome only treats the app as installable when the service worker owns a
// fetch handler. Nothing is cached: requests go straight to the network.
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  // iOS revokes the subscription if a push does not surface a notification,
  // so we always show something even when the payload is missing or broken.
  let payload = {
    title: "Think Twice",
    body: "One of your objects is up for review.",
    url: "/",
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: payload.tag || "think-twice-review",
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    (event.notification.data && event.notification.data.url) || "/",
    self.location.origin,
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});

// Push services rotate endpoints. When that happens the browser fires this
// event and the old subscription stops working unless we re-register it.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const applicationServerKey =
        (event.oldSubscription && event.oldSubscription.options
          ? event.oldSubscription.options.applicationServerKey
          : null) ||
        (event.newSubscription && event.newSubscription.options
          ? event.newSubscription.options.applicationServerKey
          : null);

      if (event.oldSubscription) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: event.oldSubscription.endpoint }),
        }).catch(() => {});
      }

      const subscription =
        event.newSubscription ||
        (applicationServerKey
          ? await self.registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey,
            })
          : null);

      if (!subscription) {
        return;
      }

      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
    })(),
  );
});

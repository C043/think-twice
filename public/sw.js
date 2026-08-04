/// <reference lib="webworker" />

// Bump this to retire the previous cache. `activate` deletes every cache whose
// name does not match, so a stale offline page never outlives a deploy.
const CACHE = "think-twice-offline-v1";
const OFFLINE_URL = "/offline.html";

// The page and the one image it shows. Nothing else: every real route is
// force-dynamic and caching one would serve a stale object list, which is worse
// than the failure this is here to soften.
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

// Take control as soon as a new worker is installed, so a deployed fix does not
// wait for every tab to be closed first.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      // A precache miss must not block installation: without an active worker
      // there are no push notifications either, and that is the costlier loss.
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

// Chrome only treats the app as installable when the service worker owns a
// fetch handler, and a standalone iOS window has no address bar — so a
// navigation that cannot reach the server leaves a blank screen with no way to
// retry. Navigations fall back to the cached offline page, which polls and
// reloads itself once the server answers again.
//
// Only navigations are touched. Everything else goes straight to the network,
// unchanged and uncached.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then(
        (cached) =>
          cached ||
          Response.error(),
      ),
    ),
  );
});

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

/**
 * Browser-side helpers for the Web Push subscription flow.
 * Kept free of React and of top-level browser globals so they stay testable.
 */

export function urlBase64ToUint8Array(
  base64String: string,
): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  // Backed by a plain ArrayBuffer so it satisfies BufferSource for
  // `applicationServerKey`.
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function isIos(userAgent: string): boolean {
  return /iPad|iPhone|iPod/.test(userAgent);
}

export function isStandalone(
  nav: { standalone?: boolean },
  mediaMatches = false,
): boolean {
  return nav.standalone === true || mediaMatches === true;
}

export interface PushCapabilities {
  /** The Push API exists. False on any non-secure origin. */
  supported: boolean;
  /** iOS outside the Home Screen, where the Push API is absent by design. */
  needsInstall: boolean;
}

/** Snapshot used while server rendering, where no capability can be observed. */
export const SERVER_PUSH_CAPABILITIES: PushCapabilities = {
  supported: false,
  needsInstall: false,
};

let cachedCapabilities: PushCapabilities | null = null;

/**
 * Probes the browser once and keeps the answer.
 *
 * Feeds `useSyncExternalStore`, which compares snapshots by reference: a new
 * object per render would make React throw. Caching is sound because none of
 * these can change without a reload — installing to the Home Screen opens a new
 * browsing context.
 */
export function probePushCapabilities(): PushCapabilities {
  if (cachedCapabilities) {
    return cachedCapabilities;
  }

  if (typeof window === "undefined") {
    return SERVER_PUSH_CAPABILITIES;
  }

  const standalone = isStandalone(
    navigator as { standalone?: boolean },
    window.matchMedia("(display-mode: standalone)").matches,
  );

  cachedCapabilities = {
    supported: isPushSupported(),
    needsInstall: isIos(navigator.userAgent) && !standalone,
  };

  return cachedCapabilities;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string,
): Promise<PushSubscription> {
  const existing = await registration.pushManager.getSubscription();

  if (existing) {
    return existing;
  }

  return await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

export async function saveSubscription(
  subscription: PushSubscription,
): Promise<void> {
  const resp = await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });

  if (!resp.ok) {
    throw new Error("Failed to store the push subscription.");
  }
}

export async function removeSubscription(
  subscription: PushSubscription,
): Promise<void> {
  await fetch("/api/push", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });

  await subscription.unsubscribe();
}

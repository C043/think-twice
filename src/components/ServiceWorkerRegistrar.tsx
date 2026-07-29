"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/push-client";

/**
 * Registers the service worker on every visit. Chrome needs an active worker
 * before it will offer to install the app, and iOS needs one already in place
 * before the user can grant the notification permission.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    registerServiceWorker().catch((err) => {
      console.error("Service worker registration failed", err);
    });
  }, []);

  return null;
}

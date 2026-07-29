"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Share } from "lucide-react";
import { toast } from "sonner";
import Modal from "./ModalComponent";
import {
  isIos,
  isPushSupported,
  isStandalone,
  registerServiceWorker,
  removeSubscription,
  saveSubscription,
  subscribeToPush,
} from "@/lib/push-client";

export default function PushNotificationsToggle() {
  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const standalone = isStandalone(
      navigator as { standalone?: boolean },
      window.matchMedia("(display-mode: standalone)").matches,
    );

    // On iOS the Push API only exists once the app runs from the Home Screen.
    setNeedsInstall(isIos(navigator.userAgent) && !standalone);

    if (!isPushSupported()) {
      return;
    }

    setSupported(true);

    navigator.serviceWorker
      .getRegistration()
      .then(async (registration) => {
        if (!registration) return;
        const existing = await registration.pushManager.getSubscription();
        setSubscribed(existing !== null);
      })
      .catch(() => {});
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        toast.error("Push notifications are not configured on the server.");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        toast.error("Notifications permission was denied.");
        return;
      }

      const registration = await registerServiceWorker();
      await navigator.serviceWorker.ready;

      const subscription = await subscribeToPush(registration, vapidPublicKey);
      await saveSubscription(subscription);

      setSubscribed(true);
      toast.success("This device will be notified.");
    } catch (err) {
      console.error(err);
      toast.error("Could not enable notifications on this device.");
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await removeSubscription(subscription);
      }

      setSubscribed(false);
      toast.success("This device will no longer be notified.");
    } catch (err) {
      console.error(err);
      toast.error("Could not disable notifications on this device.");
    } finally {
      setBusy(false);
    }
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  if (needsInstall) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsInstallModalOpen(true)}
          className="w-9 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          aria-label="How to enable notifications on iOS"
        >
          <Bell className="h-5 w-5" />
        </button>

        <Modal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        >
          <div className="flex flex-col h-full justify-between gap-4 p-5 text-left">
            <div className="space-y-3">
              <h2 className="text-xl font-bold dark:text-white text-black">
                Install Think Twice first
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                On iPhone and iPad, notifications only work once the app lives
                on your Home Screen.
              </p>
              <ol className="text-sm text-zinc-600 dark:text-zinc-300 space-y-2 list-decimal list-inside">
                <li className="flex items-center gap-2">
                  <Share className="h-4 w-4 shrink-0" />
                  Tap the Share button in Safari.
                </li>
                <li>Choose &quot;Add to Home Screen&quot;.</li>
                <li>Open Think Twice from the new icon.</li>
                <li>Tap the bell again and allow notifications.</li>
              </ol>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Requires iOS 16.4 or newer.
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsInstallModalOpen(false)}
                className="flex-1 p-2 border rounded-lg text-sm font-medium text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  if (!supported) {
    return null;
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={subscribed ? disable : enable}
      className="w-9 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
      aria-label={
        subscribed ? "Disable notifications" : "Enable notifications"
      }
    >
      {subscribed ? (
        <BellRing className="h-5 w-5 text-emerald-500" />
      ) : (
        <BellOff className="h-5 w-5" />
      )}
    </button>
  );
}

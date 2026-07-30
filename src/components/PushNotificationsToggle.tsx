"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2, Share } from "lucide-react";
import { toast } from "sonner";
import Modal from "./ModalComponent";
import { iconButton, secondaryButton } from "./ui/styles";
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
    return <div className="h-10 w-10" />;
  }

  if (needsInstall) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsInstallModalOpen(true)}
          className={iconButton}
          aria-label="How to enable notifications on iOS"
        >
          <Bell className="h-5 w-5" />
        </button>

        <Modal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          title="Install Think Twice first"
          description="On iPhone and iPad, notifications only work once the app lives on your Home Screen."
          footer={
            <button
              type="button"
              onClick={() => setIsInstallModalOpen(false)}
              className={secondaryButton}
            >
              Got it
            </button>
          }
        >
          <ol className="space-y-2.5 pb-2 text-left text-sm text-muted">
            {[
              <>
                Tap the <Share className="mx-0.5 inline h-3.5 w-3.5 align-text-bottom" />{" "}
                Share button in Safari.
              </>,
              <>Choose &quot;Add to Home Screen&quot;.</>,
              <>Open Think Twice from the new icon.</>,
              <>Tap the bell again and allow notifications.</>,
            ].map((step, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          <p className="pb-2 text-xs text-muted/70">
            Requires iOS 16.4 or newer.
          </p>
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
      className={iconButton}
      aria-label={
        subscribed ? "Disable notifications" : "Enable notifications"
      }
    >
      {busy ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : subscribed ? (
        <BellRing className="h-5 w-5 text-emerald-500" />
      ) : (
        <BellOff className="h-5 w-5" />
      )}
    </button>
  );
}

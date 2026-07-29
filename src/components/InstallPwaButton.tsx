"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { isStandalone } from "@/lib/push-client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Android and desktop Chrome only. iOS never fires `beforeinstallprompt`, so
 * there the install path is the manual one explained by the bell button.
 */
export default function InstallPwaButton() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone = isStandalone(
      navigator as { standalone?: boolean },
      window.matchMedia("(display-mode: standalone)").matches,
    );

    if (standalone) {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => setPromptEvent(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!promptEvent) {
    return null;
  }

  const install = async () => {
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <button
      type="button"
      onClick={install}
      className="w-9 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
      aria-label="Install Think Twice"
    >
      <Download className="h-5 w-5" />
    </button>
  );
}

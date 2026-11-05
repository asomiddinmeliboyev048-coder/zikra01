"use client";

import { useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window { __zikraBIP?: BeforeInstallPromptEvent; }
}

/**
 * Registers the service worker and quietly captures the browser's native
 * install event. The visible install action lives on the landing page/button,
 * so users are not interrupted by a surprise banner.
 */
export default function PWAInstall() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handler = (event: Event) => {
      event.preventDefault();
      window.__zikraBIP = event as BeforeInstallPromptEvent;
    };
    const installed = () => { window.__zikraBIP = undefined; };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  return null;
}

"use client";

import { useEffect, useState } from "react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export default function PWAInstall() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (localStorage.getItem("zikra-pwa-dismissed") === "1") return;

    // Allaqachon o'rnatilgan bo'lsa ko'rsatmaymiz
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS
      window.navigator.standalone === true;
    if (standalone) return;

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      // Global saqlash — /download sahifasidagi tugmalar ham foydalanishi uchun
      (window as unknown as { __zikraBIP?: BIPEvent }).__zikraBIP = e as BIPEvent;
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS uchun beforeinstallprompt yo'q — qo'llanma bannerini ko'rsatamiz
    if (ios) setShow(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem("zikra-pwa-dismissed", "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (!show) return null;

  const isMobile = /android|iphone|ipad|ipod/i.test(
    typeof navigator !== "undefined" ? navigator.userAgent : ""
  );

  return (
    <div className="fixed inset-x-3 bottom-24 z-[58] mx-auto max-w-md rounded-2xl border border-brand-100 bg-white p-4 shadow-card-hover dark:border-gray-800 dark:bg-gray-900 sm:bottom-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
          Z
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Zikra ilovasini yuklab oling
          </p>
          {isIOS ? (
            <p className="mt-0.5 text-xs text-gray-500">
              Safari&apos;da <b>Ulashish</b> → <b>Bosh ekranga qo&apos;shish</b> ni bosing.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-gray-500">
              {isMobile ? "📱 Telefoningizga o'rnating" : "💻 Kompyuteringizga o'rnating"}
            </p>
          )}
        </div>
        <button onClick={dismiss} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      {!isIOS && deferred && (
        <button onClick={install} className="btn-primary mt-3 w-full">
          {isMobile ? "📱 O'rnatish" : "💻 O'rnatish"}
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

/* ============================================================
   TYPES
============================================================ */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
};

/* ============================================================
   INSTALL PWA BUTTON
============================================================ */

export default function InstallPWAButton({
  variant = "primary",
}: {
  variant?: "primary" | "outline";
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;

    const iOSDevice =
      /iPad|iPhone|iPod/.test(ua) &&
      !("MSStream" in window);

    setIsIOS(iOSDevice);

    const standalone =
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches ||
      // @ts-expect-error - iOS Safari specific
      window.navigator.standalone === true;

    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (
      e: Event
    ) => {
      e.preventDefault();
      setDeferredPrompt(
        e as BeforeInstallPromptEvent
      );
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    if (isIOS) {
      setShowIOSHint((prev) => !prev);
      return;
    }

    // Boshqa hollarda (allaqachon o'rnatilgan yoki
    // brauzer qo'llab-quvvatlamaydi)
    setShowIOSHint((prev) => !prev);
  };

  const buttonClass =
    variant === "primary" ? "btn-primary" : "btn-outline";

  if (isInstalled) {
    return (
      <span className="tag border-success/10 bg-success-50/80 px-5 py-3 text-sm font-semibold text-success-700">
        ✅ Ilova allaqachon o&apos;rnatilgan
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className={buttonClass}
      >
        📲 Ilovani yuklab olish
      </button>

      {showIOSHint && (
        <div
          className="
            absolute left-0 top-full z-20 mt-3
            w-72 max-w-[85vw]
            rounded-2xl border border-gray-100
            bg-white p-4
            text-left shadow-lg
          "
        >
          <p className="text-sm font-bold text-gray-900">
            {isIOS
              ? "iPhone / iPad uchun:"
              : "Ilovani o'rnatish"}
          </p>

          {isIOS ? (
            <ol className="mt-2 space-y-1.5 text-xs leading-5 text-gray-600">
              <li>
                1. Safari&apos;dagi{" "}
                <strong>Ulashish</strong> (⬆️)
                tugmasini bosing
              </li>
              <li>
                2. <strong>
                  &quot;Bosh ekranga qo&apos;shish&quot;
                </strong>{" "}
                ni tanlang
              </li>
              <li>3. &quot;Qo&apos;shish&quot;ni tasdiqlang</li>
            </ol>
          ) : (
            <p className="mt-2 text-xs leading-5 text-gray-600">
              O&apos;rnatish uchun Chrome yoki Edge
              brauzerida oching, so&apos;ng manzil
              satridagi o&apos;rnatish belgisini
              bosing.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowIOSHint(false)}
            className="mt-3 text-xs font-semibold text-gray-400 hover:text-gray-700"
          >
            Yopish
          </button>
        </div>
      )}
    </div>
  );
}

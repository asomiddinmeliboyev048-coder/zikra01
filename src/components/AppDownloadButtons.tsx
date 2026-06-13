"use client";

/**
 * Ilovani yuklab olish tugmalari — Google Play, App Store va Android APK.
 * Hozircha veb-ilova (PWA) sifatida ishlaydi; "O'rnatish" tugmasi
 * brauzerning "Bosh ekranga qo'shish" oynasini chaqiradi (qo'llab-quvvatlasa).
 */

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

// Store havolalari — real havolalar tayyor bo'lganda shu yerda yangilanadi.
const PLAY_STORE_URL = "#";
const APP_STORE_URL = "#";

export default function AppDownloadButtons({
  vertical = false,
}: {
  vertical?: boolean;
}) {
  async function installPWA() {
    // beforeinstallprompt PWAInstall komponentida ushlanadi; bu yerda
    // global saqlangan event bo'lsa undan foydalanamiz.
    const w = window as unknown as { __zikraBIP?: BIPEvent };
    if (w.__zikraBIP) {
      await w.__zikraBIP.prompt();
      await w.__zikraBIP.userChoice;
      w.__zikraBIP = undefined;
    } else {
      alert(
        "Ilovani o'rnatish uchun brauzer menyusidan \"Bosh ekranga qo'shish\" ni tanlang."
      );
    }
  }

  return (
    <div
      className={
        vertical
          ? "flex flex-col gap-3"
          : "flex flex-wrap items-center gap-3"
      }
    >
      {/* Google Play */}
      <a
        href={PLAY_STORE_URL}
        onClick={(e) => {
          if (PLAY_STORE_URL === "#") {
            e.preventDefault();
            installPWA();
          }
        }}
        className="flex min-h-[52px] items-center gap-3 rounded-xl bg-gray-900 px-4 py-2.5 text-white transition hover:bg-black"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M3.6 2.3 13 11.7l-2.5 2.5L3.6 2.3zM4 21.7 10.5 12 4 2.3c-.3.2-.5.6-.5 1v17.4c0 .4.2.8.5 1zm9-7.5L15.6 12 13 9.4l-7.4 11.5L13 14.2zm3.7-3.7-2.4-1.4L14.5 12l1.8 1.6 2.4-1.4c.7-.4.7-1.4 0-1.8z" />
        </svg>
        <span className="text-left leading-tight">
          <span className="block text-[10px] opacity-80">Yuklab olish</span>
          <span className="block text-sm font-semibold">Google Play</span>
        </span>
      </a>

      {/* App Store */}
      <a
        href={APP_STORE_URL}
        onClick={(e) => {
          if (APP_STORE_URL === "#") {
            e.preventDefault();
            installPWA();
          }
        }}
        className="flex min-h-[52px] items-center gap-3 rounded-xl bg-gray-900 px-4 py-2.5 text-white transition hover:bg-black"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M16.4 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.7-3.1.7-.6 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2-1.5 2.5-.4 6.3 1 8.3.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.6 1.1 0 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4-.1 0-2.1-.8-2.2-3.1zM14.3 5.3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 2-.5 2.5-1.2z" />
        </svg>
        <span className="text-left leading-tight">
          <span className="block text-[10px] opacity-80">Yuklab olish</span>
          <span className="block text-sm font-semibold">App Store</span>
        </span>
      </a>

      {/* PWA o'rnatish */}
      <button
        type="button"
        onClick={installPWA}
        className="flex min-h-[52px] items-center gap-2 rounded-xl border border-brand bg-white px-4 py-2.5 font-semibold text-brand transition hover:bg-brand-50"
      >
        <span className="text-lg">📲</span>
        <span className="text-sm">Veb-ilovani o&apos;rnatish</span>
      </button>
    </div>
  );
}

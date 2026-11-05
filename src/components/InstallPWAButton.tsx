"use client";

import { useEffect, useState } from "react";
import { Download, QrCode, Smartphone, X, MonitorDown, Share2 } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __zikraBIP?: BeforeInstallPromptEvent;
  }
}

export default function InstallPWAButton({
  variant = "primary",
}: {
  variant?: "primary" | "outline";
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  const [installUrl, setInstallUrl] = useState("");

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/i.test(ua) && !("MSStream" in window));
    setInstallUrl(window.location.origin);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      navigator.standalone === true;
    setIsInstalled(standalone);

    const existing = window.__zikraBIP;
    if (existing) setDeferredPrompt(existing);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      window.__zikraBIP = promptEvent;
      setDeferredPrompt(promptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__zikraBIP = undefined;
      setOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    const promptEvent = deferredPrompt || window.__zikraBIP;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          setOpen(false);
          setDeferredPrompt(null);
          window.__zikraBIP = undefined;
        }
      } catch {
        setOpen(true);
      }
      return;
    }
    setOpen(true);
  }

  const buttonClass =
    variant === "primary"
      ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800"
      : "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15";

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100">
        <Download className="h-4 w-4" /> Ilova o'rnatilgan
      </span>
    );
  }

  return (
    <>
      <button type="button" onClick={handleInstall} className={buttonClass}>
        <Download className="h-4 w-4" /> Ilovani yuklab olish
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="zikra-install-title" className="relative w-full max-w-md rounded-[2rem] border border-emerald-100/15 bg-[#10251f] p-6 text-white shadow-2xl sm:p-8" onClick={(e) => e.stopPropagation()}>
            <button type="button" aria-label="Yopish" onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-[#09221b]">Z</div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-emerald-300">Zikra · PWA</p>
            <h2 id="zikra-install-title" className="mt-2 text-2xl font-semibold tracking-tight">Zikra ilovasini o'rnating</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">Zikra'ni bosh ekranga qo'shing va unga alohida ilova kabi tez kiring.</p>

            {deferredPrompt ? (
              <button type="button" onClick={handleInstall} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-4 text-sm font-extrabold text-[#09221b] transition hover:bg-emerald-300">
                <Download className="h-4 w-4" /> Hozir o'rnatish
              </button>
            ) : (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.05] p-4">
                {isIOS ? (
                  <>
                    <p className="flex items-center gap-2 text-sm font-bold"><Share2 className="h-4 w-4 text-emerald-300" /> iPhone / iPad</p>
                    <p className="mt-2 text-xs leading-5 text-white/70">Safari pastidagi <b>Ulashish</b> tugmasini bosing, so'ng <b>“Bosh ekranga qo'shish”</b>ni tanlang.</p>
                  </>
                ) : (
                  <>
                    <p className="flex items-center gap-2 text-sm font-bold"><Smartphone className="h-4 w-4 text-emerald-300" /> Android telefon</p>
                    <p className="mt-2 text-xs leading-5 text-white/70">Chrome brauzerida ochilgan bo'lsa, brauzer menyusidan <b>“Ilovani o'rnatish”</b> yoki <b>“Bosh ekranga qo'shish”</b> bandini tanlang.</p>
                    <p className="mt-3 flex items-center gap-2 text-xs text-white/55"><MonitorDown className="h-4 w-4" /> Kompyuterda Chrome yoki Edge orqali ham o'rnatish mumkin.</p>
                  </>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white p-4 text-[#18352d]">
              {installUrl && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=156x156&margin=8&data=${encodeURIComponent(installUrl)}`}
                  alt="Zikra saytini ochish uchun QR kod"
                  width={116}
                  height={116}
                  className="h-[116px] w-[116px] rounded-lg"
                />
              )}
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-bold"><QrCode className="h-4 w-4" /> QR-kodni skanerlang</p>
                <p className="mt-1 text-xs leading-5 text-[#60736e]">Boshqa qurilmada kamerani ochib, QR-kod orqali Zikra'ga o'ting.</p>
                <p className="mt-2 break-all text-[10px] text-[#83938d]">{installUrl}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

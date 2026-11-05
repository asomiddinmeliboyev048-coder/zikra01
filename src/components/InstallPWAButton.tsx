"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X, Share2 } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window { __zikraBIP?: BeforeInstallPromptEvent; }
}

export default function InstallPWAButton({ variant = "primary" }: { variant?: "primary" | "outline" }) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/i.test(navigator.userAgent) && !("MSStream" in window);
    setIos(isIOSDevice);
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari standalone property
      navigator.standalone === true;
    setInstalled(standalone);
    if (window.__zikraBIP) setPromptEvent(window.__zikraBIP);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      const e = event as BeforeInstallPromptEvent;
      window.__zikraBIP = e;
      setPromptEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      window.__zikraBIP = undefined;
      setShowIOSHelp(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installNow() {
    const e = promptEvent || window.__zikraBIP;
    if (e) {
      try {
        await e.prompt();
        const result = await e.userChoice;
        if (result.outcome === "accepted" || result.outcome === "dismissed") {
          setPromptEvent(null);
          window.__zikraBIP = undefined;
        }
      } catch {
        // The browser owns the native install UI; no fake success is shown.
      }
      return;
    }
    if (ios) setShowIOSHelp(true);
  }

  const buttonClass = variant === "primary"
    ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800"
    : "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15";

  if (installed) return <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100"> <Download className="h-4 w-4" /> Ilova o'rnatilgan</span>;

  return (
    <>
      <button type="button" onClick={installNow} className={buttonClass}>
        <Download className="h-4 w-4" /> Ilovani o'rnatish
      </button>
      {showIOSHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={() => setShowIOSHelp(false)}>
          <div role="dialog" aria-modal="true" className="relative w-full max-w-sm rounded-3xl bg-[#10251f] p-6 text-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <button type="button" aria-label="Yopish" onClick={() => setShowIOSHelp(false)} className="absolute right-4 top-4 rounded-full p-2 text-white/60 hover:bg-white/10"><X className="h-5 w-5" /></button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-[#09221b]">Z</div>
            <h2 className="mt-5 text-xl font-bold">Zikra yorlig'ini yaratish</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">Safari pastidagi <b>Ulashish</b> tugmasini bosing, keyin <b>“Bosh ekranga qo'shish”</b>ni tanlang. So'ng <b>Qo'shish</b>ni bosing.</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-emerald-200"><Share2 className="h-4 w-4" /> iPhone va iPad uchun Safari</div>
          </div>
        </div>
      )}
    </>
  );
}

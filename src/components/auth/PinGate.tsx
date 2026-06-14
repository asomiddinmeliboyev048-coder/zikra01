"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resetAccountPinAction } from "@/app/actions/account";
import PinLock from "./PinLock";
import {
  clearPin,
  getPinLength,
  isExpired,
  isPinEnabled,
  setPin,
  touchActive,
  verifyPin,
  PIN_SETUP_DISMISSED_KEY,
} from "@/lib/pin";

type Screen = "none" | "locked" | "setup" | "confirm";

/**
 * PinGate — butun ilova bo'ylab PIN himoyasi va auto-login boshqaruvi.
 * - Auto-login: Supabase session avtomatik yangilanadi (startAutoRefresh).
 * - PIN: ilova ochilganda yoki 30 daqiqa fon'da turgandan keyin so'raladi.
 * Root layout ichida bir marta o'rnatiladi.
 */
export default function PinGate() {
  const [authed, setAuthed] = useState(false);
  const [screen, setScreen] = useState<Screen>("none");
  const [length, setLength] = useState(4);
  const [error, setError] = useState("");
  const [reset, setReset] = useState(0);
  const [askSetup, setAskSetup] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [confirmForgot, setConfirmForgot] = useState(false);
  const [resetting, setResetting] = useState(false);
  const firstPinRef = useRef<string>("");

  const bump = () => setReset((r) => r + 1);

  // --- Auto-login + boshlang'ich PIN holati ---
  useEffect(() => {
    const supabase = createClient();
    // Token avtomatik yangilanishini ta'minlash (doim kirgan holatda qolish)
    supabase.auth.startAutoRefresh();

    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const user = data.user;
      setAuthed(!!user);
      if (user && isPinEnabled()) {
        setLength(getPinLength());
        setScreen("locked"); // ilova ochilganda har doim qulflanadi
      } else if (
        user &&
        !isPinEnabled() &&
        localStorage.getItem(PIN_SETUP_DISMISSED_KEY) !== "1"
      ) {
        setAskSetup(true); // birinchi kirganda PIN o'rnatish taklifi
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const loggedIn = !!session?.user;
      setAuthed(loggedIn);
      if (event === "SIGNED_OUT") {
        setScreen("none");
        setAskSetup(false);
      }
      if (event === "SIGNED_IN" && loggedIn) {
        if (isPinEnabled()) {
          setLength(getPinLength());
          setScreen("locked");
        } else if (localStorage.getItem(PIN_SETUP_DISMISSED_KEY) !== "1") {
          setAskSetup(true);
        }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // --- Fon ga tushish / qaytishni kuzatish (30 daqiqalik timeout) ---
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        // Tark etgan vaqtni belgilaymiz
        if (isPinEnabled()) touchActive();
      } else {
        // Qaytdik — 30 daqiqadan ko'p o'tgan bo'lsa qayta qulflaymiz
        if (authed && isPinEnabled() && isExpired()) {
          setLength(getPinLength());
          setScreen("locked");
        }
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [authed]);

  // --- Boshqa joydan (masalan menyu) PIN o'rnatishni ishga tushirish ---
  useEffect(() => {
    function trigger() {
      setError("");
      firstPinRef.current = "";
      setAskSetup(false);
      setScreen("setup");
    }
    window.addEventListener("zikra:setup-pin", trigger);
    return () => window.removeEventListener("zikra:setup-pin", trigger);
  }, []);

  // --- Qulfni ochish (PIN tekshirish) ---
  const handleUnlock = useCallback(async (pin: string) => {
    const ok = await verifyPin(pin);
    if (ok) {
      touchActive();
      setError("");
      setAttempts(0);
      setScreen("none");
    } else {
      setAttempts((a) => a + 1);
      setError("Noto'g'ri PIN. Qayta urinib ko'ring.");
      bump();
    }
  }, []);

  // --- Sozlash: birinchi kiritish ---
  const handleSetupFirst = useCallback((pin: string) => {
    firstPinRef.current = pin;
    setError("");
    setScreen("confirm");
    bump();
  }, []);

  // --- Sozlash: tasdiqlash ---
  const handleConfirm = useCallback(async (pin: string) => {
    if (pin !== firstPinRef.current) {
      setError("PIN kodlar mos kelmadi. Qaytadan urinib ko'ring.");
      firstPinRef.current = "";
      setScreen("setup");
      bump();
      return;
    }
    await setPin(pin);
    setError("");
    setScreen("none");
  }, []);

  // --- PIN ni unutdim → avval tasdiqlash so'raymiz ---
  const handleForgot = useCallback(() => {
    setConfirmForgot(true);
  }, []);

  // --- PIN ni to'liq tiklash: server + lokal tozalanadi, so'ng signOut ---
  const doForgot = useCallback(async () => {
    setResetting(true);
    try {
      await resetAccountPinAction(); // serverdagi pin_code = NULL
    } catch {
      /* server xato bo'lsa ham davom etamiz */
    }
    clearPin(); // lokal qulfni tozalash
    const supabase = createClient();
    await supabase.auth.signOut();
    // Qayta kirgandan so'ng /welcome'da yangi PIN o'rnatadi
    window.location.href = "/login";
  }, []);

  function dismissSetup() {
    localStorage.setItem(PIN_SETUP_DISMISSED_KEY, "1");
    setAskSetup(false);
  }

  // ---- Render ----
  if (screen === "locked") {
    return (
      <>
        <PinLock
          title="PIN kodni kiriting"
          subtitle={
            attempts >= 3
              ? "Bir necha marta noto'g'ri kiritildi. PIN ni unutgan bo'lsangiz, pastdagi havoladan tiklang."
              : "Zikra'ga kirish uchun PIN kodingizni tasdiqlang."
          }
          length={length}
          error={error}
          resetSignal={reset}
          onComplete={handleUnlock}
          onForgot={handleForgot}
        />

        {/* PIN ni tiklashni tasdiqlash oynasi */}
        {confirmForgot && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-6 animate-fade-in">
            <div className="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 text-center shadow-card-hover dark:bg-gray-900">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-2xl">
                🔑
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                PIN ni tiklaysizmi?
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                PIN o&apos;chiriladi va siz tizimdan chiqasiz. Qayta kirgach,
                yangi PIN o&apos;ylab topishingiz kerak bo&apos;ladi.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setConfirmForgot(false)}
                  disabled={resetting}
                  className="btn-ghost flex-1"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={doForgot}
                  disabled={resetting}
                  className="btn-primary flex-1 bg-accent hover:bg-accent-600"
                >
                  {resetting ? "Tiklanmoqda..." : "Ha, tiklash"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (screen === "setup") {
    return (
      <PinLock
        title="PIN kod o'rnatish"
        subtitle="Ilovani himoyalash uchun yangi PIN kod yarating."
        length={length}
        error={error}
        resetSignal={reset}
        showLengthToggle
        onLengthChange={(n) => {
          setLength(n);
          setError("");
        }}
        onComplete={handleSetupFirst}
      />
    );
  }

  if (screen === "confirm") {
    return (
      <PinLock
        title="PIN kodni tasdiqlang"
        subtitle="Xuddi shu PIN kodni qayta kiriting."
        length={length}
        error={error}
        resetSignal={reset}
        onComplete={handleConfirm}
      />
    );
  }

  // PIN o'rnatish taklifi (kichik banner)
  if (askSetup && authed) {
    return (
      <div className="fixed inset-x-3 bottom-24 z-[59] mx-auto max-w-md rounded-2xl border border-brand-100 bg-white p-4 shadow-card-hover dark:border-gray-800 dark:bg-gray-900 sm:bottom-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-lg text-white">
            🔒
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              PIN kod bilan himoyalang
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Hisobingizni qo&apos;shimcha himoya uchun 4 yoki 6 raqamli PIN bilan
              qulflang.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setError("");
                  firstPinRef.current = "";
                  setAskSetup(false);
                  setScreen("setup");
                }}
                className="btn-primary px-3 py-1.5 text-xs"
              >
                O&apos;rnatish
              </button>
              <button onClick={dismissSetup} className="btn-ghost px-3 py-1.5 text-xs">
                Keyinroq
              </button>
            </div>
          </div>
          <button onClick={dismissSetup} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
      </div>
    );
  }

  return null;
}

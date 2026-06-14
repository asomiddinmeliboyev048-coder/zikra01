"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PinLock from "@/components/auth/PinLock";
import { setupAccountPinAction } from "@/app/actions/account";
import { setPin as setLocalPin } from "@/lib/pin";

type Step = "intro" | "setup" | "confirm" | "saving";

/**
 * Welcome oqimi:
 *  intro  → tabriklash + tushuntirish
 *  setup  → 6 xonali PIN o'ylab topish
 *  confirm→ PIN'ni tasdiqlash
 *  saving → serverga (profiles.pin_code) + lokal qulfga (PinGate) saqlash
 */
export default function WelcomeClient({
  onboarded,
  name,
}: {
  onboarded: boolean;
  name: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [error, setError] = useState("");
  const [reset, setReset] = useState(0);
  const firstPinRef = useRef("");

  const next = onboarded ? "/discovery" : "/onboarding";
  const bump = () => setReset((r) => r + 1);

  function handleFirst(pin: string) {
    firstPinRef.current = pin;
    setError("");
    setStep("confirm");
    bump();
  }

  async function handleConfirm(pin: string) {
    if (pin !== firstPinRef.current) {
      setError("PIN kodlar mos kelmadi. Qaytadan urinib ko'ring.");
      firstPinRef.current = "";
      setStep("setup");
      bump();
      return;
    }
    setStep("saving");
    // 1) Serverga saqlash (profiles.pin_code = SHA-256 hash)
    const res = await setupAccountPinAction(pin);
    if (res.error) {
      setError(res.error);
      firstPinRef.current = "";
      setStep("setup");
      bump();
      return;
    }
    // 2) Lokal qulfni yoqish — keyingi safar ilova ochilganda PIN so'raydi (PinGate)
    await setLocalPin(pin);
    // 3) Keyingi bosqich
    router.replace(next);
  }

  // --- PIN o'rnatish bosqichi ---
  if (step === "setup") {
    return (
      <PinLock
        title="6 xonali PIN o'ylab toping"
        subtitle="Bu PIN keyingi safar ilovaga tez va xavfsiz kirish uchun ishlatiladi."
        length={6}
        error={error}
        resetSignal={reset}
        onComplete={handleFirst}
      />
    );
  }

  // --- Tasdiqlash bosqichi ---
  if (step === "confirm") {
    return (
      <PinLock
        title="PIN kodni tasdiqlang"
        subtitle="Xuddi shu 6 xonali PIN kodni qayta kiriting."
        length={6}
        error={error}
        resetSignal={reset}
        onComplete={handleConfirm}
      />
    );
  }

  // --- Saqlanmoqda ---
  if (step === "saving") {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-[#0e1525]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">PIN saqlanmoqda...</p>
      </div>
    );
  }

  // --- Intro / tabriklash ---
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50/60 to-white px-6 py-12 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-md animate-scale-in text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-brand-700 text-4xl shadow-card-hover">
          🎉
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
          Tabriklaymiz{name ? `, ${name.split(" ")[0]}` : ""}!
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Google orqali muvaffaqiyatli ro&apos;yxatdan o&apos;tdingiz! Endi
          hisobingizga kelgusi safar tez va xavfsiz kirish uchun{" "}
          <span className="font-semibold text-brand">6 xonali PIN-kod</span>{" "}
          o&apos;ylab toping.
        </p>

        <div className="mt-6 rounded-2xl border border-brand-100 bg-white/70 p-4 text-left text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          <p className="flex items-center gap-2">
            <span>🔒</span> PIN qurilmangizda xavfsiz (hash) saqlanadi.
          </p>
          <p className="mt-2 flex items-center gap-2">
            <span>⚡</span> Keyingi safar parol kerak emas — faqat PIN.
          </p>
        </div>

        <button
          onClick={() => {
            setError("");
            setStep("setup");
          }}
          className="btn-primary mt-8 w-full"
        >
          PIN o&apos;rnatish →
        </button>
      </div>
    </main>
  );
}

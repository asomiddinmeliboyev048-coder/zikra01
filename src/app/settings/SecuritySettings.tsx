"use client";

import { useEffect, useRef, useState } from "react";
import PinLock from "@/components/auth/PinLock";
import {
  isPinEnabled,
  getPinLength,
  setPin as setLocalPin,
  clearPin,
  verifyPin,
} from "@/lib/pin";
import {
  isBiometricSupported,
  isBiometricEnabled,
  registerBiometric,
  clearBiometric,
} from "@/lib/biometric";
import {
  setupAccountPinAction,
  resetAccountPinAction,
} from "@/app/actions/account";

type Purpose = "set" | "change" | "remove";
type Step = "verify" | "new" | "confirm";

export default function SecuritySettings({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // PIN oqimi (overlay)
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [step, setStep] = useState<Step>("verify");
  const [error, setError] = useState("");
  const [reset, setReset] = useState(0);
  const firstPinRef = useRef("");
  const bump = () => setReset((r) => r + 1);

  useEffect(() => {
    setPinEnabled(isPinEnabled());
    setBioEnabled(isBiometricEnabled());
    isBiometricSupported().then(setBioSupported);
  }, []);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  }

  // --- PIN oqimini boshlash ---
  function startSet() {
    setPurpose("set");
    setStep("new");
    setError("");
    firstPinRef.current = "";
    bump();
  }
  function startChange() {
    setPurpose("change");
    setStep("verify");
    setError("");
    firstPinRef.current = "";
    bump();
  }
  function startRemove() {
    setPurpose("remove");
    setStep("verify");
    setError("");
    bump();
  }
  function closeFlow() {
    setPurpose(null);
    setError("");
    firstPinRef.current = "";
  }

  async function handleComplete(pin: string) {
    if (step === "verify") {
      const ok = await verifyPin(pin);
      if (!ok) {
        setError("Joriy PIN noto'g'ri.");
        bump();
        return;
      }
      if (purpose === "remove") {
        // PINni o'chirish: server + lokal
        setBusy(true);
        await resetAccountPinAction();
        clearPin();
        clearBiometric(); // PIN o'chsa biometrik ham mantiqan o'chiriladi
        setBusy(false);
        setPinEnabled(false);
        setBioEnabled(false);
        closeFlow();
        flash("PIN o'chirildi.");
        return;
      }
      // change → yangi PIN
      setStep("new");
      setError("");
      bump();
      return;
    }

    if (step === "new") {
      firstPinRef.current = pin;
      setStep("confirm");
      setError("");
      bump();
      return;
    }

    if (step === "confirm") {
      if (pin !== firstPinRef.current) {
        setError("PIN kodlar mos kelmadi.");
        setStep("new");
        firstPinRef.current = "";
        bump();
        return;
      }
      setBusy(true);
      const res = await setupAccountPinAction(pin); // server (hash) + last_login
      if (res.error) {
        setBusy(false);
        setError(res.error);
        bump();
        return;
      }
      await setLocalPin(pin); // lokal qulf
      setBusy(false);
      setPinEnabled(true);
      closeFlow();
      flash(purpose === "set" ? "PIN o'rnatildi." : "PIN o'zgartirildi.");
    }
  }

  // --- Biometrik ---
  async function toggleBiometric() {
    if (bioEnabled) {
      clearBiometric();
      setBioEnabled(false);
      flash("Biometrik o'chirildi.");
      return;
    }
    setBusy(true);
    try {
      const ok = await registerBiometric(userId, userName);
      setBioEnabled(ok);
      flash(
        ok
          ? "Biometrik yoqildi."
          : "Biometrikni yoqib bo'lmadi (qurilma qo'llab-quvvatlamaydi)."
      );
    } catch {
      flash("Biometrik bekor qilindi.");
    } finally {
      setBusy(false);
    }
  }

  const flowTitle =
    step === "verify"
      ? "Joriy PIN kodni kiriting"
      : step === "new"
      ? "Yangi 6 xonali PIN"
      : "Yangi PIN kodni tasdiqlang";
  const flowLen = step === "verify" ? getPinLength() : 6;

  return (
    <div className="space-y-6">
      {msg && (
        <div className="animate-fade-in rounded-xl bg-success-50 px-4 py-3 text-sm font-medium text-success-700">
          {msg}
        </div>
      )}

      {/* PIN kod */}
      <section className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span>🔒</span> PIN kod
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {pinEnabled
                ? "PIN yoqilgan. Ilova ochilganda yoki 30 daqiqa fon'da turgach so'raladi."
                : "Hisobingizni 6 xonali PIN bilan himoyalang."}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              pinEnabled
                ? "bg-success-50 text-success-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {pinEnabled ? "Yoqilgan" : "O'chiq"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {pinEnabled ? (
            <>
              <button onClick={startChange} disabled={busy} className="btn-outline">
                PINni o&apos;zgartirish
              </button>
              <button
                onClick={startRemove}
                disabled={busy}
                className="btn-ghost text-accent"
              >
                PINni o&apos;chirish
              </button>
            </>
          ) : (
            <button onClick={startSet} disabled={busy} className="btn-primary">
              PIN o&apos;rnatish
            </button>
          )}
        </div>
      </section>

      {/* Biometrik */}
      <section className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span>🫆</span> Biometrik (Face ID / Barmoq izi)
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {!bioSupported
                ? "Bu qurilma biometrikni qo'llab-quvvatlamaydi."
                : !pinEnabled
                ? "Avval PIN o'rnating, so'ng biometrikni yoqishingiz mumkin."
                : "Qulfni barmoq izi yoki yuz orqali tez oching."}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              bioEnabled
                ? "bg-success-50 text-success-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {bioEnabled ? "Yoqilgan" : "O'chiq"}
          </span>
        </div>

        <div className="mt-4">
          <button
            onClick={toggleBiometric}
            disabled={busy || !bioSupported || !pinEnabled}
            className={bioEnabled ? "btn-ghost text-accent" : "btn-primary"}
          >
            {bioEnabled ? "Biometrikni o'chirish" : "Biometrikni yoqish"}
          </button>
        </div>
      </section>

      {/* PIN kiritish overlay */}
      {purpose && (
        <PinLock
          title={flowTitle}
          subtitle={busy ? "Saqlanmoqda..." : undefined}
          length={flowLen}
          error={error}
          resetSignal={reset}
          onComplete={handleComplete}
          onClose={closeFlow}
        />
      )}
    </div>
  );
}

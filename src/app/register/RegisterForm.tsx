"use client";

import { useActionState, useRef, useState } from "react";
import { signUpAction, type AuthState } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";
import { CERTIFICATE_ACCEPT, isValidCertificate } from "@/lib/storage";

const initial: AuthState = {};

export default function RegisterForm() {
  const [state, formAction] = useActionState(signUpAction, initial);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [certName, setCertName] = useState<string | null>(null);
  const [certError, setCertError] = useState<string | null>(null);

  function onCertChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCertError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setCertName(null);
      return;
    }
    if (!isValidCertificate(file)) {
      setCertError("Faqat JPG, PNG yoki PDF fayl yuklash mumkin.");
      setCertName(null);
      e.target.value = "";
      return;
    }
    // 10MB chegara
    if (file.size > 10 * 1024 * 1024) {
      setCertError("Fayl hajmi 10MB dan oshmasligi kerak.");
      setCertName(null);
      e.target.value = "";
      return;
    }
    setCertName(file.name);
  }

  function clearCert() {
    setCertName(null);
    setCertError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="label">
          Ismingiz
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          placeholder="Masalan: Asomiddin"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="siz@example.com"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Parol
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Kamida 6 ta belgi"
          className="input"
        />
      </div>

      {/* Ixtiyoriy: sertifikat yuklash */}
      <div>
        <label htmlFor="certificate" className="label">
          O&apos;rgata oladigan faningiz bo&apos;yicha sertifikatingiz bormi?{" "}
          <span className="font-normal text-gray-400">(Ixtiyoriy)</span>
        </label>

        <input
          ref={fileInputRef}
          id="certificate"
          name="certificate"
          type="file"
          accept={CERTIFICATE_ACCEPT}
          onChange={onCertChange}
          className="sr-only"
        />

        {!certName ? (
          <label
            htmlFor="certificate"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 transition hover:border-brand hover:text-brand"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Sertifikat yuklash (JPG, PNG yoki PDF)
          </label>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-success-100 bg-success-50 px-4 py-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-success-700">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="truncate">{certName}</span>
            </span>
            <button
              type="button"
              onClick={clearCert}
              className="shrink-0 text-xs font-medium text-gray-400 hover:text-accent-700"
            >
              O&apos;chirish
            </button>
          </div>
        )}

        {certError && (
          <p className="mt-1.5 text-xs text-accent-700">{certError}</p>
        )}
        <p className="mt-1.5 text-xs text-gray-400">
          Sertifikat yuklasangiz, profilingizda ishonch belgisi ko&apos;rinadi.
        </p>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Ro'yxatdan o'tilmoqda...">
        Ro&apos;yxatdan o&apos;tish
      </SubmitButton>
    </form>
  );
}

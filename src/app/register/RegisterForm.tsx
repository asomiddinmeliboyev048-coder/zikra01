"use client";

import { useActionState } from "react";
import { signUpAction, type AuthState } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";

const initial: AuthState = {};

export default function RegisterForm() {
  const [state, formAction] = useActionState(signUpAction, initial);

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

      {/* Sertifikat keyingi bosqichda (profil to'ldirishda) yuklanadi */}
      <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
        📜 O&apos;rgata oladigan faningiz bo&apos;yicha sertifikatingiz
        bo&apos;lsa, keyingi bosqichda (profil to&apos;ldirishda) yoki istalgan
        vaqtda profilingizdan yuklashingiz mumkin.
      </p>

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

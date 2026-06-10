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

      {state?.error && (
        <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Ro'yxatdan o'tilmoqda...">
        Ro'yxatdan o'tish
      </SubmitButton>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signInAction, type AuthState } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";

const initial: AuthState = {};

export default function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initial);
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/discovery";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirect} />

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
          placeholder="Parolingiz"
          className="input"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Kirilmoqda...">Kirish</SubmitButton>
    </form>
  );
}

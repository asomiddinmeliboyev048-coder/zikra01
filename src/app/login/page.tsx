import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import Logo from "@/components/Logo";
import GoogleButton from "@/components/GoogleButton";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Kirish" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-success-50 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Xush kelibsiz!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Hisobingizga kiring va o'rganishni davom ettiring.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            yoki
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <GoogleButton label="Google orqali kirish" />

          <p className="mt-6 text-center text-sm text-gray-500">
            Hisobingiz yo'qmi?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand hover:underline"
            >
              Ro'yxatdan o'tish
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

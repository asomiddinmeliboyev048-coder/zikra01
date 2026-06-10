import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/Logo";
import GoogleButton from "@/components/GoogleButton";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Ro'yxatdan o'tish" };

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-success-50 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Zikra'ga qo'shiling
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Bilim qoldiring, tajriba oling — bepul.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <RegisterForm />

          <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            yoki
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <GoogleButton label="Google orqali davom etish" />

          <p className="mt-6 text-center text-sm text-gray-500">
            Hisobingiz bormi?{" "}
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

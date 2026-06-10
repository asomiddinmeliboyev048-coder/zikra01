"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="text-5xl">😕</span>
      <h1 className="text-xl font-bold text-gray-900">Nimadir noto&apos;g&apos;ri ketdi</h1>
      <p className="max-w-md text-sm text-gray-500">
        Kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko&apos;ring.
      </p>
      <button onClick={reset} className="btn-primary">
        Qaytadan urinish
      </button>
    </div>
  );
}

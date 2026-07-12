"use client";

// ============================================================
// BannedScreen — bloklangan foydalanuvchi uchun "qora ekran"
// Butun ekran qora, qizil/oq matn bilan blok sanasi va sababi ko'rsatiladi.
// Foydalanuvchi hech narsa qila olmaydi — faqat Support'ga yoza oladi.
// ============================================================

import SupportWidget from "@/components/SupportWidget";

/** banned_until ni o'qiladigan sanaga aylantirish (null = doimiy) */
function formatBanDate(iso: string | null): string {
  if (!iso) return "cheksiz muddat";
  return new Date(iso).toLocaleString("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BannedScreen({
  userId,
  bannedUntil,
  reason,
}: {
  userId: string;
  bannedUntil: string | null; // null = doimiy blok
  reason: string | null;
}) {
  return (
    <>
      {/* Qora fon — butun ekranni qoplaydi, sayt ko'rinmaydi */}
      <div className="fixed inset-0 z-40 flex h-screen w-full flex-col items-center justify-center bg-black px-6 text-center">
        <div className="max-w-md">
          <div className="mb-6 text-6xl">🚫</div>

          <h1 className="mb-4 text-2xl font-bold text-red-500">
            Hisobingiz bloklangan
          </h1>

          {/* Asosiy matn: blokdan chiqish sanasi */}
          <p className="mb-3 text-lg leading-relaxed text-white">
            Sizning hisobingiz{" "}
            <span className="font-semibold text-red-400">
              {formatBanDate(bannedUntil)}
            </span>{" "}
            gacha bloklandi.
          </p>

          {/* Bloklash sababi (admin yozgan) */}
          {reason && (
            <p className="mb-6 text-base text-gray-300">
              Sababi:{" "}
              <span className="font-medium text-white">{reason}</span>
            </p>
          )}

          {/* Support'ga yo'naltiruvchi matn */}
          <p className="mb-6 text-sm leading-relaxed text-gray-400">
            Agar siz bloklanishingiz sababiga norozi bo&apos;lsangiz,
            qo&apos;llab-quvvatlash bo&apos;limiga yozing.
          </p>

          {/* Ko'k Support tugmasi — chat oynasini ochadi */}
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("zikra:open-support"))
            }
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
          >
            <span>💬</span> Qo&apos;llab-quvvatlashga yozish
          </button>
        </div>
      </div>

      {/* Support chat oynasi (z-[55]) qora fon (z-40) ustida ochiladi.
          Foydalanuvchi faqat shu orqali admin bilan bog'lana oladi. */}
      <SupportWidget userId={userId} />
    </>
  );
}

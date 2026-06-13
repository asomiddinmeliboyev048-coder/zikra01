import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import AppDownloadButtons from "@/components/AppDownloadButtons";

export const metadata: Metadata = {
  title: "Ilovani yuklab olish",
  description:
    "Zikra ilovasini telefoningizga yuklab oling — Android, iOS yoki veb-ilova (PWA) sifatida.",
};

const FEATURES = [
  { icon: "🔁", title: "O'zaro almashinuv", desc: "Bilim almashing — pul emas, ko'nikma valyuta." },
  { icon: "🎥", title: "Video darslar", desc: "O'z darslaringizni yuklang, boshqalardan o'rganing." },
  { icon: "💬", title: "Real-time suhbat", desc: "Hamkorlaringiz bilan tez va qulay muloqot qiling." },
  { icon: "🏆", title: "Gamifikatsiya", desc: "XP, darajalar, nishonlar va kunlik streak." },
  { icon: "🔒", title: "PIN himoyasi", desc: "Hisobingizni 4 yoki 6 raqamli PIN bilan qulflang." },
  { icon: "📴", title: "Offline rejim", desc: "Asosiy sahifalar internetsiz ham ochiladi (PWA)." },
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/60 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="container-app flex h-16 items-center justify-between">
          <Logo />
          <Link href="/" className="btn-ghost">
            ← Bosh sahifa
          </Link>
        </div>
      </header>

      <main className="container-app py-10 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Chap: matn + tugmalar */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm dark:bg-gray-800">
              📱 Telefon uchun
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Zikra ilovasini <span className="text-gradient">yuklab oling</span>
            </h1>
            <p className="mt-4 max-w-lg text-gray-600 dark:text-gray-300">
              Zikra'ni telefoningizga o&apos;rnating va bilim almashishni istalgan
              joyda davom ettiring. Android, iOS yoki to&apos;g&apos;ridan-to&apos;g&apos;ri
              brauzer orqali veb-ilova (PWA) sifatida.
            </p>

            <div className="mt-8">
              <AppDownloadButtons />
            </div>

            <p className="mt-4 text-xs text-gray-400">
              * Hozircha Zikra veb-ilova (PWA) ko&apos;rinishida ishlaydi. Store
              havolalari tayyor bo&apos;lishi bilan shu yerda yangilanadi.
            </p>
          </div>

          {/* O'ng: telefon ko'rinishi + QR */}
          <div className="flex flex-col items-center gap-6">
            {/* Telefon ramkasi (preview) */}
            <div className="relative mx-auto h-[460px] w-[230px] rounded-[2.5rem] border-[10px] border-gray-900 bg-white shadow-card-hover dark:bg-gray-800">
              <div className="absolute left-1/2 top-0 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-gray-900" />
              <div className="flex h-full flex-col overflow-hidden rounded-[1.7rem]">
                <div className="bg-gradient-to-br from-brand to-brand-700 px-4 pb-6 pt-8 text-white">
                  <p className="text-xs opacity-80">Xush kelibsiz</p>
                  <p className="text-lg font-bold">Zikra</p>
                </div>
                <div className="flex-1 space-y-2 p-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-xl bg-gray-100 p-2 dark:bg-gray-700"
                    >
                      <span className="h-8 w-8 rounded-full bg-brand/20" />
                      <span className="flex-1">
                        <span className="block h-2 w-2/3 rounded bg-gray-300 dark:bg-gray-600" />
                        <span className="mt-1 block h-2 w-1/3 rounded bg-gray-200 dark:bg-gray-600" />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-around border-t border-gray-100 py-2 text-lg dark:border-gray-700">
                  <span>🏠</span>
                  <span>🎥</span>
                  <span>💬</span>
                  <span>👤</span>
                </div>
              </div>
            </div>

            {/* QR kod (sayt manziliga) */}
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-card dark:border-gray-800 dark:bg-gray-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://zikra.uz/download"
                alt="Zikra yuklab olish QR kodi"
                width={120}
                height={120}
                className="h-28 w-28 rounded-lg"
              />
              <p className="text-xs text-gray-500">
                QR kodni skanerlab telefoningizda oching
              </p>
            </div>
          </div>
        </div>

        {/* Imkoniyatlar */}
        <section className="mt-16">
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            Ilova imkoniyatlari
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card p-6 transition hover:-translate-y-1 hover:shadow-card-hover"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

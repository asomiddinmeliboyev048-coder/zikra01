import type { Metadata } from "next";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import InstallPWAButton from "@/components/InstallPWAButton";

export const metadata: Metadata = {
  title: "Zikra — Learn. Teach. Be remembered.",
  description:
    "O'zbekistondagi birinchi bepul P2P ko'nikma almashish platformasi. Bilganingizni o'rgating, xohlagan ko'nikmangizni bepul o'rganing.",
};

/* ============================================================
   LANDING PAGE
============================================================ */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      <main>

        {/* ======================================================
            HERO
        ====================================================== */}

        <section className="container-app pt-10 sm:pt-16 lg:pt-20">

          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* LEFT — COPY */}

            <div>

              <span
                className="
                  inline-flex items-center gap-1.5
                  rounded-full border border-brand/20
                  bg-brand-50 px-3 py-1
                  text-xs font-bold uppercase tracking-wide
                  text-brand-700
                "
              >
                🇺🇿 O&apos;zbekistonda birinchi bepul P2P platforma
              </span>

              <h1
                className="
                  mt-5 text-4xl font-extrabold
                  leading-tight tracking-[-0.02em]
                  text-gray-950
                  sm:text-5xl lg:text-6xl
                "
              >
                Learn. Teach.
                <br />
                <span className="text-brand">Be remembered.</span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-gray-600 sm:text-lg">
                Zikra&apos;da bilim pul emas — almashinuv.
                Bilganingizni o&apos;rgating, xohlagan
                ko&apos;nikmangizni bepul o&apos;rganing.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">

                <Link
                  href="/register"
                  className="btn-primary px-6 py-3 text-base"
                >
                  Ro&apos;yxatdan o&apos;tish
                </Link>

                <InstallPWAButton variant="outline" />

              </div>

              <p className="mt-4 text-sm text-gray-400">
                Allaqachon a&apos;zomisiz?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-gray-700 hover:text-brand"
                >
                  Kirish
                </Link>
              </p>

            </div>

            {/* RIGHT — SIGNATURE VISUAL: PROFIL KARTASI MOCKUP */}

            <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto">

              {/* orqa fon dekoratsiyasi — brend ranglarida */}

              <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand/15 via-accent/10 to-transparent blur-2xl" />

              <div className="card p-6">

                <div className="flex items-center gap-4">

                  <div className="rounded-full bg-gradient-to-tr from-accent via-brand to-brand-700 p-[3px]">
                    <div className="rounded-full bg-white p-[3px]">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">
                        S
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-base font-bold text-gray-950">
                      Siz
                    </p>
                    <p className="text-xs text-gray-400">
                      @siznikida
                    </p>
                  </div>

                  <span className="ml-auto animate-pulse rounded-full bg-accent-50 px-2.5 py-1 text-xs font-bold text-accent-700">
                    🔥 7 kun
                  </span>

                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="tag-teach">🎓 Dizayn</span>
                  <span className="tag-learn">📚 Ingliz tili</span>
                </div>

                <div className="mt-5">

                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-500">
                      Daraja 3 — Ekspert
                    </span>
                    <span className="text-gray-400">
                      420 / 600 XP
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[70%] rounded-full bg-brand" />
                  </div>

                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center">

                  <div>
                    <p className="text-sm font-extrabold text-gray-950">12</p>
                    <p className="text-[10px] text-gray-400">Darslar</p>
                  </div>

                  <div>
                    <p className="text-sm font-extrabold text-gray-950">4.9</p>
                    <p className="text-[10px] text-gray-400">Reyting</p>
                  </div>

                  <div>
                    <p className="text-sm font-extrabold text-gray-950">6</p>
                    <p className="text-[10px] text-gray-400">Nishonlar</p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ======================================================
            PWA — ILOVANI O'RNATISH
        ====================================================== */}

        <section className="container-app mt-20 sm:mt-28">

          <div className="card p-6 sm:p-10">

            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">

              <div>

                <h2 className="text-2xl font-extrabold text-gray-950 sm:text-3xl">
                  Play Market&apos;siz — bir zumda o&apos;rnating
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-gray-500 sm:text-base">
                  Zikra — Progressive Web App. Do&apos;kondan
                  yuklab olishning hojati yo&apos;q: bir
                  tugma bosish bilan telefoningiz bosh
                  ekraniga qo&apos;shiladi.
                </p>

                <div className="mt-6">
                  <InstallPWAButton variant="primary" />
                </div>

              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">

                {[
                  {
                    icon: "⚡",
                    title: "Bir zumda o'rnatiladi",
                    desc: "Do'kon, ro'yxatdan o'tish yoki kutish yo'q.",
                  },
                  {
                    icon: "💾",
                    title: "Kam joy egallaydi",
                    desc: "Odatiy ilovadan o'nlab marta yengil.",
                  },
                  {
                    icon: "🚀",
                    title: "Tez ishlaydi",
                    desc: "Sekin internetda ham silliq ochiladi.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-gray-500">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}

              </div>

            </div>

          </div>

        </section>


        {/* ======================================================
            QANDAY ISHLAYDI
        ====================================================== */}

        <section className="container-app mt-20 sm:mt-28">

          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold text-gray-950 sm:text-3xl">
              Qanday ishlaydi?
            </h2>
            <p className="mt-3 text-sm text-gray-500 sm:text-base">
              Uch qadamda o&apos;rgatishni va o&apos;rganishni
              boshlang.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">

            {[
              {
                step: "01",
                title: "Profil yarating",
                desc: "Bilgan ko'nikmalaringizni belgilang va nimani o'rganmoqchi ekaningizni tanlang.",
              },
              {
                step: "02",
                title: "Bering va oling",
                desc: "Boshqalarga dars bering, o'zingiz xohlagan ko'nikmani bepul o'rganing.",
              },
              {
                step: "03",
                title: "Darajangizni oshiring",
                desc: "XP to'plang, sertifikat va nishonlarni qo'lga kiriting.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="card-hover p-6"
              >
                <span className="text-3xl font-extrabold text-gray-100">
                  {item.step}
                </span>

                <h3 className="mt-3 text-base font-bold text-gray-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {item.desc}
                </p>
              </div>
            ))}

          </div>

        </section>


        {/* ======================================================
            ASOSIY FUNKSIYALAR
        ====================================================== */}

        <section className="container-app mt-20 sm:mt-28">

          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold text-gray-950 sm:text-3xl">
              Bir ilovada — bilim, muloqot, o&apos;sish
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">

            {[
              {
                icon: "📚",
                title: "Video darslar",
                desc: "Har qanday ko'nikma bo'yicha qisqa va tushunarli darslar yozib qo'ying yoki tomosha qiling.",
              },
              {
                icon: "🎬",
                title: "Reels",
                desc: "Qisqa, bilim beruvchi videolar orqali tezkor maslahatlar ulashing.",
              },
              {
                icon: "💬",
                title: "Chat va obunachilar",
                desc: "O'qituvchi bilan to'g'ridan-to'g'ri yozishing, obuna bo'ling, jamoangizni kuzating.",
              },
              {
                icon: "🎯",
                title: "Gamifikatsiya",
                desc: "Har bir dars uchun XP oling, kunlik streak saqlang, Ekspert va Master darajasigacha o'sing.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="card-hover flex items-start gap-4 p-6"
              >
                <span
                  className="
                    flex h-11 w-11 shrink-0
                    items-center justify-center
                    rounded-2xl bg-brand-50
                    text-xl
                  "
                >
                  {item.icon}
                </span>

                <div>
                  <h3 className="text-base font-bold text-gray-950">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-gray-500">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}

          </div>

        </section>


        {/* ======================================================
            YAKUNIY CTA
        ====================================================== */}

        <section className="container-app mt-20 pb-20 sm:mt-28 sm:pb-28">

          <div
            className="
              overflow-hidden rounded-3xl
              bg-gradient-to-br from-brand via-brand-600 to-brand-800
              px-6 py-14 text-center shadow-premium
              sm:px-10 sm:py-20
            "
          >

            <h2 className="text-2xl font-extrabold text-white sm:text-4xl">
              Hoziroq qo&apos;shiling yoki ilovani
              <br className="hidden sm:block" />
              {" "}telefoningizga o&apos;rnating
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm text-white/80 sm:text-base">
              Ro&apos;yxatdan o&apos;tish bir daqiqa vaqt
              oladi — birinchi darsingizni bugun bering.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">

              <Link
                href="/register"
                className="
                  rounded-2xl bg-white px-6 py-3
                  text-base font-bold text-brand-700
                  shadow-sm transition
                  hover:bg-gray-50
                "
              >
                Ro&apos;yxatdan o&apos;tish
              </Link>

              <InstallPWAButton variant="outline" />

            </div>

          </div>

        </section>

      </main>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-gray-100 bg-white py-8">

        <div className="container-app flex flex-col items-center justify-between gap-4 text-sm text-gray-400 sm:flex-row">

          <p>© {new Date().getFullYear()} Zikra. Barcha huquqlar himoyalangan.</p>

          <div className="flex gap-5">
            <Link href="/login" className="hover:text-gray-700">
              Kirish
            </Link>
            <Link href="/register" className="hover:text-gray-700">
              Ro&apos;yxatdan o&apos;tish
            </Link>
          </div>

        </div>

      </footer>

    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { avatarFallback, cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

interface Props {
  profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    level: string;
    xp: number;
  } | null;
  unread: number;
}

const NAV = [
  { href: "/discovery", label: "Kashf etish" },
  { href: "/lessons", label: "Darslarim" },
  { href: "/videos", label: "Video darslar" },
  { href: "/reels", label: "Reels" },
  { href: "/chat", label: "Suhbatlar" },
];

export default function NavbarClient({ profile, unread }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!profile) {
    return (
      <nav className="flex items-center gap-2">
        <Link href="/login" className="btn-ghost">
          Kirish
        </Link>
        <Link href="/register" className="btn-primary">
          Boshlash
        </Link>
      </nav>
    );
  }

  return (
    <>
      {/* Desktop nav (faqat md+) */}
      <nav className="hidden items-center gap-1 md:flex">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-sm font-semibold tracking-[-0.01em] transition-all duration-300",
              pathname.startsWith(item.href)
                ? "border-brand/10 bg-brand-50/80 text-brand-700 shadow-[0_8px_22px_-16px_rgba(11,155,136,0.52)] dark:border-brand/20 dark:bg-brand/10 dark:text-brand-300"
                : "border-transparent text-gray-600 hover:-translate-y-0.5 hover:border-white/80 hover:bg-white/70 hover:text-brand hover:shadow-[0_10px_24px_-20px_rgba(8,63,59,0.38)] dark:hover:border-white/[0.06] dark:hover:bg-white/[0.05]"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* O'ng amallar guruhi — barcha ekran o'lchamlarida ko'rinadi, siqilmaydi */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />

        {/* Bildirishnomalar — HAR DOIM ko'rinadi (mobil ham) */}
        <Link
          href="/notifications"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-gray-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/15 hover:bg-white/80 hover:text-brand hover:shadow-glow active:translate-y-0 dark:hover:border-white/10 dark:hover:bg-white/[0.06]"
          aria-label="Bildirishnomalar"
        >
          <BellIcon />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-gradient-to-br from-accent to-accent-700 px-1 text-[9px] font-extrabold text-white shadow-[0_5px_14px_-5px_rgba(201,147,50,0.8)] dark:border-[#081715]">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {/* Avatar dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-2xl border border-transparent p-1 pr-1.5 transition-all duration-300 hover:border-brand/10 hover:bg-white/80 hover:shadow-[0_10px_28px_-20px_rgba(8,63,59,0.42)] sm:pr-2 dark:hover:border-white/10 dark:hover:bg-white/[0.06]"
          >
            <Image
              src={profile.avatar_url || avatarFallback(profile.full_name)}
              alt={profile.full_name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-xl object-cover shadow-sm ring-2 ring-white transition-transform duration-300 hover:scale-105 dark:ring-white/10"
              unoptimized
            />
            <span className="hidden text-sm font-medium text-gray-700 sm:block">
              {profile.full_name.split(" ")[0]}
            </span>
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-3 w-60 animate-scale-in overflow-hidden rounded-2xl border border-white/80 bg-white/90 py-1.5 shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#102824]/95">
                <div className="border-b border-gray-100/80 bg-gradient-to-br from-brand-50/70 to-transparent px-4 py-3.5 dark:border-white/10 dark:from-brand/10">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {profile.full_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profile.level} · {profile.xp} XP
                  </p>
                </div>
                <Link
                  href={`/profile/${profile.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50/70 hover:text-brand-700 dark:hover:bg-brand/10 dark:hover:text-brand-300"
                >
                  Mening profilim
                </Link>
                <Link
                  href="/onboarding"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50/70 hover:text-brand-700 dark:hover:bg-brand/10 dark:hover:text-brand-300"
                >
                  Profilni tahrirlash
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50/70 hover:text-brand-700 dark:hover:bg-brand/10 dark:hover:text-brand-300"
                >
                  🔒 PIN kod / Xavfsizlik
                </Link>
                <Link
                  href="/download"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50/70 hover:text-brand-700 dark:hover:bg-brand/10 dark:hover:text-brand-300"
                >
                  📱 Ilovani yuklab olish
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50/70 hover:text-brand-700 dark:hover:bg-brand/10 dark:hover:text-brand-300"
                >
                  ⚙️ Sozlamalar
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-accent transition-colors hover:bg-accent-50/80 dark:hover:bg-accent/10"
                  >
                    Chiqish
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

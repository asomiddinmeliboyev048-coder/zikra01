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
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              pathname.startsWith(item.href)
                ? "bg-brand-50 text-brand"
                : "text-gray-600 hover:bg-gray-100"
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
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label="Bildirishnomalar"
        >
          <BellIcon />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {/* Avatar dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl p-1 pr-1.5 hover:bg-gray-100 sm:pr-2"
          >
            <Image
              src={profile.avatar_url || avatarFallback(profile.full_name)}
              alt={profile.full_name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-cover"
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
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-card-hover">
                <div className="border-b border-gray-100 px-4 py-3">
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
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Mening profilim
                </Link>
                <Link
                  href="/onboarding"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Profilni tahrirlash
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  🔒 PIN kod / Xavfsizlik
                </Link>
                <Link
                  href="/download"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  📱 Ilovani yuklab olish
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  ⚙️ Sozlamalar
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="block w-full px-4 py-2 text-left text-sm text-accent hover:bg-accent-50"
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

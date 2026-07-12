"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Mobil qurilmalar uchun pastki navigatsiya paneli (faqat md dan kichik ekranlarda).
 * Har bir asosiy bo'lim alohida tugma sifatida pastda joylashadi.
 */
export default function BottomNav({
  profileId,
}: {
  profileId: string;
  unread?: number;
}) {
  const pathname = usePathname();

  // Tartib (chapdan o'ngga): Kashf · Darslar · [Reels — markazda] · Suhbat · Profil.
  // Reels 5 ta bo'limning aynan o'rtasida (index 2), Profil esa eng o'ngda turadi.
  const items: {
    href: string;
    label: string;
    icon: ({ active }: { active: boolean }) => ReactElement;
    center?: boolean;
  }[] = [
    { href: "/discovery", label: "Kashf", icon: DiscoverIcon },
    { href: "/lessons", label: "Darslar", icon: LessonsIcon },
    { href: "/reels", label: "Reels", icon: ReelsIcon, center: true },
    { href: "/chat", label: "Suhbat", icon: ChatIcon },
    { href: `/profile/${profileId}`, label: "Profil", icon: UserIcon },
  ];

  return (
    <nav className="zikra-bottom-nav fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {items.map((item) => {
        const active = item.href.startsWith("/profile")
          ? pathname.startsWith("/profile")
          : pathname.startsWith(item.href);
        const Icon = item.icon;

        // Markazdagi "Reels" tugmasi Instagram/TikTok uslubida ajralib turadi
        if (item.center) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium"
              aria-label={item.label}
            >
              <span
                className={cn(
                  "flex h-9 w-11 items-center justify-center rounded-xl transition",
                  active
                    ? "bg-brand text-white shadow-md"
                    : "bg-gradient-to-br from-brand to-accent text-white"
                )}
              >
                <Icon active />
              </span>
              <span className={cn(active ? "text-brand" : "text-gray-500")}>
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition",
              active ? "text-brand" : "text-gray-400"
            )}
          >
            <Icon active={active} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LessonsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" strokeLinejoin="round" />
      <path d="M14 3v5h5M8 13h8M8 17h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function ReelsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M2 7h20M7 3l-2 4M12 3l-2 4M17 3l-2 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 13l4 2.5-4 2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}

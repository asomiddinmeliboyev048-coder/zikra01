"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Mobil qurilmalar uchun pastki navigatsiya paneli (faqat md dan kichik ekranlarda).
 *
 * 5 ta bo'lim: Kashf etish, Video darslar, Reels, Suhbatlar, Profil.
 * Ixcham ikonkalar + kichik matn; aktiv bo'lim brend rangi va yuqoridagi
 * indikator bilan ajralib turadi.
 */
export default function BottomNav({ profileId }: { profileId: string; unread?: number }) {
  const pathname = usePathname();

  const items = [
    { href: "/discovery", label: "Kashf", icon: DiscoverIcon },
    { href: "/videos", label: "Video", icon: VideoIcon },
    { href: "/reels", label: "Reels", icon: ReelsIcon },
    { href: "/chat", label: "Suhbat", icon: ChatIcon },
    { href: `/profile/${profileId}`, label: "Profil", icon: UserIcon },
  ];

  return (
    <nav className="zikra-bottom-nav fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-white/10">
      {items.map((item) => {
        const active = item.href.startsWith("/profile")
          ? pathname.startsWith("/profile")
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex flex-1 flex-col items-center gap-1 pb-1.5 pt-2 transition-colors",
              active ? "text-brand" : "text-gray-400"
            )}
          >
            {/* Aktiv indikator (yuqori chiziqcha) */}
            <span
              className={cn(
                "absolute top-0 h-0.5 rounded-full bg-brand transition-all duration-300",
                active ? "w-6 opacity-100" : "w-0 opacity-0"
              )}
            />
            {/* Ikonka + aktiv fon */}
            <span
              className={cn(
                "flex h-7 w-11 items-center justify-center rounded-full transition-all duration-200",
                active ? "bg-brand-50 dark:bg-brand/15" : "group-active:bg-gray-100"
              )}
            >
              <Icon active={active} />
            </span>
            <span
              className={cn(
                "text-[10px] leading-none transition-all",
                active ? "font-semibold" : "font-medium"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function VideoIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <rect x="2" y="5" width="15" height="14" rx="2.5" />
      <path d="M17 9l5-2.5v11L17 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}
function ReelsIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <rect x="2" y="3" width="20" height="18" rx="2.5" />
      <path d="M2 8h20M8 3l-2 5M13 3l-2 5M18 3l-2 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12.5l4.5 2.5-4.5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

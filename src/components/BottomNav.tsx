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
    <nav className="zikra-bottom-nav fixed inset-x-2 bottom-2 z-40 flex overflow-hidden rounded-2xl border border-white/80 bg-white/80 pb-[env(safe-area-inset-bottom)] shadow-[0_20px_48px_-22px_rgba(8,63,59,0.5)] backdrop-blur-2xl md:hidden dark:border-white/10 dark:bg-[#0d2420]/[0.88]">
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
              "group relative flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 transition-all duration-300",
              active ? "text-brand-700 dark:text-brand-300" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            {/* Aktiv indikator (yuqori chiziqcha) */}
            <span
              className={cn(
                "absolute top-0 h-[3px] rounded-b-full bg-gradient-to-r from-brand to-success shadow-[0_3px_10px_rgba(11,155,136,0.45)] transition-all duration-300",
                active ? "w-8 opacity-100" : "w-0 opacity-0"
              )}
            />
            {/* Ikonka + aktiv fon */}
            <span
              className={cn(
                "flex h-8 w-12 items-center justify-center rounded-xl transition-all duration-300",
                active
                  ? "-translate-y-0.5 bg-brand-50 shadow-[0_8px_18px_-12px_rgba(11,155,136,0.65)] dark:bg-brand/15"
                  : "group-active:scale-95 group-active:bg-gray-100 dark:group-active:bg-white/5"
              )}
            >
              <Icon active={active} />
            </span>
            <span
              className={cn(
                "text-[10px] tracking-[-0.01em] transition-all duration-300",
                active ? "font-bold" : "font-medium"
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

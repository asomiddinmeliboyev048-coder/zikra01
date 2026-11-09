"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Mobil qurilmalar uchun pastki navigatsiya paneli (faqat md dan kichik ekranlarda).
 *
 * 5 ta bo'lim: Kashf etish, Video darslar, Reels, Suhbatlar, Rivojlanish.
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
    { href: "/learn", label: "Rivojlanish", icon: LearnIcon },
  ];

  return (
    <nav className="zikra-bottom-nav fixed inset-x-2 bottom-2 z-40 flex overflow-hidden rounded-2xl border border-white/90 ring-1 ring-slate-500/25 bg-[linear-gradient(145deg,#f1f3f6_0%,#cbd1d9_24%,#aeb6c1_52%,#e7eaee_76%,#bcc4ce_100%)] pb-[calc(env(safe-area-inset-bottom)+6px)] shadow-[0_12px_34px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(71,85,105,0.2)] backdrop-blur-2xl md:hidden dark:border-white/90">
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
              active ? "text-slate-950" : "text-slate-600 hover:text-slate-900"
            )}
          >
            {/* Aktiv indikator (yuqori chiziqcha) */}
            <span
              className={cn(
                "absolute top-0 h-[3px] rounded-b-full bg-gradient-to-r from-slate-500 via-white to-slate-500 shadow-[0_2px_8px_rgba(71,85,105,0.5)] transition-all duration-300",
                active ? "w-8 opacity-100" : "w-0 opacity-0"
              )}
            />
            {/* Ikonka + aktiv fon */}
            <span
              className={cn(
                "flex h-8 w-12 items-center justify-center rounded-xl transition-all duration-300",
                active
                  ? "-translate-y-0.5 bg-gradient-to-b from-white via-slate-100 to-slate-300 shadow-[0_7px_16px_-8px_rgba(51,65,85,0.45)] ring-1 ring-white/90"
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
function LearnIcon({ active }: { active: boolean }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M3 5.5 12 2l9 3.5-9 3.5z"/><path d="M6 7.5v6c3.5 2.5 8.5 2.5 12 0v-6M21 6v7" strokeLinecap="round" strokeLinejoin="round"/>
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

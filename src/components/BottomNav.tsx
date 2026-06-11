"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Mobil qurilmalar uchun pastki navigatsiya paneli (faqat md dan kichik ekranlarda).
 * Har bir asosiy bo'lim alohida tugma sifatida pastda joylashadi.
 */
export default function BottomNav({
  profileId,
  unread = 0,
}: {
  profileId: string;
  unread?: number;
}) {
  const pathname = usePathname();

  const items = [
    { href: "/discovery", label: "Kashf", icon: DiscoverIcon },
    { href: "/videos", label: "Video", icon: VideoIcon },
    { href: "/chat", label: "Suhbat", icon: ChatIcon },
    { href: "/notifications", label: "Bildirish", icon: BellIcon, badge: unread },
    { href: `/profile/${profileId}`, label: "Profil", icon: UserIcon },
  ];

  return (
    <nav className="zikra-bottom-nav fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {items.map((item) => {
        const active =
          item.href.startsWith("/profile")
            ? pathname.startsWith("/profile")
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        const badge = "badge" in item ? (item.badge as number) : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition",
              active ? "text-brand" : "text-gray-400"
            )}
          >
            <span className="relative">
              <Icon active={active} />
              {badge > 0 && (
                <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[8px] font-bold text-white">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
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
function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function VideoIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M10 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none" />
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

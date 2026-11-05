"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { avatarFallback, cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

interface Props {
  profile: { id: string; full_name: string; avatar_url: string | null; level: string; xp: number } | null;
  unread: number;
}
const NAV = [
  { href: "/discovery", label: "Kashf etish" },
  { href: "/lessons", label: "Rivojlanish" },
  { href: "/videos", label: "Video darslar" },
  { href: "/reels", label: "Reels" },
  { href: "/chat", label: "Suhbatlar" },
];

export default function NavbarClient({ profile, unread }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [locale, setLocale] = useState("uz");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zikra-locale");
      if (saved && ["uz", "en", "ru"].includes(saved)) setLocale(saved);
    } catch {}
  }, []);
  function chooseLocale(next: string) {
    setLocale(next);
    try { localStorage.setItem("zikra-locale", next); } catch {}
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent("zikra-locale-change", { detail: next }));
  }

  if (!profile) return <nav className="flex items-center gap-2"><ThemeToggle /><select aria-label="Language" value={locale} onChange={(e) => chooseLocale(e.target.value)} className="rounded-xl border border-gray-200 bg-transparent px-2 py-2 text-xs font-semibold dark:border-white/15"><option value="uz">UZ</option><option value="en">EN</option><option value="ru">RU</option></select><Link href="/login" className="btn-ghost">Kirish</Link><Link href="/register" className="btn-primary">Boshlash</Link></nav>;

  return <>
    <nav className="hidden items-center gap-1 md:flex">
      {NAV.map((item) => <Link key={item.href} href={item.href} className={cn("rounded-xl border px-3.5 py-2 text-sm font-semibold transition", pathname.startsWith(item.href) ? "border-brand/10 bg-brand-50/80 text-brand-700 dark:bg-brand/10 dark:text-brand-300" : "border-transparent text-gray-600 hover:bg-white/70 hover:text-brand dark:text-gray-300 dark:hover:bg-white/5")}>{item.label}</Link>)}
    </nav>
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <Link href="/notifications" aria-label="Bildirishnomalar" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-white/80 dark:text-gray-300 dark:hover:bg-white/[0.06]">
        <BellIcon />{unread > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </Link>
      <button onClick={() => setMenuOpen(true)} aria-label="Profil va sozlamalarni ochish" className="rounded-full p-0.5 ring-2 ring-transparent transition hover:ring-brand/30 focus:outline-none focus:ring-brand/50">
        <Image src={profile.avatar_url || avatarFallback(profile.full_name)} alt={profile.full_name} width={36} height={36} className="h-9 w-9 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/15" unoptimized />
      </button>
    </div>
    {menuOpen && typeof document !== "undefined" && createPortal(<>
      <button aria-label="Yopish" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-[70] cursor-default bg-slate-950/35 backdrop-blur-[2px]" />
      <aside role="dialog" aria-modal="true" aria-label="Profil menyusi" className="fixed inset-y-0 right-0 z-[71] flex w-[min(88vw,380px)] flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0d1b1a]">
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-3"><Image src={profile.avatar_url || avatarFallback(profile.full_name)} alt="" width={48} height={48} className="h-12 w-12 rounded-2xl object-cover" unoptimized/><div className="min-w-0"><p className="truncate font-bold text-gray-900 dark:text-white">{profile.full_name}</p><p className="text-xs text-gray-500">{profile.level} · {profile.xp} XP</p></div></div>
          <button onClick={() => setMenuOpen(false)} aria-label="Menyuni yopish" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-100 text-xl text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200">×</button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          <Link href={`/profile/${profile.id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-gray-800 hover:bg-brand-50 dark:text-white dark:hover:bg-white/5"><span>👤</span> Mening profilim <span className="ml-auto text-gray-400">↗</span></Link>
          <Link href="/onboarding" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5">✏️ Profilni tahrirlash</Link>
          <div className="my-3 border-t border-gray-100 dark:border-white/10"/>
          <p className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">Tezkor o‘tish</p>
          {NAV.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-brand-50 dark:text-gray-200 dark:hover:bg-white/5">{item.label}<span className="ml-auto text-gray-400">›</span></Link>)}
          <Link href="/download" onClick={() => setMenuOpen(false)} className="flex items-center rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5">📱 Ilovani yuklab olish</Link>
          <div className="my-3 border-t border-gray-100 dark:border-white/10"/>
          <p className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">Ko‘rinish va til</p>
          <div className="flex items-center justify-between rounded-xl px-4 py-3"><div><p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Tungi / kunduzgi rejim</p><p className="mt-0.5 text-xs text-gray-500">Qurilmada eslab qolinadi</p></div><ThemeToggle/></div>
          <div className="rounded-xl px-4 py-3"><label htmlFor="zikra-locale" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-100">Dastur tili</label><select id="zikra-locale" value={locale} onChange={(e) => chooseLocale(e.target.value)} className="input w-full"><option value="uz">🇺🇿 O‘zbekcha</option><option value="en">🇬🇧 English</option><option value="ru">🇷🇺 Русский</option></select><p className="mt-2 text-xs text-gray-500">Tanlov ushbu qurilmada saqlanadi.</p></div>
          <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5">⚙️ Xavfsizlik va boshqa sozlamalar</Link>
        </div>
        <div className="border-t border-gray-100 p-4 dark:border-white/10"><form action={signOutAction}><button type="submit" className="w-full rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300">Chiqish</button></form></div>
      </aside>
    </>, document.body)}
  </>;
}
function BellIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import VideoCard from "@/components/VideoCard";
import VideoThumb from "@/components/VideoThumb";
import VideoStats from "@/components/VideoStats";
import type { Reel, Video } from "@/lib/types";
import type { ReactNode } from "react";
import { avatarFallback } from "@/lib/utils";
import RelativeTime from "@/components/RelativeTime";

interface Props {
  navbar: ReactNode;
  videos: Video[];
  reels: Reel[];
  profile: { id: string; full_name: string; avatar_url: string | null };
}

const CATEGORIES = ["Hammasi", "Dasturlash", "Kiberxavfsizlik", "Dizayn", "Ingliz tili", "Biznes"];

export default function VideoBrowser({ navbar, videos, reels, profile }: Props) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("Hammasi");
  const [searchOpen, setSearchOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return videos.filter((video) => {
      const matchesQuery = !query || video.title.toLowerCase().includes(query);
      const matchesCategory =
        category === "Hammasi" ||
        video.title.toLowerCase().includes(category.toLowerCase());
      return matchesQuery && matchesCategory;
    });
  }, [videos, q, category]);


  return (
    <div className="zikra-video-home min-h-screen bg-[#f9faf9] pb-24 text-gray-900 md:pb-10 dark:bg-[#0f0f0f] dark:text-white">
      {navbar}
      {/* Yagona global navigatsiya ostidagi video qidiruv va filtrlar */}
      <div className="sticky top-16 z-30 border-b border-black/[0.04] bg-white/95 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#0b100f]/95">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex h-10 min-w-0 flex-1 items-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.06]">
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Video darslarni qidiring..." aria-label="Video darslarni qidiring" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-gray-400" />
            <span className="px-3 text-gray-500" aria-hidden="true"><SearchIcon /></span>
          </div>
        </div>
        <div className="hide-scrollbar mx-auto flex max-w-[1600px] gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8">
          {CATEGORIES.map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${category === item ? "bg-[#14201e] text-white dark:bg-white dark:text-[#101816]" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/[0.09] dark:text-gray-200 dark:hover:bg-white/[0.15]"}`}>{item}</button>
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1600px]">
        {/* Barcha video darslar — responsive kartalar */}
        {filtered.length > 0 ? (
          <section className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Video darslar</h2>
              <span className="text-xs text-gray-500">{filtered.length} ta video</span>
            </div>
            <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((video) => <VideoCard key={video.id} video={video} />)}
            </div>
          </section>
        ) : (
          <div className="mx-4 my-10 rounded-2xl bg-white px-6 py-14 text-center dark:bg-[#101715]">
            <div className="text-4xl">🎬</div>
            <p className="mt-3 font-semibold">{q || category !== "Hammasi" ? "Bu qidiruv bo'yicha video topilmadi" : "Hali video darslar mavjud emas"}</p>
            <p className="mt-1 text-sm text-gray-500">Birinchi bo'lib bilim ulashing!</p>
            <Link href={`/profile/${profile.id}`} className="mt-4 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">Profilga o'tish</Link>
          </div>
        )}

        {/* Shorts lentasi */}
        {reels.length > 0 && (
          <section className="mb-9">
            <div className="mb-4 flex items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link href="/reels" className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff1744] text-white">
                  <ShortsIcon />
                </span>
                <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Shorts</h2>
              </Link>
              <Link href="/reels" className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand/10">Barchasi <span aria-hidden>→</span></Link>
            </div>
            <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:px-6 lg:px-8">
              {reels.slice(0, 12).map((reel) => (
                <Link key={reel.id} href={`/reels?start=${reel.id}`} className="group w-[42vw] max-w-[220px] shrink-0 snap-start sm:w-[190px]">
                  <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-[#151b19] shadow-sm">
                    <video src={reel.video_url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
                    <span className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-semibold leading-snug text-white">{reel.description || reel.user?.full_name || "Zikra Shorts"}</span>
                    <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold text-white">{reel.views ?? 0} ko'rish</span>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{reel.user?.full_name || "Zikra foydalanuvchisi"}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>


    </div>
  );
}

function BottomItem({ href, label, active = false, children }: { href: string; label: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`flex flex-col items-center justify-center gap-1 py-1 ${active ? "text-brand" : "text-gray-500 dark:text-gray-400"}`}>
      <span className="flex h-7 items-center justify-center">{children}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="10.8" cy="10.8" r="7.2"/><path d="m16.2 16.2 5 5" strokeLinecap="round"/></svg>;
}
function BellIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8.5-3 8.5h18S18 15 18 8M10 21h4"/></svg>;
}
function ShortsIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M18.8 3.1a4.1 4.1 0 0 0-5.6-1.5L5 6a4 4 0 0 0 .2 7.1l1.2.6-1.2.7a4 4 0 0 0 4 7l8.2-4.7a4 4 0 0 0-.2-7.1l-1.2-.6 1.2-.7a4 4 0 0 0 1.6-5.2ZM9.2 15.3v-6l5.2 3-5.2 3Z"/></svg>;
}
function HomeIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/></svg>;
}
function PlusIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
}
function ExploreIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2.4 5.2-5.2 2.4 2.4-5.2 5.2-2.4Z"/></svg>;
}
function ProfileIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>;
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Skill } from "@/lib/types";
import ReelUpload from "@/app/videos/ReelUpload";
import VideoUpload from "@/app/videos/VideoUpload";
import StoryUpload from "@/components/StoryUpload";

type Active = null | "reel" | "video" | "story";

/**
 * Instagram uslubidagi global "Yaratish" (+) tugmasi.
 *
 * Ekranning o'ng pastida suzuvchi (+) tugma. Bosilganda pastdan menyu chiqadi:
 * Reel · Video dars · Hikoya. Tanlangan turga mos yuklash oynasi ochiladi.
 * Video uchun ko'nikmalar ro'yxati klient tomonda bir marta yuklanadi.
 */
export default function CreateMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<Active>(null);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Video yuklash tanlanganda ko'nikmalarni yuklaymiz (faqat bir marta)
  useEffect(() => {
    if (active !== "video" || skills.length > 0) return;
    let alive = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("skills").select("*").order("name");
      if (alive) setSkills((data as Skill[]) ?? []);
    })();
    return () => {
      alive = false;
    };
  }, [active, skills.length]);

  function choose(next: Active) {
    setMenuOpen(false);
    setActive(next);
  }

  return (
    <>
      {/* Suzuvchi (+) tugma — bottom nav ustida (mobil), pastki o'ngda (desktop) */}
      <button
        onClick={() => setMenuOpen(true)}
        className="zikra-create-fab fixed bottom-[5.25rem] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_10px_30px_-8px_rgba(18,165,148,0.7)] transition hover:bg-brand-600 active:scale-95 md:bottom-6"
        title="Yaratish"
        aria-label="Yaratish"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>

      {/* Tanlash menyusi (pastdan chiqadigan sheet) */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-card-hover animate-slide-up dark:bg-[#161d31]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-100 px-4 py-3 text-center dark:border-white/10">
              <h3 className="font-semibold text-gray-900 dark:text-white">Yaratish</h3>
            </div>
            <div className="flex flex-col p-2">
              <CreateOption
                icon="🎬"
                title="Reel"
                subtitle="Qisqa video (≤50MB)"
                onClick={() => choose("reel")}
              />
              <CreateOption
                icon="📹"
                title="Video dars"
                subtitle="To'liq dars yoki YouTube havolasi"
                onClick={() => choose("video")}
              />
              <CreateOption
                icon="📷"
                title="Hikoya"
                subtitle="24 soatlik rasm yoki video"
                onClick={() => choose("story")}
              />
            </div>
          </div>
        </div>
      )}

      {/* Yuklash oynalari — tanlovga qarab (boshqariladigan rejimda) */}
      {active === "reel" && (
        <ReelUpload
          showTrigger={false}
          open
          onOpenChange={(o) => !o && setActive(null)}
        />
      )}
      {active === "video" && (
        <VideoUpload
          skills={skills}
          showTrigger={false}
          open
          onOpenChange={(o) => !o && setActive(null)}
        />
      )}
      {active === "story" && <StoryUpload onClose={() => setActive(null)} />}
    </>
  );
}

function CreateOption({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-xl dark:bg-brand/15">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-gray-900 dark:text-white">{title}</span>
        <span className="block text-xs text-gray-500">{subtitle}</span>
      </span>
    </button>
  );
}

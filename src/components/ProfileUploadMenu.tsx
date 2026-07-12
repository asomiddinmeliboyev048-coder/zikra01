"use client";

import { useState } from "react";
import type { Skill } from "@/lib/types";
import ReelUpload from "@/app/videos/ReelUpload";
import VideoUpload from "@/app/videos/VideoUpload";

/**
 * Instagram uslubidagi "+" tugmasi — profil tepasidagi burchakda.
 * Bosilganda ikkita variant chiqadi: "Reel yuklash" va "Video dars yuklash".
 * Har biri o'z modal oynasini ochadi (ReelUpload / VideoUpload controlled rejimda).
 *
 * Shu tugma tufayli profil pastidagi alohida yuklash tugmalari kerak emas.
 */
export default function ProfileUploadMenu({ skills }: { skills: Skill[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <>
      {/* "+" tugmasi */}
      <button
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Yuklash"
        aria-expanded={menuOpen}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand shadow-card-hover ring-1 ring-brand/20 transition hover:scale-105 active:scale-95"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>

      {/* Menyu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-14 z-40 w-56 overflow-hidden rounded-2xl bg-white py-1 shadow-card-hover ring-1 ring-gray-100">
            <button
              onClick={() => {
                setMenuOpen(false);
                setReelOpen(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-lg">🎬</span>
              Reel yuklash
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setVideoOpen(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-lg">🎥</span>
              Video dars yuklash
            </button>
          </div>
        </>
      )}

      {/* Modallar — controlled rejimda, ichki tugmasiz */}
      <ReelUpload open={reelOpen} onOpenChange={setReelOpen} hideTrigger />
      <VideoUpload skills={skills} open={videoOpen} onOpenChange={setVideoOpen} hideTrigger />
    </>
  );
}

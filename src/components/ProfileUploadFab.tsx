"use client";

import { useState } from "react";
import type { Skill } from "@/lib/types";
import VideoUpload from "@/app/videos/VideoUpload";
import ReelUpload from "@/app/videos/ReelUpload";
import { cn } from "@/lib/utils";

/**
 * Instagram uslubidagi "+" tugmasi (profilda, faqat o'z profilida).
 * Bosilganda burchakdan "Reels yuklash" va "Video dars yuklash" tugmalari
 * silliq chiqadi. Har biri mos yuklash oynasini ochadi.
 */
export default function ProfileUploadFab({ skills }: { skills: Skill[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);

  return (
    <>
      {/* Menyu ochiq bo'lsa — tashqariga bosilganda yopiladi */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      {/* Suzuvchi tugma va menyu (o'ng-past burchak; mobil'da bottom nav ustida) */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6">
        {/* Menyu elementlari */}
        <div
          className={cn(
            "flex flex-col items-end gap-2 transition-all duration-200",
            menuOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          )}
        >
          <button
            onClick={() => {
              setReelOpen(true);
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 rounded-full bg-white py-2.5 pl-4 pr-3 text-sm font-semibold text-gray-800 shadow-card-hover"
          >
            Reels yuklash
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>

          <button
            onClick={() => {
              setVideoOpen(true);
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 rounded-full bg-white py-2.5 pl-4 pr-3 text-sm font-semibold text-gray-800 shadow-card-hover"
          >
            Video dars yuklash
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m23 7-7 5 7 5V7z" strokeLinejoin="round" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
            </span>
          </button>
        </div>

        {/* Asosiy "+" tugmasi */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-card-hover transition hover:bg-brand-600"
          aria-label="Yuklash"
          aria-expanded={menuOpen}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={cn("transition-transform duration-200", menuOpen && "rotate-45")}
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Yuklash oynalari — tugmasiz (controlled), FAB menyudan ochiladi */}
      <VideoUpload
        skills={skills}
        hideTrigger
        open={videoOpen}
        onOpenChange={setVideoOpen}
      />
      <ReelUpload hideTrigger open={reelOpen} onOpenChange={setReelOpen} />
    </>
  );
}

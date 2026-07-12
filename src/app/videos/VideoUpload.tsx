"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Skill } from "@/lib/types";
import {
  uploadVideo,
  captureVideoThumbnail,
  uploadVideoThumbnail,
} from "@/lib/storage";
import { saveVideoAction } from "@/app/actions/video";
import { cn } from "@/lib/utils";

/** YouTube/short havoladan video ID ajratib olish */
function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

export default function VideoUpload({ skills }: { skills: Skill[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [title, setTitle] = useState("");
  const [skillId, setSkillId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function reset() {
    setTitle("");
    setSkillId("");
    setFile(null);
    setLink("");
    setProgress(0);
    setError("");
    setDone(false);
    setMode("file");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Dars nomini kiriting.");

    setBusy(true);
    try {
      let videoUrl = "";
      let thumb: string | undefined;
      let duration: number | undefined;

      if (mode === "file") {
        if (!file) {
          setBusy(false);
          return setError("Video faylni tanlang.");
        }
        setProgress(30);
        const result = await uploadVideo(file);
        videoUrl = result.url;
        duration = result.duration;

        // Videoning birinchi kadridan avtomatik muqova (thumbnail) yasaymiz.
        // Muqova ixtiyoriy — agar yasashda/yuklashda xato bo'lsa, davom etamiz
        // (bunda ko'rsatishda VideoThumb baribir 1-kadrni ko'rsatadi).
        setProgress(70);
        try {
          const thumbBlob = await captureVideoThumbnail(file);
          if (thumbBlob) thumb = await uploadVideoThumbnail(thumbBlob);
        } catch {
          /* muqova majburiy emas */
        }
        setProgress(90);
      } else {
        const clean = link.trim();
        if (!clean) {
          setBusy(false);
          return setError("Video havolasini kiriting.");
        }
        if (!/^https?:\/\//.test(clean)) {
          setBusy(false);
          return setError("To'g'ri havola kiriting (https://...).");
        }
        videoUrl = clean;
        const yt = youtubeId(clean);
        if (yt) thumb = `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
      }

      const res = await saveVideoAction({
        title,
        skillId,
        cloudinaryUrl: videoUrl,
        thumbnailUrl: thumb,
        duration,
      });
      if (res.error) setError(res.error);
      else {
        setDone(true);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-accent">
        + Video yuklash
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-card-hover">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Video dars qo&apos;shish
              </h2>
              <button
                onClick={() => !busy && setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="text-4xl">✅</span>
                <p className="font-semibold text-gray-900">Video qo&apos;shildi!</p>
                <p className="text-sm text-gray-500">
                  Videongiz <b>moderator tasdig&apos;idan</b> so&apos;ng boshqa
                  foydalanuvchilarga ko&apos;rinadi.
                </p>
                <button
                  onClick={() => {
                    reset();
                    setOpen(false);
                  }}
                  className="btn-primary mt-2"
                >
                  Yopish
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rejim tanlovi */}
                <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("file")}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
                      mode === "file" ? "bg-white text-brand shadow-sm" : "text-gray-500"
                    )}
                  >
                    📁 Fayl yuklash
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("link")}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
                      mode === "link" ? "bg-white text-brand shadow-sm" : "text-gray-500"
                    )}
                  >
                    🔗 Havola (YouTube)
                  </button>
                </div>

                <div>
                  <label className="label">Dars nomi *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masalan: Python'da birinchi dastur"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Ko&apos;nikma</label>
                  <select
                    value={skillId}
                    onChange={(e) => setSkillId(e.target.value)}
                    className="input"
                  >
                    <option value="">Tanlang...</option>
                    {skills.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {mode === "file" ? (
                  <div>
                    <label className="label">Video fayl *</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand-100"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Telefon/kompyuter galereyangizdan tanlang (≈50MB gacha). Kattaroq video uchun &quot;Havola&quot; rejimidan foydalaning.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="label">Video havolasi *</label>
                    <input
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="input"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Videoni YouTube&apos;ga (cheksiz, bepul) yuklab, havolasini bu yerga qo&apos;ying. Katta videolar uchun eng qulay yo&apos;l.
                    </p>
                  </div>
                )}

                {busy && mode === "file" && (
                  <div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full bg-success transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Yuklanmoqda...</p>
                  </div>
                )}

                {error && (
                  <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => !busy && setOpen(false)}
                    className="btn-ghost"
                  >
                    Bekor qilish
                  </button>
                  <button type="submit" disabled={busy} className="btn-primary">
                    {busy ? "Saqlanmoqda..." : "Qo'shish"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

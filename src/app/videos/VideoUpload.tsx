"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Skill } from "@/lib/types";
import { uploadVideoToCloudinary } from "@/lib/cloudinary";
import { saveVideoAction } from "@/app/actions/video";

export default function VideoUpload({ skills }: { skills: Skill[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [skillId, setSkillId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setTitle("");
    setSkillId("");
    setFile(null);
    setProgress(0);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!file) return setError("Video faylni tanlang.");
    if (!title.trim()) return setError("Dars nomini kiriting.");

    setBusy(true);
    try {
      const result = await uploadVideoToCloudinary(file, setProgress);
      const res = await saveVideoAction({
        title,
        skillId,
        cloudinaryUrl: result.secure_url,
        thumbnailUrl: result.thumbnail_url,
        duration: result.duration,
      });
      if (res.error) {
        setError(res.error);
      } else {
        reset();
        setOpen(false);
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
                Video dars yuklash
              </h2>
              <button
                onClick={() => !busy && setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <label className="label">Video fayl *</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand-100"
                />
              </div>

              {busy && (
                <div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full bg-success transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Yuklanmoqda... {progress}%
                  </p>
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
                  {busy ? "Yuklanmoqda..." : "Yuklash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveReelAction } from "@/app/actions/reels";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = ["video/mp4", "video/quicktime"]; // .mp4, .mov

/**
 * Reel (qisqa video) yuklash — S3'ga TO'G'RIDAN-TO'G'RI.
 *
 * Oqim:
 *   1) /api/reels/presign'dan qisqa muddatli PUT URL olamiz.
 *   2) Faylni XMLHttpRequest bilan S3'ga PUT qilamiz (progress bar uchun —
 *      fetch hali yuklash progressini bermaydi).
 *   3) Muvaffaqiyatdan so'ng ommaviy URL'ni saveReelAction orqali saqlaymiz.
 */
export default function ReelUpload() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function reset() {
    setFile(null);
    setDescription("");
    setProgress(0);
    setStatus("");
    setError("");
    setDone(false);
  }

  /** Faylni presigned URL orqali S3'ga yuklaydi (Promise). */
  function putToS3(url: string, f: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", f.type);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      };
      xhr.onload = () =>
        xhr.status === 200
          ? resolve()
          : reject(new Error(`S3 yuklash xatosi (${xhr.status}).`));
      xhr.onerror = () => reject(new Error("Tarmoq xatosi."));
      xhr.send(f);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!file) return setError("Video faylni tanlang.");
    // Client tomonda dastlabki tekshiruv (server baribir qayta tekshiradi)
    if (!ALLOWED_TYPES.includes(file.type))
      return setError("Faqat .mp4 yoki .mov formatiga ruxsat etiladi.");
    if (file.size > MAX_BYTES)
      return setError("Video hajmi 50MB dan oshmasligi kerak.");

    setBusy(true);
    try {
      // 1) Presigned URL olish
      setStatus("Tayyorlanmoqda...");
      const presignRes = await fetch("/api/reels/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const presign = await presignRes.json();
      if (!presignRes.ok) throw new Error(presign.error || "Yuklash tayyorlanmadi.");

      // 2) S3'ga yuklash
      setStatus("Yuklanmoqda...");
      await putToS3(presign.uploadUrl, file);

      // 3) Bazaga saqlash
      setStatus("Saqlanmoqda...");
      const saved = await saveReelAction({
        videoUrl: presign.publicUrl,
        description,
      });
      if (saved.error) throw new Error(saved.error);

      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-accent">
        + Reel yuklash
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-card-hover">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Qisqa video (reel) yuklash
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
                <p className="font-semibold text-gray-900">Reel yuklandi!</p>
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
                <div>
                  <label className="label">Video fayl * (.mp4 / .mov, ≤50MB)</label>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand-100"
                  />
                </div>

                <div>
                  <label className="label">Tavsif (ixtiyoriy)</label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Masalan: 60 soniyada CSS Flexbox"
                    className="input"
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
                      {status} {progress > 0 && `(${progress}%)`}
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
            )}
          </div>
        </div>
      )}
    </>
  );
}

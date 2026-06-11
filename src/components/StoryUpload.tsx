"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadStoryMedia } from "@/lib/storage";
import { createStoryAction } from "@/app/actions/stories";

export default function StoryUpload({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
    setPreview({
      url: URL.createObjectURL(f),
      type: f.type.startsWith("video/") ? "video" : "image",
    });
  }

  async function share() {
    if (!file) {
      fileRef.current?.click();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const media = await uploadStoryMedia(file);
      const res = await createStoryAction({
        mediaUrl: media.url,
        mediaType: media.type,
        caption,
      });
      if (res.error) {
        setError(res.error);
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-card-hover dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Yangi hikoya</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={pick}
          className="hidden"
        />

        {preview ? (
          <div className="relative overflow-hidden rounded-xl bg-black">
            {preview.type === "video" ? (
              <video src={preview.url} className="max-h-80 w-full object-contain" controls />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt="preview" className="max-h-80 w-full object-contain" />
            )}
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-brand hover:text-brand"
          >
            <span className="text-3xl">📷</span>
            Galereya yoki kameradan tanlang
          </button>
        )}

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Matn qo'shing (ixtiyoriy)..."
          className="input mt-3"
          maxLength={200}
        />

        {error && (
          <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          {preview && (
            <button onClick={() => fileRef.current?.click()} className="btn-ghost" disabled={busy}>
              Boshqa tanlash
            </button>
          )}
          <button onClick={share} disabled={busy} className="btn-primary">
            {busy ? "Yuklanmoqda..." : file ? "Ulashish" : "Tanlash"}
          </button>
        </div>
      </div>
    </div>
  );
}

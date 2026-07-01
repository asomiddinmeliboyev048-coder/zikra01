"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteReelAction } from "@/app/actions/reels";

export interface ReelItem {
  id: string;
  user_id: string;
  video_url: string;
  description: string | null;
  created_at: string;
  uploader: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hozirgina";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  return `${days} kun oldin`;
}

export default function ReelsFeed({
  reels,
  currentUserId,
}: {
  reels: ReelItem[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Ushbu reelni o'chirmoqchimisiz?")) return;
    setDeletingId(id);
    const res = await deleteReelAction(id);
    setDeletingId(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  if (reels.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 py-16 text-center">
        <span className="text-4xl">🎞️</span>
        <p className="font-medium text-gray-700">Hali reel yo&apos;q</p>
        <p className="text-sm text-gray-500">
          Birinchi bo&apos;lib qisqa video ulashing!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {reels.map((r) => (
        <div key={r.id} className="card overflow-hidden p-0">
          <video
            src={r.video_url}
            controls
            preload="metadata"
            playsInline
            className="aspect-[9/16] w-full bg-black object-contain"
          />
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/profile/${r.user_id}`}
                className="truncate text-sm font-medium text-brand hover:underline"
              >
                {r.uploader?.full_name ?? "Foydalanuvchi"}
              </Link>
              <span className="shrink-0 text-xs text-gray-400">
                {timeAgo(r.created_at)}
              </span>
            </div>

            {r.description && (
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                {r.description}
              </p>
            )}

            {r.user_id === currentUserId && (
              <button
                onClick={() => handleDelete(r.id)}
                disabled={deletingId === r.id}
                className="mt-3 text-xs font-medium text-accent-600 hover:text-accent-700 disabled:opacity-50"
              >
                {deletingId === r.id ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

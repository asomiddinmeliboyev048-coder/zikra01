"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { avatarFallback } from "@/lib/utils";
import {
  completeLessonAction,
  cancelLessonAction,
} from "@/app/actions/lessons";
import RateModal from "./RateModal";

export interface LessonView {
  id: string;
  status: "scheduled" | "completed" | "cancelled";
  skillName: string | null;
  scheduledAt: string | null;
  iAmTeacher: boolean;
  partner: { id: string; full_name: string; avatar_url: string | null };
  alreadyRated: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Rejalashtirilgan",
  completed: "Yakunlangan",
  cancelled: "Bekor qilingan",
};
const STATUS_CLASS: Record<string, string> = {
  scheduled: "bg-brand-50 text-brand-700",
  completed: "bg-success-50 text-success-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function LessonCard({ lesson }: { lesson: LessonView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showRate, setShowRate] = useState(false);

  async function complete() {
    setBusy(true);
    await completeLessonAction(lesson.id);
    setBusy(false);
    router.refresh();
  }

  async function cancel() {
    if (!confirm("Darsni bekor qilmoqchimisiz?")) return;
    setBusy(true);
    await cancelLessonAction(lesson.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <Link
        href={`/profile/${lesson.partner.id}`}
        className="flex flex-1 items-center gap-3"
      >
        <Image
          src={
            lesson.partner.avatar_url || avatarFallback(lesson.partner.full_name)
          }
          alt={lesson.partner.full_name}
          width={44}
          height={44}
          className="h-11 w-11 rounded-xl object-cover"
          unoptimized
        />
        <div>
          <p className="font-medium text-gray-900">{lesson.partner.full_name}</p>
          <p className="text-xs text-gray-500">
            {lesson.iAmTeacher ? "Siz o'rgatasiz" : "Sizga o'rgatadi"}
            {lesson.skillName ? ` · ${lesson.skillName}` : ""}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[lesson.status]}`}
        >
          {STATUS_LABEL[lesson.status]}
        </span>

        {lesson.status === "scheduled" && (
          <>
            <button
              onClick={complete}
              disabled={busy}
              className="btn-success px-3 py-1.5 text-xs"
            >
              Yakunlash
            </button>
            <button
              onClick={cancel}
              disabled={busy}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              Bekor
            </button>
          </>
        )}

        {lesson.status === "completed" &&
          (lesson.alreadyRated ? (
            <span className="text-xs text-gray-400">Baho berilgan ✓</span>
          ) : (
            <button
              onClick={() => setShowRate(true)}
              className="btn-accent px-3 py-1.5 text-xs"
            >
              Baho berish
            </button>
          ))}
      </div>

      {showRate && (
        <RateModal
          lessonId={lesson.id}
          ratedId={lesson.partner.id}
          ratedName={lesson.partner.full_name}
          onClose={() => setShowRate(false)}
        />
      )}
    </div>
  );
}

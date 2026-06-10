"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StarPicker from "@/components/StarPicker";
import { submitRatingAction } from "@/app/actions/lessons";

export default function RateModal({
  lessonId,
  ratedId,
  ratedName,
  onClose,
}: {
  lessonId: string;
  ratedId: string;
  ratedName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (score < 1) return setError("Iltimos, yulduz tanlang.");
    setBusy(true);
    setError("");
    const res = await submitRatingAction({ lessonId, ratedId, score, comment });
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      onClose();
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card-hover">
        <h2 className="text-lg font-semibold text-gray-900">
          {ratedName}ga baho bering
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Bahoyingiz ikki tomon ham baholaganda ko&apos;rinadi.
        </p>

        <div className="mt-5 flex justify-center">
          <StarPicker value={score} onChange={setScore} />
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Izoh (ixtiyoriy)"
          className="input mt-4 resize-none"
        />

        {error && (
          <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost" disabled={busy}>
            Bekor qilish
          </button>
          <button onClick={submit} disabled={busy} className="btn-primary">
            {busy ? "Yuborilmoqda..." : "Baho berish"}
          </button>
        </div>
      </div>
    </div>
  );
}

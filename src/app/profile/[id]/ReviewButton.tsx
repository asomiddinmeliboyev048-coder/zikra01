"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StarPicker from "@/components/StarPicker";
import { submitProfileReviewAction } from "@/app/actions/reviews";

export default function ReviewButton({
  ratedId,
  ratedName,
}: {
  ratedId: string;
  ratedName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (score < 1) return setError("Iltimos, yulduz tanlang.");
    setBusy(true);
    setError("");
    const res = await submitProfileReviewAction({ ratedId, score, comment });
    setBusy(false);
    if (res.error) setError(res.error);
    else {
      setOpen(false);
      setScore(0);
      setComment("");
      router.refresh();
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-success">
        ⭐ Baholash
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 className="text-lg font-semibold text-gray-900">
              {ratedName}ni baholang
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Suhbat va dars tajribangizga qarab baho va izoh qoldiring.
            </p>

            <div className="mt-5 flex justify-center">
              <StarPicker value={score} onChange={setScore} />
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Izohingiz (ixtiyoriy)..."
              className="input mt-4 resize-none"
            />

            {error && (
              <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="btn-ghost" disabled={busy}>
                Bekor qilish
              </button>
              <button onClick={submit} disabled={busy} className="btn-primary">
                {busy ? "Yuborilmoqda..." : "Baho qoldirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

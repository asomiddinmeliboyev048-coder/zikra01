"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Skill } from "@/lib/types";
import { createLessonAction } from "@/app/actions/lessons";

export interface PartnerOption {
  id: string;
  full_name: string;
}

export default function NewLessonModal({
  partners,
  skills,
}: {
  partners: PartnerOption[];
  skills: Skill[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [role, setRole] = useState<"teacher" | "learner">("teacher");
  const [skillId, setSkillId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!partnerId) return setError("Hamkor tanlang.");
    setBusy(true);
    setError("");
    const res = await createLessonAction({ partnerId, role, skillId });
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setOpen(false);
      setPartnerId("");
      setSkillId("");
      router.refresh();
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Yangi dars
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 className="text-lg font-semibold text-gray-900">
              Yangi dars rejalashtirish
            </h2>

            {partners.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                Avval Kashf etish sahifasidan kimnidir toping va suhbat
                boshlang.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="label">Hamkor</label>
                  <select
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                    className="input"
                  >
                    <option value="">Tanlang...</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Sizning rolingiz</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("teacher")}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                        role === "teacher"
                          ? "border-success bg-success-50 text-success-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      Men o&apos;rgataman
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("learner")}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                        role === "learner"
                          ? "border-brand bg-brand-50 text-brand-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      Men o&apos;rganaman
                    </button>
                  </div>
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
              </div>
            )}

            {error && (
              <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="btn-ghost">
                Yopish
              </button>
              {partners.length > 0 && (
                <button
                  onClick={submit}
                  disabled={busy}
                  className="btn-primary"
                >
                  {busy ? "Saqlanmoqda..." : "Yaratish"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

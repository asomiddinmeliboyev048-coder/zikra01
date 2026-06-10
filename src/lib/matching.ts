import type { Skill } from "./types";

/**
 * Moslik algoritmi (Zikra P2P match score).
 *
 * Mantiq:
 *  - "Men o'rganmoqchiman" (me.learn) ↔ "U o'rgata oladi" (other.teach)  => menga foydali
 *  - "Men o'rgata olaman" (me.teach) ↔ "U o'rganmoqchi" (other.learn)    => unga foydali
 *
 *  - Ikki tomonlama mos (har ikki yo'nalishda kamida bitta umumiy ko'nikma)
 *      => 100% (mukammal o'zaro almashinuv)
 *  - Faqat bir tomonlama mos
 *      => 50–70% (umumiy ko'nikmalar soniga qarab)
 *  - Mos kelmasa => 0%
 */

export interface MatchInput {
  teach: Pick<Skill, "id">[]; // foydalanuvchi o'rgata oladigan
  learn: Pick<Skill, "id">[]; // foydalanuvchi o'rganmoqchi
}

function intersectionCount(
  a: Pick<Skill, "id">[],
  b: Pick<Skill, "id">[]
): number {
  const setB = new Set(b.map((s) => s.id));
  return a.filter((s) => setB.has(s.id)).length;
}

export function computeMatchScore(me: MatchInput, other: MatchInput): number {
  // U menga o'rgata oladimi? (men o'rganmoqchi ∩ u o'rgata oladi)
  const theyCanTeachMe = intersectionCount(me.learn, other.teach);
  // Men unga o'rgata olamanmi? (men o'rgata olaman ∩ u o'rganmoqchi)
  const iCanTeachThem = intersectionCount(me.teach, other.learn);

  if (theyCanTeachMe === 0 && iCanTeachThem === 0) {
    return 0;
  }

  // Ikki tomonlama — mukammal almashinuv
  if (theyCanTeachMe > 0 && iCanTeachThem > 0) {
    // ko'proq umumiy ko'nikma bo'lsa ham, maksimum 100%
    const bonus = Math.min(10, (theyCanTeachMe + iCanTeachThem - 2) * 2);
    return Math.min(100, 90 + bonus);
  }

  // Bir tomonlama — 50–70%
  const overlap = Math.max(theyCanTeachMe, iCanTeachThem);
  return Math.min(70, 50 + (overlap - 1) * 10);
}

/** Moslik foiziga qarab rang klassi */
export function matchScoreColor(score: number): string {
  if (score >= 90) return "bg-success text-white";
  if (score >= 70) return "bg-success-100 text-success-700";
  if (score >= 50) return "bg-brand-100 text-brand-700";
  return "bg-gray-100 text-gray-500";
}

/** Moslik foiziga qarab matn tavsifi */
export function matchScoreLabel(score: number): string {
  if (score >= 90) return "Mukammal moslik";
  if (score >= 70) return "Yaxshi moslik";
  if (score >= 50) return "Qisman moslik";
  return "Moslik past";
}

// ============================================================
// Zikra — Gamifikatsiya yordamchilari (client-side)
// XP/daraja hisoblash DB trigger orqali bo'ladi; bular faqat ko'rsatish uchun.
// ============================================================

export interface LevelInfo {
  name: string;
  min: number;
  max: number; // keyingi darajaga yetish chegarasi
  color: string;
}

export const LEVELS: LevelInfo[] = [
  { name: "Yangi boshlovchi", min: 0, max: 200, color: "#9CA3AF" },
  { name: "O'rta", min: 200, max: 500, color: "#534AB7" },
  { name: "Tajribali", min: 500, max: 1000, color: "#1D9E75" },
  { name: "Ekspert", min: 1000, max: 2000, color: "#D85A30" },
  { name: "Master", min: 2000, max: Infinity, color: "#F59E0B" },
];

export function getLevel(xp: number): LevelInfo {
  return (
    [...LEVELS].reverse().find((l) => xp >= l.min) ?? LEVELS[0]
  );
}

/** Joriy daraja ichida progress (0–100%) */
export function levelProgress(xp: number): {
  level: LevelInfo;
  next: LevelInfo | null;
  percent: number;
  xpIntoLevel: number;
  xpForLevel: number;
} {
  const level = getLevel(xp);
  const idx = LEVELS.findIndex((l) => l.name === level.name);
  const next = idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;

  if (!next) {
    return { level, next: null, percent: 100, xpIntoLevel: xp - level.min, xpForLevel: 0 };
  }

  const xpIntoLevel = xp - level.min;
  const xpForLevel = next.min - level.min;
  const percent = Math.min(100, Math.round((xpIntoLevel / xpForLevel) * 100));

  return { level, next, percent, xpIntoLevel, xpForLevel };
}

// XP mukofotlari (ma'lumot uchun — haqiqiy qo'shilish DB'da)
export const XP_REWARDS = {
  LESSON_TAUGHT: 50,
  FIVE_STAR: 30,
  STREAK_KEPT: 20,
} as const;

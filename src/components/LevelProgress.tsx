import { levelProgress } from "@/lib/gamification";

export default function LevelProgress({ xp }: { xp: number }) {
  const { level, next, percent, xpIntoLevel, xpForLevel } = levelProgress(xp);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-semibold" style={{ color: level.color }}>
          {level.name}
        </span>
        <span className="text-gray-500">{xp} XP</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: level.color }}
        />
      </div>
      {next ? (
        <p className="mt-1.5 text-xs text-gray-400">
          {next.name} darajasiga {xpForLevel - xpIntoLevel} XP qoldi
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-gray-400">
          Eng yuqori daraja — Master! 🏆
        </p>
      )}
    </div>
  );
}

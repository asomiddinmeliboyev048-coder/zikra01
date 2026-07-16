import { matchScoreColor, matchScoreLabel } from "@/lib/matching";

export default function MatchBadge({
  score,
  showLabel = false,
}: {
  score: number;
  showLabel?: boolean;
}) {
  return (
    <span
      title={matchScoreLabel(score)}
      className={`inline-flex items-center gap-1 rounded-full border border-white/70 px-2.5 py-1 text-xs font-extrabold shadow-[0_6px_14px_-10px_rgba(8,63,59,0.46)] backdrop-blur-md transition-transform duration-300 hover:scale-105 dark:border-white/10 ${matchScoreColor(
        score
      )}`}
    >
      {score}%{showLabel && <span className="font-medium">moslik</span>}
    </span>
  );
}

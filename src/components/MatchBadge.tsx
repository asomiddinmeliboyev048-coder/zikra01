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
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${matchScoreColor(
        score
      )}`}
    >
      {score}%{showLabel && <span className="font-medium">moslik</span>}
    </span>
  );
}

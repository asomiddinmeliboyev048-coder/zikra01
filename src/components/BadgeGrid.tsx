import type { UserBadge } from "@/lib/types";

export default function BadgeGrid({ badges }: { badges: UserBadge[] }) {
  if (badges.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Hali nishonlar yo&apos;q. Dars o&apos;tkazing va nishon yig&apos;ing!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map((ub) => (
        <div
          key={ub.id}
          className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-center"
          title={ub.badge?.description ?? ""}
        >
          <span className="text-2xl">{ub.badge?.icon ?? "🏅"}</span>
          <span className="mt-1 text-xs font-semibold text-gray-700">
            {ub.badge?.name}
          </span>
        </div>
      ))}
    </div>
  );
}

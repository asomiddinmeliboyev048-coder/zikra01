import Image from "next/image";
import Link from "next/link";
import type { ProfileWithSkills } from "@/lib/types";
import { avatarFallback } from "@/lib/utils";
import MatchBadge from "./MatchBadge";
import StarRating from "./StarRating";
import VerifiedBadge from "./VerifiedBadge";

export default function UserCard({
  profile,
  showMatch = true,
}: {
  profile: ProfileWithSkills;
  showMatch?: boolean;
}) {
  return (
    <div className="card group flex flex-col p-5 transition hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <Image
          src={profile.avatar_url || avatarFallback(profile.full_name)}
          alt={profile.full_name}
          width={52}
          height={52}
          className="rounded-xl object-cover"
          style={{ width: 52, height: 52 }}
          unoptimized
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex min-w-0 items-center gap-1 font-semibold text-gray-900">
              <span className="truncate">{profile.full_name}</span>
              {/* Spec: kartochkada belgi faqat admin tasdiqlagan (is_verified) bo'lsa ko'rinadi */}
              <VerifiedBadge verified={!!profile.is_verified} size={16} />
            </h3>
            {showMatch && typeof profile.match_score === "number" && (
              <MatchBadge score={profile.match_score} />
            )}
          </div>
          <p className="truncate text-xs text-gray-500">
            {profile.city || "Shahar ko'rsatilmagan"}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <StarRating value={profile.trust_score} size={13} />
            <span className="text-[11px] text-gray-400">
              {profile.level}
            </span>
          </div>
        </div>
      </div>

      {profile.bio && (
        <p className="mt-3 line-clamp-2 text-sm text-gray-600">{profile.bio}</p>
      )}

      <div className="mt-3 space-y-2">
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-success-700">
            O&apos;rgata oladi
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.teach_skills.slice(0, 4).map((s) => (
              <span key={s.id} className="tag-teach">
                {s.name}
              </span>
            ))}
            {profile.teach_skills.length === 0 && (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-brand-700">
            O&apos;rganmoqchi
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.learn_skills.slice(0, 4).map((s) => (
              <span key={s.id} className="tag-learn">
                {s.name}
              </span>
            ))}
            {profile.learn_skills.length === 0 && (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
        </div>
      </div>

      <Link
        href={`/profile/${profile.id}`}
        className="btn-primary mt-4 w-full"
      >
        Bog&apos;lanish
      </Link>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import LevelProgress from "@/components/LevelProgress";
import BadgeGrid from "@/components/BadgeGrid";
import VideoCard from "@/components/VideoCard";
import ReviewButton from "./ReviewButton";
import FollowButton from "@/components/FollowButton";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getProfileWithSkills, getVideoStats, getFollowInfo } from "@/lib/queries";
import { avatarFallback, timeAgo } from "@/lib/utils";
import type { UserBadge, Video, Rating } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfileWithSkills(id);
  return { title: profile ? profile.full_name : "Profil" };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfileWithSkills(id);
  if (!profile) notFound();

  const supabase = await createClient();
  const me = await getCurrentUser();
  const isOwn = me?.id === profile.id;

  // Parallel: darslar soni, baholar, nishonlar, videolar
  const [lessonsRes, ratingsRes, badgesRes, videosRes] = await Promise.all([
    supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", profile.id)
      .eq("status", "completed"),
    supabase
      .from("ratings")
      .select("*, rater:profiles!ratings_rater_id_fkey(id, full_name, avatar_url)")
      .eq("rated_id", profile.id)
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("user_badges")
      .select("*, badge:badges(*)")
      .eq("user_id", profile.id),
    supabase
      .from("videos")
      .select("*, skill:skills(*)")
      .eq("uploader_id", profile.id)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
  ]);

  const lessonsCount = lessonsRes.count ?? 0;
  const ratings = (ratingsRes.data as unknown as Rating[]) ?? [];
  const badges = (badgesRes.data as unknown as UserBadge[]) ?? [];
  const videos = (videosRes.data as unknown as Video[]) ?? [];

  // Obuna ma'lumotlari va video statistikasi
  const [follow, vstats] = await Promise.all([
    getFollowInfo(profile.id, me?.id),
    getVideoStats(videos.map((v) => v.id), me?.id),
  ]);
  for (const v of videos) {
    const s = vstats.get(v.id);
    if (s) {
      v.likes = s.likes;
      v.views = s.views;
      v.liked = s.liked;
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-8">
        {/* Profil sarlavhasi */}
        <div className="card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-brand to-brand-700" />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <Image
                  src={profile.avatar_url || avatarFallback(profile.full_name)}
                  alt={profile.full_name}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-sm"
                  unoptimized
                />
                <div className="pb-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.full_name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {profile.city || "Shahar ko'rsatilmagan"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {isOwn ? (
                  <Link href="/onboarding" className="btn-outline">
                    Profilni tahrirlash
                  </Link>
                ) : (
                  <>
                    <FollowButton
                      profileId={profile.id}
                      initialFollowing={follow.isFollowing}
                      initialFollowers={follow.followers}
                    />
                    <ReviewButton
                      ratedId={profile.id}
                      ratedName={profile.full_name}
                    />
                    <Link
                      href={`/chat?with=${profile.id}`}
                      className="btn-primary"
                    >
                      Bog&apos;lanish
                    </Link>
                  </>
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="mt-4 max-w-2xl text-gray-600">{profile.bio}</p>
            )}

            {/* Obunachilar / obunalar */}
            <div className="mt-3 flex gap-4 text-sm text-gray-600">
              <Link
                href={`/profile/${profile.id}/connections?tab=followers`}
                className="hover:text-brand"
              >
                <b className="text-gray-900">{follow.followers}</b> obunachi
              </Link>
              <Link
                href={`/profile/${profile.id}/connections?tab=following`}
                className="hover:text-brand"
              >
                <b className="text-gray-900">{follow.following}</b> obuna
              </Link>
            </div>

            {/* Statistika qatori */}
            <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-md">
              <MiniStat label="Darslar" value={lessonsCount} />
              <MiniStat
                label="Reyting"
                value={profile.trust_score > 0 ? profile.trust_score.toFixed(1) : "—"}
              />
              <MiniStat label="Nishonlar" value={badges.length} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Chap ustun */}
          <div className="space-y-6 lg:col-span-2">
            {/* Ko'nikmalar */}
            <section className="card p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Ko&apos;nikmalar
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-success-700">
                    🎓 O&apos;rgata oladi
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.teach_skills.length > 0 ? (
                      profile.teach_skills.map((s) => (
                        <span key={s.id} className="tag-teach">
                          {s.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-brand-700">
                    📚 O&apos;rganmoqchi
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.learn_skills.length > 0 ? (
                      profile.learn_skills.map((s) => (
                        <span key={s.id} className="tag-learn">
                          {s.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Video darslar */}
            <section className="card p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Video darslar ({videos.length})
              </h2>
              {videos.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {videos.map((v) => (
                    <VideoCard key={v.id} video={v} showUploader={false} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Hali video dars yuklanmagan.
                </p>
              )}
            </section>

            {/* Izohlar */}
            <section className="card p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Izohlar ({ratings.length})
              </h2>
              {ratings.length > 0 ? (
                <ul className="space-y-4">
                  {ratings.map((r) => (
                    <li
                      key={r.id}
                      className="flex gap-3 border-b border-gray-50 pb-4 last:border-0"
                    >
                      <Image
                        src={
                          r.rater?.avatar_url ||
                          avatarFallback(r.rater?.full_name ?? "Z")
                        }
                        alt={r.rater?.full_name ?? ""}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                        unoptimized
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">
                            {r.rater?.full_name ?? "Foydalanuvchi"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {timeAgo(r.created_at)}
                          </span>
                        </div>
                        <StarRating value={r.score} size={14} />
                        {r.comment && (
                          <p className="mt-1 text-sm text-gray-600">
                            {r.comment}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">Hali izohlar yo&apos;q.</p>
              )}
            </section>
          </div>

          {/* O'ng ustun */}
          <div className="space-y-6">
            {/* Daraja */}
            <section className="card p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Daraja
              </h2>
              <LevelProgress xp={profile.xp} />
              {profile.streak_days > 0 && (
                <p className="mt-3 flex items-center gap-1 text-sm text-accent">
                  🔥 {profile.streak_days} kunlik streak
                </p>
              )}
            </section>

            {/* Nishonlar */}
            <section className="card p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Nishonlar
              </h2>
              <BadgeGrid badges={badges} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-center">
      <p className="text-xl font-bold text-brand">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

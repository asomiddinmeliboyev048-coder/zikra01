import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import LevelProgress from "@/components/LevelProgress";
import BadgeGrid from "@/components/BadgeGrid";
import VideoCard from "@/components/VideoCard";
import VideoUpload from "@/app/videos/VideoUpload";
import ReelUpload from "@/app/videos/ReelUpload";
import ReelGrid from "@/components/ReelGrid";
import SupportButton from "@/components/SupportButton";
import ReviewButton from "./ReviewButton";
import FollowButton from "@/components/FollowButton";
import Linkify from "@/components/Linkify";
import VerifiedBadge from "@/components/VerifiedBadge";
import CertificateViewer from "@/components/CertificateViewer";
import CertificateUpload from "@/components/CertificateUpload";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getProfileWithSkills, getVideoStats, getFollowInfo, getSkills, getUserReels, getReelStats } from "@/lib/queries";
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

  // Parallel: darslar soni, baholar, nishonlar, videolar, reels
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

  // Foydalanuvchining reels'larini olish
  const reels = await getUserReels(profile.id);
  
  // Obuna ma'lumotlari, video statistikasi va reel statistikasi
  const [follow, vstats, rstats] = await Promise.all([
    getFollowInfo(profile.id, me?.id),
    getVideoStats(videos.map((v) => v.id), me?.id),
    getReelStats(reels.map((r) => r.id), me?.id),
  ]);
  for (const v of videos) {
    const s = vstats.get(v.id);
    if (s) {
      v.likes = s.likes;
      v.views = s.views;
      v.liked = s.liked;
    }
  }
  for (const r of reels) {
    const s = rstats.get(r.id);
    if (s) {
      r.likes = s.likes;
      r.liked = s.liked;
    }
  }

  // "Hikoyalarim" — faqat o'z profilida, faol hikoyalar + ko'rish/like soni
  type MyStory = { id: string; media_url: string; media_type: string; created_at: string; views: number; likes: number };
  let myStories: MyStory[] = [];
  if (isOwn) {
    const { data: st } = await supabase
      .from("stories")
      .select("id, media_url, media_type, created_at")
      .eq("user_id", profile.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    const sList = (st as { id: string; media_url: string; media_type: string; created_at: string }[]) ?? [];
    if (sList.length > 0) {
      const sIds = sList.map((s) => s.id);
      const [{ data: vw }, { data: lk }] = await Promise.all([
        supabase.from("story_views").select("story_id").in("story_id", sIds),
        supabase.from("story_likes").select("story_id").in("story_id", sIds),
      ]);
      const vc = new Map<string, number>();
      const lc = new Map<string, number>();
      for (const r of (vw as { story_id: string }[]) ?? []) vc.set(r.story_id, (vc.get(r.story_id) ?? 0) + 1);
      for (const r of (lk as { story_id: string }[]) ?? []) lc.set(r.story_id, (lc.get(r.story_id) ?? 0) + 1);
      myStories = sList.map((s) => ({
        ...s,
        views: vc.get(s.id) ?? 0,
        likes: lc.get(s.id) ?? 0,
      }));
    }
  }

  // Video yuklash modal uchun ko'nikmalar — faqat o'z profilida kerak bo'ladi
  const skills = isOwn ? await getSkills() : [];

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
                  <h1 className="flex items-center gap-1.5 text-2xl font-bold text-gray-900">
                    {profile.full_name}
                    {/* Belgi faqat admin tasdiqlagan (is_verified) bo'lsa */}
                    <VerifiedBadge verified={!!profile.is_verified} size={22} />
                  </h1>
                  {profile.username && (
                    <p className="text-sm font-medium text-brand">@{profile.username}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {profile.city || "Shahar ko'rsatilmagan"}
                  </p>
                </div>
              </div>

              {/* Amal tugmalari — mobilda to'liq kenglikda ustma-ust, desktopda yonma-yon */}
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row [&>*]:w-full sm:[&>*]:w-auto">
                {isOwn ? (
                  <>
                    <Link href="/onboarding" className="btn-outline">
                      Profilni tahrirlash
                    </Link>
                    {/* Admin bilan bog'lanish (Support chat oynasini ochadi) */}
                    <SupportButton />
                  </>
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
              <p className="mt-4 max-w-2xl whitespace-pre-wrap text-gray-600">
                <Linkify text={profile.bio} />
              </p>
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

            {/* Hujjatlar / Sertifikatlar */}
            {(isOwn || profile.is_verified) && (
              <section className="card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Hujjatlar / Sertifikatlar
                  </h2>
                  <VerifiedBadge verified={!!profile.is_verified} size={18} />
                </div>

                {isOwn ? (
                  <CertificateUpload
                    certificateUrl={profile.certificate_url ?? null}
                    verified={!!profile.is_verified}
                    status={profile.verification_status ?? "none"}
                    ownerName={profile.full_name}
                  />
                ) : profile.is_verified && profile.certificate_url ? (
                  <div className="space-y-3">
                    <CertificateViewer
                      url={profile.certificate_url}
                      verified
                      ownerName={profile.full_name}
                    />
                    <p className="text-xs text-gray-500">
                      Bu sertifikat admin tomonidan tekshirilib tasdiqlangan.
                    </p>
                  </div>
                ) : null}
              </section>
            )}
            {isOwn && myStories.length > 0 && (
              <section className="card p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Hikoyalarim ({myStories.length} faol)
                </h2>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {myStories.map((s) => (
                    <div key={s.id} className="overflow-hidden rounded-xl border border-gray-100">
                      <div className="relative aspect-[9/16] bg-gray-900">
                        {s.media_type === "video" ? (
                          <video src={s.media_url} className="h-full w-full object-cover" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.media_url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex items-center justify-around p-1.5 text-xs text-gray-500">
                        <span>👁 {s.views}</span>
                        <span>❤ {s.likes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reels bo'limi */}
            {isOwn && (
              <section className="card p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Reels ({reels.length})
                  </h2>
                  {/* Reel yuklash tugmasi FAQAT o'z profilida ko'rinadi */}
                  <ReelUpload />
                </div>
                <ReelGrid reels={reels} />
              </section>
            )}

            {/* Video darslar */}
            <section className="card p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Video darslar ({videos.length})
                </h2>
                {/* Video yuklash tugmasi FAQAT o'z profilida ko'rinadi */}
                {isOwn && <VideoUpload skills={skills} />}
              </div>
              {videos.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {videos.map((v) => (
                    <VideoCard key={v.id} video={v} showUploader={false} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  {isOwn
                    ? "Hali video dars yuklamadingiz. Yuqoridagi tugma orqali birinchi darsingizni qo'shing."
                    : "Hali video dars yuklanmagan."}
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

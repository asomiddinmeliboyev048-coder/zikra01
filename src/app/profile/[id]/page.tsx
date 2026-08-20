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
import ProfileTabs from "@/components/ProfileTabs";

import { createClient } from "@/lib/supabase/server";

import {
  getCurrentUser,
  getProfileWithSkills,
  getVideoStats,
  getFollowInfo,
  getSkills,
  getUserReels,
  getReelStats,
} from "@/lib/queries";

import {
  avatarFallback,
  timeAgo,
} from "@/lib/utils";

import type {
  UserBadge,
  Video,
  Rating,
} from "@/lib/types";

/* ============================================================
   METADATA
============================================================ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const profile = await getProfileWithSkills(id);

  return {
    title: profile ? profile.full_name : "Profil",
  };
}

/* ============================================================
   PROFILE PAGE
============================================================ */

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* ==========================================================
     PROFILE
  ========================================================== */

  const profile = await getProfileWithSkills(id);

  if (!profile) {
    notFound();
  }

  const supabase = await createClient();

  const me = await getCurrentUser();

  const isOwn = me?.id === profile.id;

  /* ==========================================================
     PARALLEL QUERIES
  ========================================================== */

  const [
    lessonsRes,
    ratingsRes,
    badgesRes,
    videosRes,
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("teacher_id", profile.id)
      .eq("status", "completed"),

    supabase
      .from("ratings")
      .select(
        "*, rater:profiles!ratings_rater_id_fkey(id, full_name, avatar_url)"
      )
      .eq("rated_id", profile.id)
      .eq("is_visible", true)
      .order("created_at", {
        ascending: false,
      })
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
      .order("created_at", {
        ascending: false,
      }),
  ]);

  /* ==========================================================
     DATA
  ========================================================== */

  const lessonsCount = lessonsRes.count ?? 0;

  const ratings =
    (ratingsRes.data as unknown as Rating[]) ?? [];

  const badges =
    (badgesRes.data as unknown as UserBadge[]) ?? [];

  const videos =
    (videosRes.data as unknown as Video[]) ?? [];

  /* ==========================================================
     REELS
  ========================================================== */

  const reels = await getUserReels(profile.id);

  /* ==========================================================
     FOLLOW + VIDEO + REEL STATS
  ========================================================== */

  const [
    follow,
    vstats,
    rstats,
  ] = await Promise.all([
    getFollowInfo(profile.id, me?.id),

    getVideoStats(
      videos.map((v) => v.id),
      me?.id
    ),

    getReelStats(
      reels.map((r) => r.id),
      me?.id
    ),
  ]);

  /* ==========================================================
     APPLY VIDEO STATS
  ========================================================== */

  for (const v of videos) {
    const s = vstats.get(v.id);

    if (s) {
      v.likes = s.likes;
      v.views = s.views;
      v.liked = s.liked;
    }
  }

  /* ==========================================================
     APPLY REEL STATS
  ========================================================== */

  for (const r of reels) {
    const s = rstats.get(r.id);

    if (s) {
      r.likes = s.likes;
      r.liked = s.liked;
      r.views = s.views;
      r.comments = s.comments;
    }
  }

  /* ==========================================================
     STORIES
  ========================================================== */

  type MyStory = {
    id: string;
    media_url: string;
    media_type: string;
    created_at: string;
    views: number;
    likes: number;
  };

  let myStories: MyStory[] = [];

  if (isOwn) {
    const { data: st } =
      await supabase
        .from("stories")
        .select(
          "id, media_url, media_type, created_at"
        )
        .eq("user_id", profile.id)
        .gt(
          "expires_at",
          new Date().toISOString()
        )
        .order("created_at", {
          ascending: false,
        });

    const sList =
      (st as {
        id: string;
        media_url: string;
        media_type: string;
        created_at: string;
      }[]) ?? [];

    if (sList.length > 0) {
      const sIds = sList.map((s) => s.id);

      const [
        { data: vw },
        { data: lk },
      ] = await Promise.all([
        supabase
          .from("story_views")
          .select("story_id")
          .in("story_id", sIds),

        supabase
          .from("story_likes")
          .select("story_id")
          .in("story_id", sIds),
      ]);

      const vc = new Map<string, number>();
      const lc = new Map<string, number>();

      for (
        const r of
          (vw as {
            story_id: string;
          }[]) ?? []
      ) {
        vc.set(
          r.story_id,
          (vc.get(r.story_id) ?? 0) + 1
        );
      }

      for (
        const r of
          (lk as {
            story_id: string;
          }[]) ?? []
      ) {
        lc.set(
          r.story_id,
          (lc.get(r.story_id) ?? 0) + 1
        );
      }

      myStories = sList.map((s) => ({
        ...s,
        views: vc.get(s.id) ?? 0,
        likes: lc.get(s.id) ?? 0,
      }));
    }
  }

  /* ==========================================================
     SKILLS
  ========================================================== */

  const skills = isOwn
    ? await getSkills()
    : [];

  /* ==========================================================
     CERTIFICATE COUNT
  ========================================================== */

  const certificatesCount =
    profile.certificate_url ? 1 : 0;

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      <main className="container-app py-6 sm:py-8">

        {/* ======================================================
           PROFILE HEADER
        ====================================================== */}

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          {/* COVER */}

          <div className="h-20 bg-gradient-to-r from-brand via-brand-700 to-purple-600 sm:h-28" />

          <div className="px-4 pb-6 sm:px-8 sm:pb-8">

            <div className="-mt-10 sm:-mt-14">

              {/* =================================================
                 PROFILE TOP
              ================================================= */}

              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                {/* PROFILE LEFT */}

                <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-6">

                  {/* AVATAR */}

                  <div className="relative shrink-0">

                    <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-1">

                      <div className="rounded-full bg-white p-[3px]">

                        <Image
                          src={
                            profile.avatar_url ||
                            avatarFallback(
                              profile.full_name
                            )
                          }
                          alt={profile.full_name}
                          width={128}
                          height={128}
                          className="h-24 w-24 rounded-full object-cover sm:h-32 sm:w-32"
                          unoptimized
                        />

                      </div>

                    </div>

                  </div>

                  {/* USER INFO */}

                  <div className="min-w-0 flex-1 pt-1 sm:pt-3">

                    <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-gray-950 sm:text-2xl">

                      <span>
                        {profile.full_name}
                      </span>

                      <VerifiedBadge
                        verified={
                          !!profile.is_verified
                        }
                        size={22}
                      />

                    </h1>

                    {profile.username && (
                      <p className="mt-1 text-sm font-medium text-brand">
                        @{profile.username}
                      </p>
                    )}

                    <p className="mt-1 text-sm text-gray-500">
                      📍{" "}
                      {profile.city ||
                        "Shahar ko'rsatilmagan"}
                    </p>

                    {/* =================================================
                       FOLLOWERS / FOLLOWING
                       
                       MUHIM:
                       LINKLAR O'ZGARTIRILMADI
                    ================================================= */}

                    <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">

                      <Link
                        href={`/profile/${profile.id}/connections?tab=followers`}
                        className="rounded-lg px-1 py-1 transition hover:bg-gray-50 hover:text-brand"
                      >
                        <b className="text-gray-950">
                          {follow.followers}
                        </b>{" "}

                        <span className="text-gray-500">
                          obunachi
                        </span>
                      </Link>

                      <Link
                        href={`/profile/${profile.id}/connections?tab=following`}
                        className="rounded-lg px-1 py-1 transition hover:bg-gray-50 hover:text-brand"
                      >
                        <b className="text-gray-950">
                          {follow.following}
                        </b>{" "}

                        <span className="text-gray-500">
                          obuna
                        </span>
                      </Link>

                    </div>

                  </div>

                </div>

                {/* =================================================
                   ACTION BUTTONS
                ================================================= */}

                <div className="w-full lg:w-auto lg:min-w-[430px] lg:pt-4">

                  {isOwn ? (

                    <div className="flex w-full flex-row gap-2">

                      <Link
                        href="/onboarding"
                        className="
                          flex
                          flex-1
                          items-center
                          justify-center
                          rounded-xl
                          border
                          border-gray-200
                          bg-white
                          px-2
                          py-2
                          text-center
                          text-xs
                          font-medium
                          leading-tight
                          text-gray-800
                          shadow-sm
                          transition
                          hover:bg-gray-50
                          sm:text-sm
                        "
                      >
                        ✏️ Profilni tahrirlash
                      </Link>

                      <div className="flex-1">
                        <SupportButton />
                      </div>

                    </div>

                  ) : (

                    /* =================================================
                       OTHER PROFILE
                       MOBILE UI FIX
                    ================================================= */

                    <div className="grid w-full grid-cols-3 gap-2">

                      {/* FOLLOW */}

                      <div className="min-w-0">

                        <FollowButton
                          profileId={
                            profile.id
                          }
                          initialFollowing={
                            follow.isFollowing
                          }
                          initialFollowers={
                            follow.followers
                          }
                        />

                      </div>

                      {/* REVIEW */}

                      <div className="min-w-0">

                        <ReviewButton
                          ratedId={
                            profile.id
                          }
                          ratedName={
                            profile.full_name
                          }
                        />

                      </div>

                      {/* CONTACT */}

                      <Link
                        href={`/chat?with=${profile.id}`}
                        className="
                          flex
                          h-11
                          min-w-0
                          w-full
                          items-center
                          justify-center
                          rounded-xl
                          bg-brand
                          px-1
                          py-2
                          text-center
                          text-xs
                          font-medium
                          leading-tight
                          text-white
                          transition
                          hover:bg-brand-700
                        "
                      >
                        <span className="truncate">
                          💬 Bog&apos;lanish
                        </span>
                      </Link>

                    </div>

                  )}

                </div>

              </div>

              {/* =================================================
                 BIO
              ================================================= */}

              {profile.bio && (
                <div className="mt-5 max-w-2xl">

                  <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
                    <Linkify
                      text={profile.bio}
                    />
                  </p>

                </div>
              )}

              {/* =================================================
                 MAIN STATS
              ================================================= */}

              <div className="mt-6 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">

                <MiniStat
                  icon="📚"
                  label="Darslar"
                  value={lessonsCount}
                />

                <MiniStat
                  icon="⭐"
                  label="Reyting"
                  value={
                    profile.trust_score > 0
                      ? profile.trust_score.toFixed(1)
                      : "—"
                  }
                />

                <MiniStat
                  icon="🏆"
                  label="Nishonlar"
                  value={badges.length}
                />

              </div>

              {/* =================================================
                 LEVEL + BADGES
              ================================================= */}

              <div className="mt-6 grid gap-4 lg:grid-cols-2">

                {/* LEVEL */}

                <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4">

                  <div className="mb-3 flex items-center justify-between">

                    <h2 className="text-sm font-bold text-gray-900">
                      🎯 Daraja
                    </h2>

                    {profile.streak_days > 0 && (
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                        🔥{" "}
                        {profile.streak_days}{" "}
                        kunlik streak
                      </span>
                    )}

                  </div>

                  <LevelProgress
                    xp={profile.xp}
                  />

                </section>

                {/* BADGES */}

                <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4">

                  <div className="mb-3 flex items-center justify-between">

                    <h2 className="text-sm font-bold text-gray-900">
                      🏆 Nishonlar
                    </h2>

                    <span className="text-xs text-gray-400">
                      {badges.length} ta
                    </span>

                  </div>

                  <BadgeGrid
                    badges={badges}
                  />

                </section>

              </div>

              {/* =================================================
                 STORIES
              ================================================= */}

              {isOwn &&
                myStories.length > 0 && (
                  <section className="mt-7 border-t border-gray-100 pt-6">

                    <div className="mb-4 flex items-center justify-between">

                      <h2 className="text-sm font-bold text-gray-900">
                        Hikoyalarim
                      </h2>

                      <span className="text-xs text-gray-400">
                        {myStories.length} faol
                      </span>

                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2">

                      {myStories.map((s) => (
                        <div
                          key={s.id}
                          className="flex w-20 shrink-0 flex-col items-center"
                        >

                          <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]">

                            <div className="rounded-full bg-white p-[2px]">

                              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gray-900">

                                {s.media_type ===
                                "video" ? (
                                  <video
                                    src={
                                      s.media_url
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={
                                      s.media_url
                                    }
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                )}

                              </div>

                            </div>

                          </div>

                          <div className="mt-2 flex gap-1 text-[10px] text-gray-400">

                            <span>
                              👁 {s.views}
                            </span>

                            <span>
                              ❤️ {s.likes}
                            </span>

                          </div>

                        </div>
                      ))}

                    </div>

                  </section>
                )}

            </div>

          </div>

        </section>

        {/* ======================================================
           PROFILE TABS
        ====================================================== */}

        <ProfileTabs
          reelsCount={reels.length}
          videosCount={videos.length}
          certificatesCount={certificatesCount}
          reviewsCount={ratings.length}

          reels={
            isOwn || reels.length > 0 ? (

              <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">

                <div className="mb-5 flex items-center justify-between">

                  <div>

                    <h2 className="text-lg font-bold text-gray-950">
                      🎬 Reels
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      {reels.length} ta reels
                    </p>

                  </div>

                  {isOwn && <ReelUpload />}

                </div>

                <ReelGrid reels={reels} />

              </section>

            ) : (

              <EmptyState
                icon="🎬"
                title="Reels yo'q"
                description="Hali reels yuklanmagan."
              />

            )
          }

          videos={

            <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-bold text-gray-950">
                    📚 Video darslar
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    {videos.length} ta video dars
                  </p>

                </div>

                {isOwn && (
                  <VideoUpload
                    skills={skills}
                  />
                )}

              </div>

              {videos.length > 0 ? (

                <div className="grid gap-4 sm:grid-cols-2">

                  {videos.map((v) => (
                    <VideoCard
                      key={v.id}
                      video={v}
                      showUploader={false}
                    />
                  ))}

                </div>

              ) : (

                <EmptyState
                  icon="📚"
                  title="Video darslar yo'q"
                  description={
                    isOwn
                      ? "Hali video dars yuklamadingiz. Yuqoridagi tugma orqali birinchi darsingizni qo'shing."
                      : "Hali video dars yuklanmagan."
                  }
                />

              )}

            </section>

          }

          certificates={

            <div className="space-y-5">

              {/* SKILLS */}

              <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">

                <div className="mb-5">

                  <h2 className="text-lg font-bold text-gray-950">
                    🧠 Ko&apos;nikmalar
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    O&apos;rgata oladigan va o&apos;rganmoqchi bo&apos;lgan ko&apos;nikmalar
                  </p>

                </div>

                <div className="grid gap-6 md:grid-cols-2">

                  <div>

                    <p className="mb-3 text-sm font-bold text-success-700">
                      🎓 O&apos;rgata oladi
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {profile.teach_skills.length > 0 ? (

                        profile.teach_skills.map(
                          (s) => (
                            <span
                              key={s.id}
                              className="tag-teach"
                            >
                              {s.name}
                            </span>
                          )
                        )

                      ) : (

                        <span className="text-sm text-gray-400">
                          —
                        </span>

                      )}

                    </div>

                  </div>

                  <div>

                    <p className="mb-3 text-sm font-bold text-brand-700">
                      📚 O&apos;rganmoqchi
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {profile.learn_skills.length > 0 ? (

                        profile.learn_skills.map(
                          (s) => (
                            <span
                              key={s.id}
                              className="tag-learn"
                            >
                              {s.name}
                            </span>
                          )
                        )

                      ) : (

                        <span className="text-sm text-gray-400">
                          —
                        </span>

                      )}

                    </div>

                  </div>

                </div>

              </section>

              {/* CERTIFICATE */}

              {(isOwn || profile.is_verified) && (

                <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">

                  <div className="mb-5 flex items-center gap-2">

                    <div>

                      <h2 className="text-lg font-bold text-gray-950">
                        📜 Hujjatlar / Sertifikatlar
                      </h2>

                      <p className="mt-1 text-xs text-gray-400">
                        Tasdiqlangan hujjat va sertifikat
                      </p>

                    </div>

                    <VerifiedBadge
                      verified={
                        !!profile.is_verified
                      }
                      size={18}
                    />

                  </div>

                  {isOwn ? (

                    <CertificateUpload
                      certificateUrl={
                        profile.certificate_url ??
                        null
                      }
                      verified={
                        !!profile.is_verified
                      }
                      status={
                        profile.verification_status ??
                        "none"
                      }
                      ownerName={
                        profile.full_name
                      }
                    />

                  ) : profile.is_verified &&
                    profile.certificate_url ? (

                    <div className="space-y-3">

                      <CertificateViewer
                        url={
                          profile.certificate_url
                        }
                        verified
                        ownerName={
                          profile.full_name
                        }
                      />

                      <p className="text-xs text-gray-500">
                        Bu sertifikat admin tomonidan tekshirilib tasdiqlangan.
                      </p>

                    </div>

                  ) : null}

                </section>

              )}

            </div>

          }

          reviews={

            <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-bold text-gray-950">
                    ⭐ Izohlar & Baholar
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    {ratings.length} ta baho
                  </p>

                </div>

                {profile.trust_score > 0 && (

                  <div className="rounded-2xl bg-yellow-50 px-4 py-2 text-center">

                    <p className="text-lg font-bold text-yellow-600">
                      {profile.trust_score.toFixed(1)}
                    </p>

                    <p className="text-[10px] text-yellow-600">
                      umumiy reyting
                    </p>

                  </div>

                )}

              </div>

              {ratings.length > 0 ? (

                <ul className="space-y-0">

                  {ratings.map((r) => (

                    <li
                      key={r.id}
                      className="flex gap-3 border-b border-gray-100 py-5 first:pt-0 last:border-0"
                    >

                      <Image
                        src={
                          r.rater?.avatar_url ||
                          avatarFallback(
                            r.rater?.full_name ??
                            "Z"
                          )
                        }
                        alt={
                          r.rater?.full_name ??
                          ""
                        }
                        width={42}
                        height={42}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                        unoptimized
                      />

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <span className="text-sm font-bold text-gray-900">
                              {r.rater?.full_name ??
                                "Foydalanuvchi"}
                            </span>

                            <div className="mt-1">

                              <StarRating
                                value={r.score}
                                size={14}
                              />

                            </div>

                          </div>

                          <span className="shrink-0 text-xs text-gray-400">
                            {timeAgo(
                              r.created_at
                            )}
                          </span>

                        </div>

                        {r.comment && (
                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {r.comment}
                          </p>
                        )}

                      </div>

                    </li>

                  ))}

                </ul>

              ) : (

                <EmptyState
                  icon="⭐"
                  title="Hali izohlar yo'q"
                  description="Bu foydalanuvchi haqida hali hech qanday izoh qoldirilmagan."
                />

              )}

            </section>

          }

        />

      </main>
    </div>
  );
}

/* ============================================================
   MINI STAT
============================================================ */

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 text-center transition hover:bg-white">

      <div className="mb-1 text-sm">
        {icon}
      </div>

      <p className="text-lg font-extrabold text-gray-950 sm:text-xl">
        {value}
      </p>

      <p className="text-[11px] text-gray-500 sm:text-xs">
        {label}
      </p>

    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white px-5 text-center">

      <div className="mb-3 text-4xl">
        {icon}
      </div>

      <h3 className="text-sm font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-1 max-w-md text-xs leading-5 text-gray-400">
        {description}
      </p>

    </div>
  );
}

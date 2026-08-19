"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import StarRating from "@/components/StarRating";
import LevelProgress from "@/components/LevelProgress";
import BadgeGrid from "@/components/BadgeGrid";
import VideoCard from "@/components/VideoCard";
import VideoUpload from "@/app/videos/VideoUpload";
import ReelUpload from "@/app/videos/ReelUpload";
import ReelGrid from "@/components/ReelGrid";
import SupportButton from "@/components/SupportButton";
import FollowButton from "@/components/FollowButton";
import Linkify from "@/components/Linkify";
import VerifiedBadge from "@/components/VerifiedBadge";
import CertificateViewer from "@/components/CertificateViewer";
import CertificateUpload from "@/components/CertificateUpload";

import type {
  UserBadge,
  Video,
  Rating,
} from "@/lib/types";

import { avatarFallback, timeAgo } from "@/lib/utils";

type MyStory = {
  id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  views: number;
  likes: number;
};

type ProfileClientProps = {
  profile: any;
  isOwn: boolean;

  follow: {
    isFollowing: boolean;
    followers: number;
    following: number;
  };

  lessonsCount: number;

  ratings: Rating[];

  badges: UserBadge[];

  videos: Video[];

  reels: any[];

  myStories: MyStory[];

  skills: any[];
};

export default function ProfileClient({
  profile,
  isOwn,
  follow,
  lessonsCount,
  ratings,
  badges,
  videos,
  reels,
  myStories,
  skills,
}: ProfileClientProps) {
  /*
   * ============================================================
   * ACTIVE TAB
   * ============================================================
   */

  const [activeTab, setActiveTab] =
    useState("reels");

  return (
    <div className="w-full">
      {/* ========================================================
          INSTAGRAM STYLE PROFILE HEADER
          ======================================================== */}

      <section className="border-b border-gray-200 bg-white px-4 pb-5 pt-5 sm:rounded-b-2xl sm:border-x sm:px-6 sm:pt-7">
        {/* MOBILE / DESKTOP PROFILE TOP */}

        <div className="flex items-start gap-4">
          {/* AVATAR */}

          <div className="relative shrink-0">
            <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]">
              <div className="rounded-full bg-white p-[2px]">
                <Image
                  src={
                    profile.avatar_url ||
                    avatarFallback(
                      profile.full_name
                    )
                  }
                  alt={profile.full_name}
                  width={96}
                  height={96}
                  className="h-[78px] w-[78px] rounded-full object-cover sm:h-24 sm:w-24"
                  unoptimized
                />
              </div>
            </div>

            {/* STORY INDICATOR */}

            {isOwn &&
              myStories.length > 0 && (
                <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand text-xs text-white">
                  +
                </span>
              )}
          </div>

          {/* STATISTICS */}

          <div className="grid flex-1 grid-cols-3 pt-3 text-center">
            <ProfileStat
              value={reels.length}
              label="Reels"
            />

            <Link
              href={`/profile/${profile.id}/connections?tab=followers`}
              className="rounded-lg transition hover:bg-gray-50 active:bg-gray-100"
            >
              <ProfileStat
                value={follow.followers}
                label="Obunachi"
              />
            </Link>

            <Link
              href={`/profile/${profile.id}/connections?tab=following`}
              className="rounded-lg transition hover:bg-gray-50 active:bg-gray-100"
            >
              <ProfileStat
                value={follow.following}
                label="Obuna"
              />
            </Link>
          </div>
        </div>

        {/* NAME / USERNAME */}

        <div className="mt-4">
          <h1 className="flex items-center gap-1.5 text-base font-bold text-gray-950 sm:text-lg">
            {profile.full_name}

            <VerifiedBadge
              verified={!!profile.is_verified}
              size={18}
            />
          </h1>

          {profile.username && (
            <p className="mt-0.5 text-sm text-gray-500">
              @{profile.username}
            </p>
          )}

          <p className="mt-1 text-sm text-gray-500">
            📍{" "}
            {profile.city ||
              "Shahar ko'rsatilmagan"}
          </p>
        </div>

        {/* BIO */}

        {profile.bio && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-5 text-gray-700">
            <Linkify text={profile.bio} />
          </p>
        )}

        {/* EXTRA PROFILE INFO */}

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-gray-100 px-3 py-1">
            🎓 {lessonsCount} dars
          </span>

          <span className="rounded-full bg-gray-100 px-3 py-1">
            🏆 {badges.length} nishon
          </span>

          {profile.streak_days > 0 && (
            <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-600">
              🔥 {profile.streak_days} kun
            </span>
          )}
        </div>

        {/* ACTION BUTTONS */}

        <div className="mt-4 grid gap-2">
          {isOwn ? (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/onboarding"
                className="flex min-h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Profilni tahrirlash
              </Link>

              <div className="min-w-0">
                <SupportButton />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="min-w-0">
                <FollowButton
                  profileId={profile.id}
                  initialFollowing={
                    follow.isFollowing
                  }
                  initialFollowers={
                    follow.followers
                  }
                />
              </div>

              <div className="min-w-0">
                <ReviewButton
                  ratedId={profile.id}
                  ratedName={
                    profile.full_name
                  }
                />
              </div>

              <Link
                href={`/chat?with=${profile.id}`}
                className="flex min-h-10 items-center justify-center rounded-lg bg-gray-100 px-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-200 sm:text-sm"
              >
                Bog&apos;lanish
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          STORIES
          ======================================================== */}

      {isOwn && myStories.length > 0 && (
        <section className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex gap-4 overflow-hidden">
            {myStories.map((story) => (
              <div
                key={story.id}
                className="w-16 shrink-0 text-center"
              >
                <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                  <div className="rounded-full bg-white p-[2px]">
                    <div className="relative h-14 w-14 overflow-hidden rounded-full bg-gray-100">
                      {story.media_type ===
                      "video" ? (
                        <video
                          src={story.media_url}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            story.media_url
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-1 truncate text-[10px] text-gray-500">
                  Hikoya
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          TABS
          ======================================================== */}

      <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="grid grid-cols-4">
          <ProfileTab
            active={activeTab === "reels"}
            onClick={() =>
              setActiveTab("reels")
            }
            icon="🎬"
            label="Reels"
            count={reels.length}
          />

          <ProfileTab
            active={activeTab === "videos"}
            onClick={() =>
              setActiveTab("videos")
            }
            icon="📚"
            label="Darslar"
            count={videos.length}
          />

          <ProfileTab
            active={
              activeTab === "certificates"
            }
            onClick={() =>
              setActiveTab("certificates")
            }
            icon="📜"
            label="Sertifikat"
            count={
              profile.certificate_url
                ? 1
                : 0
            }
          />

          <ProfileTab
            active={activeTab === "reviews"}
            onClick={() =>
              setActiveTab("reviews")
            }
            icon="⭐"
            label="Izohlar"
            count={ratings.length}
          />
        </div>
      </nav>

      {/* ========================================================
          ONLY ACTIVE TAB IS RENDERED
          ======================================================== */}

      <div className="min-h-[300px]">
        {/* ======================================================
            REELS
            ====================================================== */}

        {activeTab === "reels" && (
          <section className="px-0 py-4 sm:px-0 sm:py-6">
            <div className="mb-4 flex items-center justify-between px-4 sm:px-2">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Reels
                </h2>

                <p className="text-xs text-gray-500">
                  {reels.length} ta video
                </p>
              </div>

              {isOwn && (
                <ReelUpload />
              )}
            </div>

            {reels.length > 0 ? (
              <div className="overflow-hidden">
                <ReelGrid reels={reels} />
              </div>
            ) : (
              <EmptyState
                icon="🎬"
                title="Hali Reels yo'q"
                text={
                  isOwn
                    ? "Birinchi Reels videongizni yuklang."
                    : "Bu foydalanuvchi hali Reels joylamagan."
                }
              />
            )}
          </section>
        )}

        {/* ======================================================
            VIDEOS
            ====================================================== */}

        {activeTab === "videos" && (
          <section className="px-4 py-5 sm:px-2 sm:py-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Video darslar
                </h2>

                <p className="text-xs text-gray-500">
                  {videos.length} ta dars
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
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    showUploader={false}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="📚"
                title="Video darslar yo'q"
                text={
                  isOwn
                    ? "Yuqoridagi tugma orqali birinchi darsingizni qo'shing."
                    : "Hali video dars yuklanmagan."
                }
              />
            )}
          </section>
        )}

        {/* ======================================================
            CERTIFICATES + SKILLS + STORIES + LEVEL + BADGES
            ====================================================== */}

        {activeTab ===
          "certificates" && (
          <section className="space-y-5 px-4 py-5 sm:px-2 sm:py-6">
            {/* SKILLS */}

            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-5 text-base font-bold text-gray-900">
                Ko&apos;nikmalar
              </h2>

              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-semibold text-success-700">
                    🎓 O&apos;rgata oladi
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {profile.teach_skills
                      ?.length > 0 ? (
                      profile.teach_skills.map(
                        (skill: any) => (
                          <span
                            key={skill.id}
                            className="tag-teach"
                          >
                            {skill.name}
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
                  <p className="mb-2 text-sm font-semibold text-brand-700">
                    📚 O&apos;rganmoqchi
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {profile.learn_skills
                      ?.length > 0 ? (
                      profile.learn_skills.map(
                        (skill: any) => (
                          <span
                            key={skill.id}
                            className="tag-learn"
                          >
                            {skill.name}
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

            {(isOwn ||
              profile.is_verified) && (
              <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">
                    Hujjatlar / Sertifikatlar
                  </h2>

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
                      Bu sertifikat admin
                      tomonidan tekshirilib
                      tasdiqlangan.
                    </p>
                  </div>
                ) : null}
              </section>
            )}

            {/* STORIES */}

            {isOwn &&
              myStories.length > 0 && (
                <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                  <h2 className="mb-4 text-base font-bold text-gray-900">
                    Hikoyalarim (
                    {myStories.length} faol)
                  </h2>

                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {myStories.map(
                      (story) => (
                        <div
                          key={story.id}
                          className="overflow-hidden rounded-xl border border-gray-100"
                        >
                          <div className="relative aspect-[9/16] bg-gray-900">
                            {story.media_type ===
                            "video" ? (
                              <video
                                src={
                                  story.media_url
                                }
                                className="h-full w-full object-cover"
                                controls
                              />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  story.media_url
                                }
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>

                          <div className="flex items-center justify-around p-1.5 text-xs text-gray-500">
                            <span>
                              👁{" "}
                              {story.views}
                            </span>

                            <span>
                              ❤{" "}
                              {story.likes}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>
              )}

            {/* LEVEL */}

            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-4 text-base font-bold text-gray-900">
                Daraja
              </h2>

              <LevelProgress
                xp={profile.xp}
              />

              {profile.streak_days >
                0 && (
                <p className="mt-3 flex items-center gap-1 text-sm text-accent">
                  🔥{" "}
                  {profile.streak_days} kunlik
                  streak
                </p>
              )}
            </section>

            {/* BADGES */}

            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-4 text-base font-bold text-gray-900">
                Nishonlar
              </h2>

              <BadgeGrid
                badges={badges}
              />
            </section>
          </section>
        )}

        {/* ======================================================
            REVIEWS
            ====================================================== */}

        {activeTab === "reviews" && (
          <section className="px-4 py-5 sm:px-2 sm:py-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-900">
                Izohlar
              </h2>

              <p className="text-xs text-gray-500">
                {ratings.length} ta baho
              </p>
            </div>

            {ratings.length > 0 ? (
              <ul className="space-y-4">
                {ratings.map((rating) => (
                  <li
                    key={rating.id}
                    className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <Image
                      src={
                        rating.rater
                          ?.avatar_url ||
                        avatarFallback(
                          rating.rater
                            ?.full_name ??
                            "Z"
                        )
                      }
                      alt={
                        rating.rater
                          ?.full_name ?? ""
                      }
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                      unoptimized
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {rating.rater
                            ?.full_name ??
                            "Foydalanuvchi"}
                        </span>

                        <span className="shrink-0 text-xs text-gray-400">
                          {timeAgo(
                            rating.created_at
                          )}
                        </span>
                      </div>

                      <div className="mt-1">
                        <StarRating
                          value={
                            rating.score
                          }
                          size={14}
                        />
                      </div>

                      {rating.comment && (
                        <p className="mt-2 text-sm leading-5 text-gray-600">
                          {rating.comment}
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
                text="Bu profilga hali baho yoki izoh qoldirilmagan."
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * PROFILE STAT
 * ============================================================
 */

function ProfileStat({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="px-1">
      <p className="text-base font-bold text-gray-950 sm:text-lg">
        {value}
      </p>

      <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * TAB BUTTON
 * ============================================================
 */

function ProfileTab({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative flex min-w-0 flex-col items-center justify-center gap-0.5 py-3 text-center transition",
        active
          ? "text-gray-950"
          : "text-gray-400 hover:text-gray-700",
      ].join(" ")}
    >
      <span className="text-base leading-none sm:text-lg">
        {icon}
      </span>

      <span className="max-w-full truncate px-1 text-[9px] font-semibold sm:text-[11px]">
        {label}
      </span>

      <span className="text-[9px] text-gray-400">
        {count}
      </span>

      {active && (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-gray-950" />
      )}
    </button>
  );
}

/*
 * ============================================================
 * EMPTY STATE
 * ============================================================
 */

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
        {icon}
      </div>

      <h3 className="text-sm font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500">
        {text}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * REVIEW BUTTON
 * ============================================================
 *
 * Bu component sizning mavjud ReviewButton.tsx faylingizdan
 * import qilinadi. Quyidagi wrapper faqat TypeScript/React
 * importni ajratib turish uchun.
 */

import ReviewButton from "./ReviewButton";

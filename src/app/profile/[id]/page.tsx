import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/components/Navbar";
import ReelGrid from "@/components/ReelGrid";

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

import type { UserBadge, Video, Rating } from "@/lib/types";

import ProfileClient from "./ProfileClient";

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

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /*
   * ============================================================
   * PROFILE
   * ============================================================
   */

  const profile = await getProfileWithSkills(id);

  if (!profile) {
    notFound();
  }

  const supabase = await createClient();

  const me = await getCurrentUser();

  const isOwn = me?.id === profile.id;

  /*
   * ============================================================
   * ASOSIY MA'LUMOTLAR
   * ============================================================
   */

  const [lessonsRes, ratingsRes, badgesRes, videosRes] =
    await Promise.all([
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

  const lessonsCount = lessonsRes.count ?? 0;

  const ratings =
    (ratingsRes.data as unknown as Rating[]) ?? [];

  const badges =
    (badgesRes.data as unknown as UserBadge[]) ?? [];

  const videos =
    (videosRes.data as unknown as Video[]) ?? [];

  /*
   * ============================================================
   * REELS
   * ============================================================
   */

  const reels = await getUserReels(profile.id);

  /*
   * ============================================================
   * FOLLOW + VIDEO + REEL STATISTICS
   * ============================================================
   */

  const [follow, vstats, rstats] = await Promise.all([
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

  /*
   * ============================================================
   * VIDEO STATISTICS
   * ============================================================
   */

  for (const video of videos) {
    const stats = vstats.get(video.id);

    if (stats) {
      video.likes = stats.likes;
      video.views = stats.views;
      video.liked = stats.liked;
    }
  }

  /*
   * ============================================================
   * REEL STATISTICS
   * ============================================================
   */

  for (const reel of reels) {
    const stats = rstats.get(reel.id);

    if (stats) {
      reel.likes = stats.likes;
      reel.liked = stats.liked;
      reel.views = stats.views;
      reel.comments = stats.comments;
    }
  }

  /*
   * ============================================================
   * STORIES
   * Faqat o'z profilida
   * ============================================================
   */

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
    const { data: st } = await supabase
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

    const storyList =
      (st as {
        id: string;
        media_url: string;
        media_type: string;
        created_at: string;
      }[]) ?? [];

    if (storyList.length > 0) {
      const storyIds = storyList.map(
        (story) => story.id
      );

      const [{ data: views }, { data: likes }] =
        await Promise.all([
          supabase
            .from("story_views")
            .select("story_id")
            .in("story_id", storyIds),

          supabase
            .from("story_likes")
            .select("story_id")
            .in("story_id", storyIds),
        ]);

      const viewCounts = new Map<
        string,
        number
      >();

      const likeCounts = new Map<
        string,
        number
      >();

      for (const row of
        (views as { story_id: string }[]) ?? []) {
        viewCounts.set(
          row.story_id,
          (viewCounts.get(row.story_id) ?? 0) + 1
        );
      }

      for (const row of
        (likes as { story_id: string }[]) ?? []) {
        likeCounts.set(
          row.story_id,
          (likeCounts.get(row.story_id) ?? 0) + 1
        );
      }

      myStories = storyList.map((story) => ({
        ...story,
        views:
          viewCounts.get(story.id) ?? 0,
        likes:
          likeCounts.get(story.id) ?? 0,
      }));
    }
  }

  /*
   * ============================================================
   * SKILLS
   * Faqat o'z profilida video upload uchun
   * ============================================================
   */

  const skills = isOwn
    ? await getSkills()
    : [];

  /*
   * ============================================================
   * CLIENT UI
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-0 pb-10 sm:px-4 lg:px-6">
        <ProfileClient
          profile={profile}
          isOwn={isOwn}
          follow={follow}
          lessonsCount={lessonsCount}
          ratings={ratings}
          badges={badges}
          videos={videos}
          reels={reels}
          myStories={myStories}
          skills={skills}
        />
      </main>
    </div>
  );
}

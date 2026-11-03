import type { Metadata } from "next";
import { redirect } from "next/navigation";
import VideoBrowser from "./VideoBrowser";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentProfile,
  getVideoStats,
  getReels,
  getReelStats,
} from "@/lib/queries";
import type { Video } from "@/lib/types";

export const metadata: Metadata = { title: "Video darslar" };
export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const supabase = await createClient();

  const [{ data: videosData }, reels] = await Promise.all([
    supabase
      .from("videos")
      .select("*, uploader:profiles!videos_uploader_id_fkey(id, full_name, avatar_url)")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    getReels(),
  ]);

  const videos = (videosData as unknown as Video[]) ?? [];
  const ids = videos.map((v) => v.id);

  const [stats, reelStats] = await Promise.all([
    getVideoStats(ids, me.id),
    getReelStats(reels.map((r) => r.id), me.id),
  ]);

  // Sifatli ko'rishlar — mavjud tavsiya algoritmi saqlanadi.
  const qualityViews = new Map<string, number>();
  if (ids.length > 0) {
    const { data: vw } = await supabase
      .from("video_views")
      .select("video_id, watch_percentage")
      .in("video_id", ids)
      .gte("watch_percentage", 70);
    for (const r of (vw as { video_id: string }[]) ?? []) {
      qualityViews.set(r.video_id, (qualityViews.get(r.video_id) ?? 0) + 1);
    }
  }

  for (const video of videos) {
    const stat = stats.get(video.id);
    if (stat) {
      video.likes = stat.likes;
      video.views = stat.views;
      video.liked = stat.liked;
    }
  }

  for (const reel of reels) {
    const stat = reelStats.get(reel.id);
    if (stat) {
      reel.likes = stat.likes;
      reel.liked = stat.liked;
      reel.views = stat.views;
      reel.comments = stat.comments;
    }
  }

  const now = Date.now();
  const score = (video: Video) => {
    const quality = qualityViews.get(video.id) ?? 0;
    const ageDays = (now - new Date(video.created_at).getTime()) / 86400000;
    const recencyBoost = Math.max(0, 7 - ageDays);
    return quality * 5 + (video.likes ?? 0) * 3 + (video.views ?? 0) + recencyBoost;
  };
  videos.sort((a, b) => score(b) - score(a));

  return (
    <VideoBrowser
      navbar={<Navbar />}
      videos={videos}
      reels={reels}
      profile={{
        id: me.id,
        full_name: me.full_name,
        avatar_url: me.avatar_url,
      }}
    />
  );
}

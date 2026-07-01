import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries";
import ReelsViewer, { type ReelView } from "./ReelsViewer";

export const metadata: Metadata = { title: "Reels" };
export const dynamic = "force-dynamic";

interface ReelRow {
  id: string;
  user_id: string;
  video_url: string;
  description: string | null;
  created_at: string;
}

export default async function ReelsPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const supabase = await createClient();

  const { data: reelsData } = await supabase
    .from("reels")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);

  const reels = (reelsData as ReelRow[]) ?? [];
  const reelIds = reels.map((r) => r.id);
  const userIds = [...new Set(reels.map((r) => r.user_id))];

  // Muallif profillari
  const profilesMap = new Map<
    string,
    { id: string; full_name: string | null; avatar_url: string | null }
  >();
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);
    for (const p of (profs as {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    }[]) ?? []) {
      profilesMap.set(p.id, p);
    }
  }

  // Like va ko'rishlar statistikasi
  const likeCount = new Map<string, number>();
  const likedByMe = new Set<string>();
  const viewCount = new Map<string, number>();

  if (reelIds.length > 0) {
    const [{ data: likes }, { data: views }] = await Promise.all([
      supabase.from("reel_likes").select("reel_id, user_id").in("reel_id", reelIds),
      supabase.from("reel_views").select("reel_id").in("reel_id", reelIds),
    ]);
    for (const l of (likes as { reel_id: string; user_id: string }[]) ?? []) {
      likeCount.set(l.reel_id, (likeCount.get(l.reel_id) ?? 0) + 1);
      if (l.user_id === me.id) likedByMe.add(l.reel_id);
    }
    for (const v of (views as { reel_id: string }[]) ?? []) {
      viewCount.set(v.reel_id, (viewCount.get(v.reel_id) ?? 0) + 1);
    }
  }

  const items: ReelView[] = reels.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    video_url: r.video_url,
    description: r.description,
    created_at: r.created_at,
    uploader: profilesMap.get(r.user_id) ?? null,
    likeCount: likeCount.get(r.id) ?? 0,
    viewCount: viewCount.get(r.id) ?? 0,
    likedByMe: likedByMe.has(r.id),
  }));

  return <ReelsViewer reels={items} />;
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import VideoBrowser from "./VideoBrowser";
import ReelUpload from "./ReelUpload";
import ReelsFeed, { type ReelItem } from "./ReelsFeed";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getVideoStats } from "@/lib/queries";
import type { Video } from "@/lib/types";

export const metadata: Metadata = { title: "Video darslar" };
export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const supabase = await createClient();

  const { data: videosData } = await supabase
    .from("videos")
    .select("*, uploader:profiles!videos_uploader_id_fkey(id, full_name, avatar_url)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const videos = (videosData as unknown as Video[]) ?? [];
  const ids = videos.map((v) => v.id);

  // Like/ko'rish statistikasi
  const stats = await getVideoStats(ids, me.id);

  // "Sifatli ko'rish" (70%+) sonini hisoblash — algoritm uchun
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

  const now = Date.now();
  for (const v of videos) {
    const s = stats.get(v.id);
    if (s) {
      v.likes = s.likes;
      v.views = s.views;
      v.liked = s.liked;
    }
  }

  // YouTube uslubidagi tartiblash:
  //   1) eng ko'p oxirigacha ko'rilgan (sifatli ko'rishlar)
  //   2) eng ko'p like
  //   3) eng yangi
  const score = (v: Video) => {
    const quality = qualityViews.get(v.id) ?? 0;
    const ageDays = (now - new Date(v.created_at).getTime()) / 86400000;
    const recencyBoost = Math.max(0, 7 - ageDays); // 1 haftagacha yangi bonus
    return quality * 5 + (v.likes ?? 0) * 3 + (v.views ?? 0) * 1 + recencyBoost;
  };
  videos.sort((a, b) => score(b) - score(a));

  // --- Reels (qisqa videolar, S3'da) ---
  const { data: reelsData } = await supabase
    .from("reels")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);

  const rawReels = (reelsData as Omit<ReelItem, "uploader">[]) ?? [];
  const reelUserIds = [...new Set(rawReels.map((r) => r.user_id))];

  const profilesMap = new Map<
    string,
    { id: string; full_name: string | null; avatar_url: string | null }
  >();
  if (reelUserIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", reelUserIds);
    for (const p of (profs as { id: string; full_name: string | null; avatar_url: string | null }[]) ?? []) {
      profilesMap.set(p.id, p);
    }
  }

  const reels: ReelItem[] = rawReels.map((r) => ({
    ...r,
    uploader: profilesMap.get(r.user_id) ?? null,
  }));

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Video darslar</h1>
            <p className="mt-1 text-sm text-gray-500">
              Boshqalardan o&apos;rganing. O&apos;z darsingizni ulashish uchun{" "}
              <Link href={`/profile/${me.id}`} className="font-medium text-brand hover:underline">
                profilingizga
              </Link>{" "}
              o&apos;ting.
            </p>
          </div>
          <ReelUpload />
        </div>

        <VideoBrowser videos={videos} />

        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Reels — qisqa videolar</h2>
            <Link href="/reels" className="text-sm font-medium text-brand hover:underline">
              To&apos;liq ekranda ko&apos;rish →
            </Link>
          </div>
          <ReelsFeed reels={reels} currentUserId={me.id} />
        </section>
      </main>
    </div>
  );
}

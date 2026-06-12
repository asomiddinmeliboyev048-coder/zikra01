import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import VideoUpload from "./VideoUpload";
import VideoBrowser from "./VideoBrowser";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getSkills, getVideoStats } from "@/lib/queries";
import type { Video } from "@/lib/types";

export const metadata: Metadata = { title: "Video darslar" };
export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const supabase = await createClient();

  const [{ data: videosData }, skills] = await Promise.all([
    supabase
      .from("videos")
      .select("*, uploader:profiles!videos_uploader_id_fkey(id, full_name, avatar_url)")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    getSkills(),
  ]);

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

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Video darslar</h1>
            <p className="mt-1 text-sm text-gray-500">
              Boshqalardan o&apos;rganing yoki o&apos;z darsingizni ulashing.
            </p>
          </div>
          <VideoUpload skills={skills} />
        </div>

        <VideoBrowser videos={videos} />
      </main>
    </div>
  );
}

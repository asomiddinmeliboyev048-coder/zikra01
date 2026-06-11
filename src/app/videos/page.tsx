import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import VideoCard from "@/components/VideoCard";
import VideoUpload from "./VideoUpload";
import VideoFilter from "./VideoFilter";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getSkills, getVideoStats } from "@/lib/queries";
import type { Video } from "@/lib/types";

export const metadata: Metadata = { title: "Video darslar" };
export const dynamic = "force-dynamic";

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const { skill } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("videos")
    .select("*, skill:skills(*), uploader:profiles!videos_uploader_id_fkey(id, full_name, avatar_url)")
    .eq("status", "published");

  if (skill) query = query.eq("skill_id", skill);

  const [{ data: videosData }, skills] = await Promise.all([
    query.order("created_at", { ascending: false }),
    getSkills(),
  ]);

  const videos = (videosData as unknown as Video[]) ?? [];

  // Like/ko'rish statistikasi
  const stats = await getVideoStats(
    videos.map((v) => v.id),
    me.id
  );
  for (const v of videos) {
    const s = stats.get(v.id);
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Video darslar</h1>
            <p className="mt-1 text-sm text-gray-500">
              Boshqalardan o&apos;rganing yoki o&apos;z darsingizni ulashing.
            </p>
          </div>
          <VideoUpload skills={skills} />
        </div>

        <VideoFilter skills={skills} active={skill ?? ""} />

        {videos.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        ) : (
          <div className="card mt-6 flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-4xl">🎬</span>
            <p className="font-medium text-gray-700">Hali video darslar yo&apos;q</p>
            <p className="text-sm text-gray-500">
              Birinchi bo&apos;lib o&apos;z darsingizni yuklang!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

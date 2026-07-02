import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ReelsPlayer from "@/components/ReelsPlayer";
import { getCurrentProfile, getReels, getReelStats } from "@/lib/queries";

export const metadata: Metadata = { title: "Reels" };
export const dynamic = "force-dynamic";

export default async function ReelsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const { start } = await searchParams;

  // Barcha reels'larni olish
  const reels = await getReels();

  if (reels.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">Hali reels mavjud emas</p>
          <p className="mt-2 text-sm text-gray-400">
            Birinchi bo&apos;lib reel yuklang!
          </p>
        </div>
      </div>
    );
  }

  // Like statistikasini olish
  const reelIds = reels.map((r) => r.id);
  const stats = await getReelStats(reelIds, me.id);

  // Statistikani reels'larga qo'shish
  for (const reel of reels) {
    const s = stats.get(reel.id);
    if (s) {
      reel.likes = s.likes;
      reel.liked = s.liked;
    }
  }

  // Grid'dan kelgan bo'lsa (?start=<id>) — o'sha reeldan boshlaymiz
  const initialIndex = start ? Math.max(0, reels.findIndex((r) => r.id === start)) : 0;

  return <ReelsPlayer reels={reels} initialIndex={initialIndex} />;
}

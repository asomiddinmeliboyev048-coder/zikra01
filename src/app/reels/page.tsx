import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ReelFeed from "@/components/reels/ReelFeed";
import {
  getCurrentProfile,
  getReels,
  getReelStats,
  getFollowingSet,
} from "@/lib/queries";

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

  // Barcha reels'larni olish (muallif profillari bilan — manual join)
  const reels = await getReels();

  // Bo'sh holat
  if (reels.length === 0) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-black px-6 text-center text-white">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="2" y="3" width="20" height="18" rx="3" />
            <path d="M2 8h20M8 3l-2 5M13 3l-2 5M18 3l-2 5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 13l5 3-5 3z" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <p className="text-lg font-semibold">Hali reels mavjud emas</p>
        <p className="mt-2 max-w-xs text-sm text-white/60">
          Birinchi bo&apos;lib qisqa video yuklang va boshqalar bilan bilim ulashing!
        </p>
        <Link
          href={`/profile/${me.id}`}
          className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-white/90"
        >
          Profilga o&apos;tish va reel yuklash
        </Link>
      </div>
    );
  }

  // Statistika (like/liked/views/comments) va obuna holatini olish
  const reelIds = reels.map((r) => r.id);
  const authorIds = reels.map((r) => r.user_id);
  const [stats, followingSet] = await Promise.all([
    getReelStats(reelIds, me.id),
    getFollowingSet(me.id, authorIds),
  ]);

  for (const reel of reels) {
    const s = stats.get(reel.id);
    if (s) {
      reel.likes = s.likes;
      reel.liked = s.liked;
      reel.views = s.views;
      reel.comments = s.comments;
    }
    reel.following = followingSet.has(reel.user_id);
  }

  // Grid'dan kelgan bo'lsa (?start=<id>) — o'sha reeldan boshlaymiz
  const initialIndex = start
    ? Math.max(0, reels.findIndex((r) => r.id === start))
    : 0;

  return (
    <ReelFeed
      reels={reels}
      me={{ id: me.id, full_name: me.full_name, avatar_url: me.avatar_url }}
      initialIndex={initialIndex}
    />
  );
}

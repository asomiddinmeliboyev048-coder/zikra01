import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import VideoStats from "@/components/VideoStats";
import VideoPlayer from "@/components/VideoPlayer";
import SaveVideoButton from "@/components/SaveVideoButton";
import VideoComments, { type CommentView } from "@/components/VideoComments";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getVideoStats } from "@/lib/queries";
import { avatarFallback, timeAgo } from "@/lib/utils";
import type { Video } from "@/lib/types";

export const metadata: Metadata = { title: "Video dars" };
export const dynamic = "force-dynamic";

interface RawComment {
  id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author: { id: string; full_name: string; avatar_url: string | null } | null;
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const supabase = await createClient();

  const { data: videoData } = await supabase
    .from("videos")
    .select(
      "*, skill:skills(*), uploader:profiles!videos_uploader_id_fkey(id, full_name, avatar_url)"
    )
    .eq("id", id)
    .single();

  if (!videoData) notFound();
  const video = videoData as unknown as Video;

  // Like / ko'rish statistikasi (ko'rish VideoPlayer ichida, reklamadan keyin yoziladi)
  const stats = (await getVideoStats([id], me.id)).get(id) ?? {
    likes: 0,
    views: 0,
    liked: false,
  };

  // Izohlar
  const { data: rawComments } = await supabase
    .from("video_comments")
    .select(
      "id, parent_id, content, created_at, author:profiles!video_comments_user_id_fkey(id, full_name, avatar_url)"
    )
    .eq("video_id", id)
    .order("created_at", { ascending: true });

  const raw = (rawComments as unknown as RawComment[]) ?? [];
  const commentIds = raw.map((c) => c.id);

  // Izoh like'lari
  const likeCount = new Map<string, number>();
  const likedSet = new Set<string>();
  if (commentIds.length > 0) {
    const { data: cl } = await supabase
      .from("comment_likes")
      .select("comment_id, user_id")
      .in("comment_id", commentIds);
    for (const r of (cl as { comment_id: string; user_id: string }[]) ?? []) {
      likeCount.set(r.comment_id, (likeCount.get(r.comment_id) ?? 0) + 1);
      if (r.user_id === me.id) likedSet.add(r.comment_id);
    }
  }

  const toView = (c: RawComment): CommentView => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    author: c.author ?? { id: "", full_name: "Foydalanuvchi", avatar_url: null },
    likes: likeCount.get(c.id) ?? 0,
    liked: likedSet.has(c.id),
    replies: [],
  });

  const topLevel: CommentView[] = [];
  const byId = new Map<string, CommentView>();
  for (const c of raw) {
    if (!c.parent_id) {
      const v = toView(c);
      byId.set(c.id, v);
      topLevel.push(v);
    }
  }
  for (const c of raw) {
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.replies.push(toView(c));
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app max-w-3xl py-8">
        <Link href="/videos" className="text-sm text-gray-500 hover:text-brand">
          ← Video darslar
        </Link>

        {/* Pleyer (reklama + asl video + watch tracking) */}
        <div className="mt-4 overflow-hidden rounded-2xl bg-black">
          <VideoPlayer videoId={video.id} url={video.cloudinary_url} />
        </div>

        {/* Sarlavha + statistika */}
        <div className="card mt-4 p-5">
          <h1 className="text-xl font-bold text-gray-900">{video.title}</h1>

          <VideoStats
            videoId={video.id}
            initialLikes={stats.likes}
            initialLiked={stats.liked}
            initialViews={stats.views}
          />

          <div className="mt-2">
            <SaveVideoButton url={video.cloudinary_url} />
          </div>

          {video.uploader && (
            <Link
              href={`/profile/${video.uploader.id}`}
              className="mt-4 flex items-center gap-2 border-t border-gray-50 pt-4"
            >
              <Image
                src={video.uploader.avatar_url || avatarFallback(video.uploader.full_name)}
                alt={video.uploader.full_name}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
                unoptimized
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{video.uploader.full_name}</p>
                <p className="text-xs text-gray-400">{timeAgo(video.created_at)}</p>
              </div>
            </Link>
          )}
        </div>

        {/* Izohlar */}
        <div className="card mt-4 p-5">
          <VideoComments
            videoId={video.id}
            uploaderId={video.uploader_id}
            currentUser={{
              id: me.id,
              full_name: me.full_name,
              avatar_url: me.avatar_url,
            }}
            initial={topLevel}
          />
        </div>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import VideoStats from "@/components/VideoStats";
import VideoPlayer from "@/components/VideoPlayer";
import RelativeTime from "@/components/RelativeTime";
import SaveVideoButton from "@/components/SaveVideoButton";
import VideoComments, { type CommentView } from "@/components/VideoComments";
import VideoShareActions from "@/components/VideoShareActions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getVideoStats } from "@/lib/queries";
import { avatarFallback, formatDuration } from "@/lib/utils";
import type { Video } from "@/lib/types";

export const metadata: Metadata = { title: "Video dars" };
export const dynamic = "force-dynamic";

interface RawComment {
  id: string; parent_id: string | null; content: string; created_at: string;
  author: { id: string; full_name: string; avatar_url: string | null } | null;
}

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const supabase = await createClient();
  const [{ data: videoData }, { data: relatedData }] = await Promise.all([
    supabase.from("videos").select("*, skill:skills(*), uploader:profiles!videos_uploader_id_fkey(id, full_name, avatar_url)").eq("id", id).single(),
    supabase.from("videos").select("id,title,thumbnail_url,cloudinary_url,duration,created_at,views,likes,uploader:profiles!videos_uploader_id_fkey(id,full_name,avatar_url)").eq("status","published").neq("id",id).order("created_at",{ascending:false}).limit(16),
  ]);
  if (!videoData) notFound();
  const video = videoData as unknown as Video;
  const related = (relatedData ?? []) as unknown as Video[];
  const stats = (await getVideoStats([id], me.id)).get(id) ?? { likes:0, views:0, liked:false };

  const { data: rawComments } = await supabase.from("video_comments")
    .select("id,parent_id,content,created_at,author:profiles!video_comments_user_id_fkey(id,full_name,avatar_url)")
    .eq("video_id",id).order("created_at",{ascending:true});
  const raw = (rawComments as unknown as RawComment[]) ?? [];
  const commentIds = raw.map(c=>c.id);
  const likeCount = new Map<string,number>(), likedSet = new Set<string>();
  if(commentIds.length){
    const {data:cl}=await supabase.from("comment_likes").select("comment_id,user_id").in("comment_id",commentIds);
    for(const r of (cl as {comment_id:string;user_id:string}[])??[]){
      likeCount.set(r.comment_id,(likeCount.get(r.comment_id)??0)+1);
      if(r.user_id===me.id)likedSet.add(r.comment_id);
    }
  }
  const toView=(c:RawComment):CommentView=>({id:c.id,content:c.content,created_at:c.created_at,author:c.author??{id:"",full_name:"Foydalanuvchi",avatar_url:null},likes:likeCount.get(c.id)??0,liked:likedSet.has(c.id),replies:[]});
  const topLevel:CommentView[]=[]; const byId=new Map<string,CommentView>();
  for(const c of raw)if(!c.parent_id){const v=toView(c);byId.set(c.id,v);topLevel.push(v);}
  for(const c of raw)if(c.parent_id&&byId.has(c.parent_id))byId.get(c.parent_id)!.replies.push(toView(c));

  return <div className="min-h-screen bg-[#f9f9f9] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-white">
    <Navbar/>
    <main className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-5 lg:px-8 lg:py-6">
      <Link href="/videos" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand">← Video darslarga qaytish</Link>
      <div className="grid grid-cols-1 items-start gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <div className="group/player relative aspect-video w-full overflow-hidden rounded-xl bg-black sm:rounded-2xl">
            <VideoPlayer videoId={video.id} url={video.cloudinary_url}/>
          </div>
          <h1 className="mt-4 text-xl font-bold leading-snug sm:text-2xl">{video.title}</h1>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {video.uploader && <Link href={`/profile/${video.uploader.id}`} className="flex min-w-0 items-center gap-3">
                <Image src={video.uploader.avatar_url||avatarFallback(video.uploader.full_name)} alt={video.uploader.full_name} width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-cover" unoptimized/>
                <span className="min-w-0"><span className="block truncate text-sm font-bold">{video.uploader.full_name}</span><span className="text-xs text-gray-500">Muallif · <RelativeTime date={video.created_at}/></span></span>
              </Link>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full bg-gray-100 px-3 py-2 dark:bg-white/10"><VideoStats videoId={video.id} initialLikes={stats.likes} initialLiked={stats.liked} initialViews={stats.views}/></div>
              <VideoShareActions title={video.title}/>
              <div className="rounded-full bg-gray-100 px-3 py-2 dark:bg-white/10"><SaveVideoButton url={video.cloudinary_url}/></div>
            </div>
          </div>
          <section className="mt-4 rounded-xl bg-gray-100 p-4 text-sm dark:bg-white/[0.08]">
            <p className="font-semibold">{stats.views.toLocaleString("uz-UZ")} ko'rish · <RelativeTime date={video.created_at}/></p>
            {video.description && <p className="mt-2 whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-200">{video.description}</p>}
          </section>
          <section className="mt-5 rounded-xl border border-gray-200 p-4 dark:border-white/10 sm:p-5">
            <VideoComments videoId={video.id} uploaderId={video.uploader_id} currentUser={{id:me.id,full_name:me.full_name,avatar_url:me.avatar_url}} initial={topLevel}/>
          </section>
        </div>
        <aside className="min-w-0 xl:sticky xl:top-24">
          <h2 className="mb-3 text-lg font-bold">Tavsiya etilgan videolar</h2>
          <div className="space-y-3">
            {related.map((v)=> <Link href={`/videos/${v.id}`} key={v.id} className="group flex gap-3 rounded-xl p-1 transition hover:bg-gray-100 dark:hover:bg-white/[0.06]">
              <div className="relative aspect-video w-[44%] shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-white/10">
                {v.thumbnail_url ? <Image src={v.thumbnail_url} alt={v.title} fill unoptimized className="object-cover transition group-hover:scale-[1.03]"/> : <div className="flex h-full items-center justify-center text-3xl">▶</div>}
                {v.duration ? <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1.5 py-0.5 text-[11px] text-white">{formatDuration(v.duration)}</span>:null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{v.title}</p>
                <p className="mt-1 truncate text-xs text-gray-500">{v.uploader?.full_name||"Zikra hamjamiyati"}</p>
                <p className="mt-1 text-xs text-gray-500">{(v.views??0).toLocaleString("uz-UZ")} ko'rish · <RelativeTime date={v.created_at}/></p>
              </div>
            </Link>)}
          </div>
        </aside>
      </div>
    </main>
  </div>;
}

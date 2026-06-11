"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  recordStoryViewAction,
  toggleStoryLikeAction,
  deleteStoryAction,
  forwardStoryAction,
} from "@/app/actions/stories";
import { avatarFallback, timeAgo, formatDateTime, cn } from "@/lib/utils";
import type { StoryGroup, Profile } from "@/lib/types";

interface Props {
  groups: StoryGroup[];
  startGroup: number;
  meId: string;
  partners: Pick<Profile, "id" | "full_name" | "avatar_url">[];
  onClose: () => void;
}

interface Viewer {
  viewer_id: string;
  viewed_at: string;
  profile: { full_name: string; avatar_url: string | null } | null;
  liked: boolean;
}

export default function StoryViewer({
  groups,
  startGroup,
  meId,
  partners,
  onClose,
}: Props) {
  const [gi, setGi] = useState(startGroup);
  const [si, setSi] = useState(0);
  const [liked, setLiked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [showForward, setShowForward] = useState(false);
  const [forwardDone, setForwardDone] = useState<string | null>(null);

  const group = groups[gi];
  const story = group?.stories[si];
  const isOwner = group?.isMe ?? false;
  const durationMs = story?.media_type === "video" ? 15000 : 7000;

  const next = useCallback(() => {
    setShowViewers(false);
    if (!group) return;
    if (si < group.stories.length - 1) {
      setSi((s) => s + 1);
    } else if (gi < groups.length - 1) {
      setGi((g) => g + 1);
      setSi(0);
    } else {
      onClose();
    }
  }, [group, si, gi, groups.length, onClose]);

  const prev = useCallback(() => {
    setShowViewers(false);
    if (si > 0) setSi((s) => s - 1);
    else if (gi > 0) {
      setGi((g) => g - 1);
      setSi(0);
    }
  }, [si, gi]);

  // Hikoya o'zgarganda: ko'rish yozish + like holatini olish
  useEffect(() => {
    if (!story) return;
    setLiked(false);
    setForwardDone(null);
    if (!isOwner) recordStoryViewAction(story.id);

    const supabase = createClient();
    supabase
      .from("story_likes")
      .select("id")
      .eq("story_id", story.id)
      .eq("user_id", meId)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  // Avtomatik o'tish taymeri
  useEffect(() => {
    if (!story || paused || showViewers || showForward) return;
    const t = setTimeout(next, durationMs);
    return () => clearTimeout(t);
  }, [story, paused, showViewers, showForward, durationMs, next]);

  async function like() {
    setLiked((v) => !v);
    await toggleStoryLikeAction(story!.id);
  }

  async function loadViewers() {
    if (!story) return;
    setShowViewers(true);
    const supabase = createClient();
    const [{ data: vws }, { data: lks }] = await Promise.all([
      supabase
        .from("story_views")
        .select("viewer_id, viewed_at, profile:profiles!story_views_viewer_id_fkey(full_name, avatar_url)")
        .eq("story_id", story.id)
        .order("viewed_at", { ascending: false }),
      supabase.from("story_likes").select("user_id").eq("story_id", story.id),
    ]);
    const likedSet = new Set((lks ?? []).map((l) => l.user_id));
    setViewers(
      ((vws as unknown as { viewer_id: string; viewed_at: string; profile: Viewer["profile"] }[]) ?? []).map((v) => ({
        ...v,
        liked: likedSet.has(v.viewer_id),
      }))
    );
  }

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-md flex-col">
        {/* Progress bar segmentlari */}
        <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-2">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={
                  i < si
                    ? { width: "100%" }
                    : i === si
                    ? {
                        animation: `story-progress ${durationMs}ms linear forwards`,
                        animationPlayState: paused || showViewers || showForward ? "paused" : "running",
                      }
                    : { width: "0%" }
                }
              />
            </div>
          ))}
        </div>

        {/* Sarlavha */}
        <div className="absolute left-0 right-0 top-3 z-20 flex items-center gap-2 px-3 pt-2">
          <Image
            src={group.user.avatar_url || avatarFallback(group.user.full_name)}
            alt={group.user.full_name}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
            unoptimized
          />
          <span className="text-sm font-semibold text-white">{group.user.full_name}</span>
          <span className="text-xs text-white/70">{timeAgo(story.created_at)}</span>
          <div className="ml-auto flex items-center gap-2">
            {isOwner && (
              <button
                onClick={async () => {
                  if (confirm("Hikoyani o'chirasizmi?")) {
                    await deleteStoryAction(story.id);
                    onClose();
                  }
                }}
                className="text-white/80 hover:text-white"
                aria-label="O'chirish"
              >
                🗑
              </button>
            )}
            <button onClick={onClose} className="text-2xl leading-none text-white/90 hover:text-white">
              ✕
            </button>
          </div>
        </div>

        {/* Media */}
        <div className="relative flex flex-1 items-center justify-center">
          {story.media_type === "video" ? (
            <video
              src={story.media_url}
              autoPlay
              playsInline
              className="max-h-full max-w-full"
              onEnded={next}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.media_url} alt="" className="max-h-full max-w-full object-contain" />
          )}

          {/* Tap zonalari */}
          <button className="absolute inset-y-0 left-0 w-1/3" onClick={prev} aria-label="Oldingi" />
          <button
            className="absolute inset-y-0 right-0 w-1/3"
            onClick={next}
            aria-label="Keyingi"
          />
          <button
            className="absolute inset-y-0 left-1/3 right-1/3"
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            aria-label="Pauza"
          />

          {story.caption && (
            <p className="absolute bottom-20 left-0 right-0 px-6 text-center text-white drop-shadow">
              {story.caption}
            </p>
          )}
        </div>

        {/* Pastki panel */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
          {isOwner ? (
            <button
              onClick={loadViewers}
              className="mx-auto flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white backdrop-blur"
            >
              ⬆ Kim ko&apos;rdi
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={like} className="text-3xl transition hover:scale-110">
                {liked ? "❤️" : "🤍"}
              </button>
              <button
                onClick={() => setShowForward(true)}
                className="flex-1 rounded-full bg-white/15 px-4 py-2.5 text-sm text-white backdrop-blur"
              >
                ➤ Yuborish
              </button>
            </div>
          )}
        </div>

        {/* Ko'ruvchilar paneli */}
        {showViewers && (
          <div className="absolute inset-x-0 bottom-0 z-30 max-h-[60%] overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                👁 {viewers.length} ko&apos;rdi · ❤ {viewers.filter((v) => v.liked).length}
              </h3>
              <button onClick={() => setShowViewers(false)} className="text-gray-400">✕</button>
            </div>
            {viewers.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Hali hech kim ko&apos;rmadi.</p>
            ) : (
              <ul className="space-y-2">
                {viewers.map((v) => (
                  <li key={v.viewer_id} className="flex items-center gap-3">
                    <Image
                      src={v.profile?.avatar_url || avatarFallback(v.profile?.full_name ?? "Z")}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover"
                      unoptimized
                    />
                    <span className="flex-1 text-sm text-gray-800">{v.profile?.full_name ?? "Foydalanuvchi"}</span>
                    {v.liked && <span>❤️</span>}
                    <span className="text-xs text-gray-400">{formatDateTime(v.viewed_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Forward paneli */}
        {showForward && (
          <div className="absolute inset-x-0 bottom-0 z-30 max-h-[60%] overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Suhbatdoshga yuborish</h3>
              <button onClick={() => setShowForward(false)} className="text-gray-400">✕</button>
            </div>
            {partners.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Suhbatlar yo&apos;q.</p>
            ) : (
              <ul className="space-y-2">
                {partners.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={async () => {
                        await forwardStoryAction(story.id, p.id);
                        setForwardDone(p.id);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Image
                        src={p.avatar_url || avatarFallback(p.full_name)}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                        unoptimized
                      />
                      <span className="flex-1 text-left text-sm text-gray-800">{p.full_name}</span>
                      <span className={cn("text-xs", forwardDone === p.id ? "text-success" : "text-brand")}>
                        {forwardDone === p.id ? "✓ Yuborildi" : "Yuborish"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

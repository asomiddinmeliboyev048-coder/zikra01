"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { avatarFallback, cn } from "@/lib/utils";
import StoryUpload from "./StoryUpload";
import StoryViewer from "./StoryViewer";
import type { StoryGroup, Profile } from "@/lib/types";

export default function StoriesRow({
  me,
  groups,
  partners,
}: {
  me: Pick<Profile, "id" | "full_name" | "avatar_url">;
  groups: StoryGroup[];
  partners: Pick<Profile, "id" | "full_name" | "avatar_url">[];
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewerStart, setViewerStart] = useState<number | null>(null);

  const { myGroup, others, viewable } = useMemo(() => {
    const recency = (g: StoryGroup) =>
      new Date(g.stories[g.stories.length - 1].created_at).getTime();
    const my = groups.find((g) => g.isMe) ?? null;
    const rest = groups.filter((g) => !g.isMe);
    const unviewed = rest.filter((g) => g.hasUnviewed).sort((a, b) => recency(b) - recency(a));
    const viewed = rest.filter((g) => !g.hasUnviewed).sort((a, b) => recency(b) - recency(a));
    const ordered = [...unviewed, ...viewed];
    const v = my ? [my, ...ordered] : ordered;
    return { myGroup: my, others: ordered, viewable: v };
  }, [groups]);

  function openGroup(g: StoryGroup) {
    const idx = viewable.findIndex((x) => x.user.id === g.user.id);
    if (idx >= 0) setViewerStart(idx);
  }

  return (
    <>
      <div className="hide-scrollbar mb-6 flex gap-4 overflow-x-auto pb-1">
        {/* Mening tilim */}
        <button
          onClick={() => (myGroup ? openGroup(myGroup) : setUploadOpen(true))}
          className="flex shrink-0 flex-col items-center gap-1"
        >
          <div className="relative">
            <div
              className={cn(
                "rounded-full p-[2.5px]",
                myGroup?.hasUnviewed
                  ? "bg-gradient-to-tr from-brand to-success"
                  : myGroup
                  ? "bg-gray-300"
                  : "bg-transparent"
              )}
            >
              <div className="rounded-full bg-white p-[2px] dark:bg-gray-900">
                <Image
                  src={me.avatar_url || avatarFallback(me.full_name)}
                  alt="Siz"
                  width={60}
                  height={60}
                  className="h-[60px] w-[60px] rounded-full object-cover"
                  unoptimized
                />
              </div>
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setUploadOpen(true);
              }}
              className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand text-xs font-bold text-white dark:border-gray-900"
            >
              +
            </span>
          </div>
          <span className="w-16 truncate text-center text-xs text-gray-600">Siz</span>
        </button>

        {/* Boshqalar */}
        {others.map((g) => (
          <button
            key={g.user.id}
            onClick={() => openGroup(g)}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <div
              className={cn(
                "rounded-full p-[2.5px]",
                g.hasUnviewed ? "bg-gradient-to-tr from-brand to-success" : "bg-gray-300"
              )}
            >
              <div className="rounded-full bg-white p-[2px] dark:bg-gray-900">
                <Image
                  src={g.user.avatar_url || avatarFallback(g.user.full_name)}
                  alt={g.user.full_name}
                  width={60}
                  height={60}
                  className="h-[60px] w-[60px] rounded-full object-cover"
                  unoptimized
                />
              </div>
            </div>
            <span className="w-16 truncate text-center text-xs text-gray-600">
              {g.user.full_name.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {uploadOpen && <StoryUpload onClose={() => setUploadOpen(false)} />}

      {viewerStart !== null && (
        <StoryViewer
          groups={viewable}
          startGroup={viewerStart}
          meId={me.id}
          partners={partners}
          onClose={() => setViewerStart(null)}
        />
      )}
    </>
  );
}

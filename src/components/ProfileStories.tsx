"use client";

import Image from "next/image";
import { useState } from "react";

type Story = {
  id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  views?: number;
  likes?: number;
};

type ProfileStoriesProps = {
  stories: Story[];
};

export default function ProfileStories({
  stories,
}: ProfileStoriesProps) {
  const [activeStory, setActiveStory] =
    useState<Story | null>(null);

  if (!stories || stories.length === 0) {
    return null;
  }

  return (
    <>
      {/* =====================================================
          STORIES
      ====================================================== */}

      <section className="mt-7 border-t border-gray-100 pt-6">
        {/* HEADER */}

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Hikoyalarim
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Faol hikoyalar
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            {stories.length} ta
          </span>
        </div>

        {/* STORY LIST */}

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {stories.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => setActiveStory(story)}
              className="group flex w-20 shrink-0 flex-col items-center outline-none"
              aria-label="Hikoyani ko'rish"
            >
              {/* STORY RING */}

              <div
                className="
                  rounded-full
                  bg-gradient-to-tr
                  from-yellow-400
                  via-pink-500
                  to-purple-600
                  p-[3px]
                  transition
                  duration-200
                  group-hover:scale-105
                  group-active:scale-95
                "
              >
                <div className="rounded-full bg-white p-[2px]">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gray-100">
                    {story.media_type === "video" ? (
                      <video
                        src={story.media_url}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={story.media_url}
                        alt="Story"
                        fill
                        sizes="64px"
                        className="object-cover"
                        unoptimized
                      />
                    )}

                    {/* VIDEO ICON */}

                    {story.media_type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-xs text-white">
                          ▶
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TITLE */}

              <span className="mt-2 max-w-full truncate text-[11px] font-medium text-gray-500">
                Hikoya
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* =====================================================
          STORY MODAL
      ====================================================== */}

      {activeStory && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/90
            p-3
            sm:p-6
          "
          role="dialog"
          aria-modal="true"
          aria-label="Hikoya"
          onClick={() => setActiveStory(null)}
        >
          {/* CLOSE */}

          <button
            type="button"
            onClick={() => setActiveStory(null)}
            className="
              absolute
              right-4
              top-4
              z-30
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-white/10
              text-2xl
              text-white
              backdrop-blur
              transition
              hover:bg-white/20
            "
            aria-label="Yopish"
          >
            ×
          </button>

          {/* STORY CONTAINER */}

          <div
            className="
              relative
              flex
              h-[88vh]
              max-h-[850px]
              w-full
              max-w-[480px]
              items-center
              justify-center
              overflow-hidden
              rounded-2xl
              bg-black
              shadow-2xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* MEDIA */}

            {activeStory.media_type === "video" ? (
              <video
                src={activeStory.media_url}
                controls
                autoPlay
                playsInline
                className="h-full w-full object-contain"
              />
            ) : (
              <Image
                src={activeStory.media_url}
                alt="Story"
                fill
                priority
                sizes="(max-width: 640px) 100vw, 480px"
                className="object-contain"
                unoptimized
              />
            )}

            {/* TOP GRADIENT */}

            <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur">
                  👤
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Hikoya
                  </p>

                  <p className="text-[11px] text-white/70">
                    Hozir
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

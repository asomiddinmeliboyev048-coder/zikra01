import Image from "next/image";
import Link from "next/link";
import type { Video } from "@/lib/types";
import { formatDuration, timeAgo, avatarFallback } from "@/lib/utils";
import VideoThumbLink from "@/components/VideoThumbLink";
import VideoStats from "@/components/VideoStats";

export default function VideoCard({
  video,
  showUploader = true,
}: {
  video: Video;
  showUploader?: boolean;
}) {
  return (
    <div className="card group overflow-hidden transition hover:shadow-card-hover">
      <div className="relative aspect-video bg-gray-900">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand to-brand-700">
            <PlayIcon />
          </div>
        )}
        {video.duration ? (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(video.duration)}
          </span>
        ) : null}
        <VideoThumbLink
          videoId={video.id}
          url={video.cloudinary_url}
          className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/20"
        >
          <span className="rounded-full bg-white/90 p-3 opacity-0 transition group-hover:opacity-100">
            <PlayIcon dark />
          </span>
        </VideoThumbLink>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-semibold text-gray-900">
            {video.title}
          </h3>
          {video.skill && (
            <span className="tag-teach shrink-0">{video.skill.name}</span>
          )}
        </div>

        {/* Like + ko'rishlar */}
        <VideoStats
          videoId={video.id}
          initialLikes={video.likes ?? 0}
          initialLiked={video.liked ?? false}
          initialViews={video.views ?? 0}
        />

        {showUploader && video.uploader && (
          <Link
            href={`/profile/${video.uploader.id}`}
            className="mt-3 flex items-center gap-2 border-t border-gray-50 pt-3"
          >
            <Image
              src={
                video.uploader.avatar_url ||
                avatarFallback(video.uploader.full_name)
              }
              alt={video.uploader.full_name}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full object-cover"
              unoptimized
            />
            <span className="text-xs text-gray-600 hover:text-brand">
              {video.uploader.full_name}
            </span>
            <span className="ml-auto text-xs text-gray-400">
              {timeAgo(video.created_at)}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

function PlayIcon({ dark = false }: { dark?: boolean }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill={dark ? "#534AB7" : "white"}
      aria-hidden
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

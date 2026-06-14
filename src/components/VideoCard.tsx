import Image from "next/image";
import Link from "next/link";
import type { Video } from "@/lib/types";
import { timeAgo, avatarFallback } from "@/lib/utils";
import VideoStats from "@/components/VideoStats";
import VideoThumb from "@/components/VideoThumb";

export default function VideoCard({
  video,
  showUploader = true,
}: {
  video: Video;
  showUploader?: boolean;
}) {
  return (
    <div className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-card-hover">
      {/* Thumbnail + hover teaser */}
      <VideoThumb
        id={video.id}
        title={video.title}
        thumbnailUrl={video.thumbnail_url}
        videoUrl={video.cloudinary_url}
        duration={video.duration}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/videos/${video.id}`}
            className="line-clamp-2 font-semibold text-gray-900 hover:text-brand"
          >
            {video.title}
          </Link>
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

"use client";

import { recordViewAction } from "@/app/actions/social";

/**
 * Video thumbnail havolasi — bosilganda ko'rish (+1) yoziladi va video ochiladi.
 */
export default function VideoThumbLink({
  videoId,
  url,
  className,
  children,
  ariaLabel = "Videoni ochish",
}: {
  videoId: string;
  url: string;
  className?: string;
  children?: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        // fire-and-forget: ko'rish yozish
        recordViewAction(videoId);
      }}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}

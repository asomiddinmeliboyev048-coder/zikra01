import {
  NavbarSkeleton,
  VideoCardSkeleton,
  Skeleton,
} from "@/components/ui/Skeleton";

/** "Video darslar" sahifasi uchun skeleton. */
export default function VideosLoading() {
  return (
    <div className="min-h-screen">
      <NavbarSkeleton />
      <main className="container-app py-8">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

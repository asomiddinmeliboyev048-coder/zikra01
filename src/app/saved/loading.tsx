import {
  NavbarSkeleton,
  VideoCardSkeleton,
  Skeleton,
} from "@/components/ui/Skeleton";

/** "Saqlangan" sahifasi uchun skeleton. */
export default function SavedLoading() {
  return (
    <div className="min-h-screen">
      <NavbarSkeleton />
      <main className="container-app py-8">
        <Skeleton className="mb-6 h-7 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

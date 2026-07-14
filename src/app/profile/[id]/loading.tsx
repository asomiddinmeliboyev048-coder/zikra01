import {
  NavbarSkeleton,
  Skeleton,
  SkeletonCircle,
  VideoCardSkeleton,
} from "@/components/ui/Skeleton";

/** Ommaviy profil sahifasi uchun skeleton. */
export default function ProfileLoading() {
  return (
    <div className="min-h-screen">
      <NavbarSkeleton />
      <main className="container-app py-8">
        {/* Profil sarlavhasi: avatar + ism + statistika */}
        <div className="card p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <SkeletonCircle className="h-24 w-24" />
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <Skeleton className="mx-auto h-6 w-48 sm:mx-0" />
              <Skeleton className="mx-auto h-4 w-32 sm:mx-0" />
              <div className="flex justify-center gap-4 sm:justify-start">
                <Skeleton className="h-12 w-16" />
                <Skeleton className="h-12 w-16" />
                <Skeleton className="h-12 w-16" />
              </div>
            </div>
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>

          {/* Ko'nikma teglari */}
          <div className="mt-6 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Video darslar bo'limi */}
        <Skeleton className="mb-4 mt-8 h-5 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

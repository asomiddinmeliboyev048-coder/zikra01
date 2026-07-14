import { NavbarSkeleton, Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";

/** "Darslarim" sahifasi uchun skeleton. */
export default function LessonsLoading() {
  return (
    <div className="min-h-screen">
      <NavbarSkeleton />
      <main className="container-app py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>

        <Skeleton className="mb-3 h-3 w-28" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card flex items-center gap-4 p-4">
              <SkeletonCircle className="h-12 w-12" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

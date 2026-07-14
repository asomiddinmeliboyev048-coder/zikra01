import { NavbarSkeleton, Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";

/** "Bildirishnomalar" sahifasi uchun skeleton. */
export default function NotificationsLoading() {
  return (
    <div className="min-h-screen">
      <NavbarSkeleton />
      <main className="container-app py-8">
        <Skeleton className="mb-6 h-7 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
              <SkeletonCircle className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

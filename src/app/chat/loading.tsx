import { NavbarSkeleton, Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";

/**
 * "Suhbatlar" sahifasi uchun skeleton — suhbatlar ro'yxati ko'rinishi.
 * Chat sahifasi to'liq balandlikni egallagani uchun ro'yxat skeletoni ham
 * shunga mos.
 */
export default function ChatLoading() {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <NavbarSkeleton />
      <main className="min-h-0 flex-1 overflow-hidden">
        <div className="container-app py-4">
          <Skeleton className="mb-4 h-10 w-full rounded-xl" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-2.5">
                <SkeletonCircle className="h-12 w-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

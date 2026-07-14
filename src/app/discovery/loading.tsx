import {
  NavbarSkeleton,
  StoriesSkeleton,
  UserCardSkeleton,
  Skeleton,
} from "@/components/ui/Skeleton";

/**
 * "Kashf etish" sahifasi yuklanayotganda ko'rinadigan skeleton.
 * Haqiqiy sahifa tuzilishiga mos — foydalanuvchi bo'sh ekran emas,
 * kelayotgan kontent shaklini ko'radi (Instagram uslubi).
 */
export default function DiscoveryLoading() {
  return (
    <div className="min-h-screen">
      <NavbarSkeleton />
      <main className="container-app py-8">
        <StoriesSkeleton />
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

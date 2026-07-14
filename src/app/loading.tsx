import { NavbarSkeleton, Skeleton } from "@/components/ui/Skeleton";

/**
 * Global (default) yuklanish holati — o'ziga xos loading.tsx bo'lmagan
 * sahifalar uchun zaxira.
 *
 * Qo'pol "Yuklanmoqda..." spinneri o'rniga silliq skeleton shell ko'rsatiladi
 * (Telegram/Instagram uslubi). Ko'p asosiy bo'limlar (discovery, videos,
 * lessons, chat, reels, profile...) o'zining aniqroq skeletoniga ega.
 */
export default function Loading() {
  return (
    <div className="min-h-screen">
      <NavbarSkeleton />
      <main className="container-app py-8">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

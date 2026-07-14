/**
 * Zikra — qayta ishlatiluvchi Skeleton (miltillovchi bo'sh katak) bloklari.
 *
 * Qattiq "Yuklanmoqda..." spinneri o'rniga, sahifaning haqiqiy tuzilishiga
 * o'xshash "sur'at" (shimmer) ko'rsatiladi. Bu Telegram/Instagram'dagidek
 * lahzali va silliq his beradi — foydalanuvchi bo'sh ekran emas, kelayotgan
 * kontent shaklini ko'radi.
 *
 * Barcha bloklar `zikra-skeleton` (globals.css) + `animate-shimmer`
 * (tailwind.config.ts) klasslaridan foydalanadi.
 */

/** Asosiy skeleton bloki — istalgan o'lcham/shaklni className orqali bering. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`zikra-skeleton animate-shimmer rounded-lg ${className}`}
      aria-hidden
    />
  );
}

/** Doiraviy skeleton (avatar uchun). */
export function SkeletonCircle({ className = "" }: { className?: string }) {
  return (
    <div
      className={`zikra-skeleton animate-shimmer rounded-full ${className}`}
      aria-hidden
    />
  );
}

/** Bir nechta matn qatori skeleton'i. */
export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/**
 * Yuqori navbar o'rnini bosuvchi skeleton.
 * Haqiqiy Navbar (sticky, h-16) bilan bir xil balandlikda — shu tufayli
 * kontent yuklanganda sakrash (layout shift) bo'lmaydi.
 */
export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur dark:border-white/10">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Skeleton className="h-8 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
    </header>
  );
}

/** Stories lentasi skeleton'i (discovery/chat yuqorisidagi). */
export function StoriesSkeleton() {
  return (
    <div className="mb-6 flex gap-3 overflow-hidden" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex shrink-0 flex-col items-center gap-1.5">
          <SkeletonCircle className="h-16 w-16" />
          <Skeleton className="h-2.5 w-10" />
        </div>
      ))}
    </div>
  );
}

/** Foydalanuvchi kartochkasi skeleton'i (discovery grid uchun). */
export function UserCardSkeleton() {
  return (
    <div className="card p-5" aria-hidden>
      <div className="flex items-center gap-3">
        <SkeletonCircle className="h-14 w-14" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

/** Video kartochkasi skeleton'i (videos grid uchun). */
export function VideoCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-center gap-2">
          <SkeletonCircle className="h-6 w-6" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

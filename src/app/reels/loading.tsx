/**
 * "Reels" sahifasi uchun skeleton — reels immersiv (qora) rejimda bo'lgani
 * uchun qora fonda yumshoq puls ko'rsatiladi (oq spinner emas).
 */
export default function ReelsLoading() {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-black">
      {/* Yumshoq puls — reels video yuklanayotganini bildiradi */}
      <div className="relative h-16 w-16">
        <span className="absolute inset-0 animate-ping rounded-full bg-white/15" />
        <span className="absolute inset-2 rounded-full bg-white/25" />
      </div>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";

export default function Logo({
  size = "md",
  withText = true,
}: {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}) {
  const dim = size === "sm" ? 30 : size === "lg" ? 48 : 38;
  const textSize =
    size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <Link href="/" className="group inline-flex items-center gap-2.5 rounded-2xl outline-none transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
      {/* Zikra nishoni (Kelajak Sari) */}
      <Image
        src="/zikra-logo.svg"
        alt="Zikra"
        width={dim}
        height={dim}
        className="rounded-full shadow-[0_8px_22px_-12px_rgba(8,63,59,0.45)] ring-1 ring-brand/10 transition-all duration-300 group-hover:rotate-3 group-hover:shadow-glow"
        unoptimized
        priority
      />
      {withText && (
        <span className={`bg-gradient-to-r from-brand-700 via-brand to-success bg-clip-text font-extrabold tracking-[-0.04em] text-transparent dark:from-brand-300 dark:via-brand-400 dark:to-emerald-300 ${textSize}`}>
          Zikra
        </span>
      )}
    </Link>
  );
}

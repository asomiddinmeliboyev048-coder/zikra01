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
    <Link href="/" className="inline-flex items-center gap-2">
      {/* Zikra nishoni (Kelajak Sari) */}
      <Image
        src="/zikra-logo.svg"
        alt="Zikra"
        width={dim}
        height={dim}
        className="rounded-full"
        unoptimized
        priority
      />
      {withText && (
        <span className={`font-bold tracking-tight text-brand ${textSize}`}>
          Zikra
        </span>
      )}
    </Link>
  );
}

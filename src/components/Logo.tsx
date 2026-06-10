import Link from "next/link";

export default function Logo({
  size = "md",
  withText = true,
}: {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}) {
  const dim = size === "sm" ? 28 : size === "lg" ? 44 : 36;
  const textSize =
    size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <span
        className="flex items-center justify-center rounded-xl bg-brand font-bold text-white shadow-sm"
        style={{ width: dim, height: dim, fontSize: dim * 0.5 }}
        aria-hidden
      >
        Z
      </span>
      {withText && (
        <span className={`font-bold tracking-tight text-brand ${textSize}`}>
          Zikra
        </span>
      )}
    </Link>
  );
}

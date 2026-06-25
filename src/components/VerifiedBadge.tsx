/**
 * Sertifikat / tasdiqlash belgisi.
 * - is_verified === true  -> ko'k "tasdiqlangan" belgi (admin tekshirgan)
 * - hasCertificate === true (lekin hali tasdiqlanmagan) -> yashil qalqon
 * Sichqoncha ustiga olib borilganda tushuntiruvchi yozuv (tooltip) chiqadi.
 */
export default function VerifiedBadge({
  verified = false,
  hasCertificate = false,
  size = 16,
  className = "",
}: {
  verified?: boolean;
  hasCertificate?: boolean;
  size?: number;
  className?: string;
}) {
  if (!verified && !hasCertificate) return null;

  const title = verified ? "Tasdiqlangan" : "Sertifikati bor";
  const colorClass = verified ? "text-brand" : "text-success";

  return (
    <span
      title={title}
      aria-label={title}
      role="img"
      className={`inline-flex shrink-0 items-center ${colorClass} ${className}`}
    >
      {verified ? (
        // Ko'k "verified" belgisi (tasdiqlangan)
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 1.5l2.4 1.74 2.96-.02 1.06 2.77 2.62 1.39-.43 2.93 1.74 2.4-1.74 2.4.43 2.93-2.62 1.39-1.06 2.77-2.96-.02L12 22.5l-2.4-1.74-2.96.02-1.06-2.77-2.62-1.39.43-2.93L1.65 12l1.74-2.4-.43-2.93 2.62-1.39 1.06-2.77 2.96.02L12 1.5z" />
          <path
            d="M10.6 14.6l-2-2a.9.9 0 10-1.27 1.27l2.63 2.63c.35.35.92.35 1.27 0l5.5-5.5a.9.9 0 10-1.27-1.27l-4.86 4.87z"
            fill="#fff"
          />
        </svg>
      ) : (
        // Yashil qalqon (sertifikati bor, tasdiq kutilmoqda)
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2l7 3v6c0 4.42-3.05 8.4-7 9-3.95-.6-7-4.58-7-9V5l7-3z" />
          <path
            d="M10.5 13.4l-1.6-1.6a.85.85 0 10-1.2 1.2l2.2 2.2c.33.33.87.33 1.2 0l4-4a.85.85 0 10-1.2-1.2l-3.4 3.4z"
            fill="#fff"
          />
        </svg>
      )}
    </span>
  );
}

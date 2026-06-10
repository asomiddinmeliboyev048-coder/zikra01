export default function StarRating({
  value,
  size = 16,
  showValue = false,
}: {
  value: number;
  size?: number;
  showValue?: boolean;
}) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} / 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < full;
        const half = i === full && hasHalf;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={filled || half ? "text-yellow-400" : "text-gray-300"}
            aria-hidden
          >
            <defs>
              <linearGradient id={`half-${i}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <path
              fill={half ? `url(#half-${i})` : "currentColor"}
              d="M12 2l2.9 6.26L21.5 9l-5 4.87L17.8 21 12 17.27 6.2 21l1.3-7.13-5-4.87 6.6-.74L12 2z"
            />
          </svg>
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-gray-600">
          {value > 0 ? value.toFixed(1) : "—"}
        </span>
      )}
    </span>
  );
}

import { cn } from "@/lib/utils/cn";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path
        d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z"
        fill={filled ? "var(--gold)" : "none"}
        stroke={filled ? "var(--gold)" : "var(--border)"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Note en étoiles (0 à 5). Icônes SVG (charte : jamais de glyphe dingbat). Visuel pur. */
export function Rating({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <span aria-hidden className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} filled={i < rounded} />
        ))}
      </span>
      <span className="text-muted">
        {value > 0 ? value.toFixed(1) : "—"}
        {typeof count === "number" && ` (${count})`}
      </span>
    </span>
  );
}

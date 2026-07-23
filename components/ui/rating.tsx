import { cn } from "@/lib/utils/cn";

/** Affichage d'une note en étoiles (0 à 5). Visuel pur. */
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
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <span aria-hidden className="text-amber-500">
        {"★".repeat(rounded)}
        <span className="text-border">{"★".repeat(5 - rounded)}</span>
      </span>
      <span className="text-muted">
        {value > 0 ? value.toFixed(1) : "—"}
        {typeof count === "number" && ` (${count})`}
      </span>
    </span>
  );
}

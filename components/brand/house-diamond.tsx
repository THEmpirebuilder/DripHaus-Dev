import { cn } from "@/lib/utils/cn";
import { houseTier, TIER_LABEL, type HouseTier } from "@/lib/utils/house-tier";

/**
 * Diamant de niveau de maison. Le registre se lit au métal du losange
 * (or plein / bronze plein / argent en contour), jamais par un mot dévalorisant.
 * Fournir `brand` (mappé automatiquement) ou `tier` directement.
 */
export function HouseDiamond({
  brand,
  tier,
  showLabel = false,
  size = 8,
  className,
}: {
  brand?: string | null;
  tier?: HouseTier;
  showLabel?: boolean;
  size?: number;
  className?: string;
}) {
  const t = tier ?? houseTier(brand);
  const fill =
    t === "or"
      ? { background: "var(--gold)" }
      : t === "bronze"
        ? { background: "var(--bronze)" }
        : { background: "transparent", border: "1.5px solid var(--silver)" };

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden
        style={{ width: size, height: size, transform: "rotate(45deg)", ...fill }}
      />
      {showLabel && (
        <span className="u-label text-[9px] text-accent">{TIER_LABEL[t]}</span>
      )}
    </span>
  );
}

import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export type PriceProps = {
  amount: number;
  currency?: string;
  /** display = Italiana (prix mis en avant, ≥ 18 px). default = Syne 600 (partout ailleurs). */
  display?: boolean;
  className?: string;
};

/**
 * Prix formaté (visuel pur). En display, Italiana (charte : prix 22, Didone) — à réserver
 * aux tailles ≥ 17 px, sous lesquelles Italiana devient illisible ; sinon Syne 600.
 */
export function Price({ amount, currency = "CHF", display = false, className }: PriceProps) {
  return (
    <span
      className={cn(
        "tabular-nums",
        display ? "t-price" : "font-semibold",
        className
      )}
    >
      {formatMoney(amount, currency)}
    </span>
  );
}

import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export type PriceProps = {
  amount: number;
  currency?: string;
  className?: string;
};

/** Affichage d'un prix formaté (visuel pur). */
export function Price({ amount, currency = "CHF", className }: PriceProps) {
  return <span className={cn("font-semibold tabular-nums", className)}>{formatMoney(amount, currency)}</span>;
}

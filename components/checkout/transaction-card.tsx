import Link from "next/link";
import Image from "next/image";
import type { TransactionRow } from "@/lib/queries/transactions";
import { toImageUrls } from "@/lib/utils/media";
import { formatDate } from "@/lib/utils/format";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";

export const PAYMENT_STATUS: Record<string, { label: string; tone: "warning" | "info" | "success" | "neutral" | "danger" }> = {
  pending: { label: "En attente", tone: "warning" },
  paid: { label: "Payé", tone: "info" },
  held: { label: "Sous séquestre", tone: "info" },
  refunded: { label: "Remboursé", tone: "neutral" },
  failed: { label: "Échec", tone: "danger" },
};

/** Ligne de transaction cliquable (achats / ventes). Présentation pure. */
export function TransactionCard({ tx }: { tx: TransactionRow }) {
  const cover = toImageUrls(tx.article?.images ?? [])[0];
  const status = PAYMENT_STATUS[tx.payment_status];

  return (
    <Link
      href={`/orders/${tx.id}`}
      className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface-elevated"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-elevated">
        {cover && <Image src={cover} alt="" fill sizes="56px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.article?.title ?? "Article"}</p>
        <p className="text-xs text-muted">{formatDate(tx.created_at)}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Price amount={tx.amount} currency={tx.currency} className="text-sm" />
        {status && <Badge tone={status.tone}>{status.label}</Badge>}
      </div>
    </Link>
  );
}

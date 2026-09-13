import Link from "next/link";
import Image from "next/image";
import type { Tables } from "@/types/database";
import { firstImage } from "@/lib/utils/media";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { HouseDiamond } from "@/components/brand/house-diamond";

const CONDITION_LABELS: Record<string, string> = {
  new: "Neuf",
  very_good: "Très bon état",
  good: "Bon état",
  fair: "État correct",
};

const STATUS_BADGE: Record<string, { label: string; tone: "warning" | "neutral" | "info" }> = {
  sold: { label: "Vendu", tone: "neutral" },
  reserved: { label: "Réservé", tone: "info" },
  draft: { label: "Brouillon", tone: "warning" },
};

/** Vignette d'article pour les grilles. Présentation pure. */
export function ArticleCard({ article }: { article: Tables<"articles"> }) {
  const cover = firstImage(article.images);
  const status = STATUS_BADGE[article.status];

  return (
    <Link href={`/article/${article.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-none border border-border bg-surface-elevated">
        {cover ? (
          <Image
            src={cover}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">Sans photo</div>
        )}
        {status && (
          <span className="absolute left-2 top-2">
            <Badge tone={status.tone}>{status.label}</Badge>
          </span>
        )}
      </div>

      <div className="mt-2.5 space-y-1">
        {article.brand && (
          <div className="flex items-center gap-1.5">
            <HouseDiamond brand={article.brand} size={7} />
            <span className="u-label truncate text-[9.5px] text-accent">{article.brand}</span>
          </div>
        )}
        <p className="truncate text-sm font-medium">{article.title}</p>
        <div className="flex items-center justify-between">
          <Price amount={article.price} currency={article.currency} display className="text-lg" />
          {article.condition && (
            <span className="text-xs text-muted">{CONDITION_LABELS[article.condition]}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

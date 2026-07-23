import Link from "next/link";
import Image from "next/image";
import type { AuctionListItem } from "@/lib/queries/auctions";
import { toImageUrls } from "@/lib/utils/media";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { AuctionTimer } from "@/components/auction/auction-timer";

/** Vignette d'enchère pour les grilles. */
export function AuctionCard({ auction }: { auction: AuctionListItem }) {
  const cover = toImageUrls(auction.article?.images ?? [])[0];
  const current = auction.highestBid ?? Number(auction.starting_price);

  return (
    <Link href={`/auction/${auction.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-elevated">
        {cover ? (
          <Image src={cover} alt={auction.article?.title ?? ""} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">Sans photo</div>
        )}
        <span className="absolute left-2 top-2">
          <Badge tone="warning">Enchère</Badge>
        </span>
      </div>

      <div className="mt-2 space-y-0.5">
        <p className="truncate text-sm font-medium">{auction.article?.title ?? "Article"}</p>
        <div className="flex items-center justify-between text-sm">
          <span>
            <span className="text-muted">{auction.highestBid ? "Enchère" : "Départ"} </span>
            <Price amount={current} currency={auction.article?.currency ?? "CHF"} className="text-sm" />
          </span>
          <AuctionTimer endsAt={auction.ends_at} className="text-xs text-muted tabular-nums" />
        </div>
      </div>
    </Link>
  );
}

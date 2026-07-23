import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAuctionById } from "@/lib/queries/auctions";
import { getSessionUser } from "@/lib/auth/session";
import { toImageUrls } from "@/lib/utils/media";
import { formatDateTime } from "@/lib/utils/format";
import { Price } from "@/components/ui/price";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AuctionTimer } from "@/components/auction/auction-timer";
import { BidForm } from "@/components/auction/bid-form";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const auction = await getAuctionById(id);
  return { title: auction?.article?.title ? `Enchère — ${auction.article.title}` : "Enchère" };
}

export default async function AuctionPage({ params }: Props) {
  const { id } = await params;
  const auction = await getAuctionById(id);
  if (!auction) notFound();

  const viewer = await getSessionUser();
  const cover = toImageUrls(auction.article?.images ?? [])[0];
  const currency = auction.article?.currency ?? "CHF";
  const current = auction.highestBid ?? Number(auction.starting_price);
  const ended = auction.status !== "active" || new Date(auction.ends_at) <= new Date();
  const isSeller = auction.seller_user_id === viewer?.authId;
  const reserveMet = auction.reserve_price == null || current >= Number(auction.reserve_price);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-elevated">
          {cover ? (
            <Image src={cover} alt={auction.article?.title ?? ""} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">Sans photo</div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {auction.article ? (
                <Link href={`/article/${auction.article.id}`} className="hover:underline">
                  {auction.article.title}
                </Link>
              ) : (
                "Article"
              )}
            </h1>
            {ended && <Badge tone="neutral">Terminée</Badge>}
          </div>

          {auction.seller && (
            <Link href={auction.seller.href} className="mt-3 inline-flex items-center gap-2 text-sm hover:underline">
              <Avatar src={auction.seller.avatarUrl} name={auction.seller.name} size={28} />
              {auction.seller.name}
            </Link>
          )}

          <Card className="mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">{auction.highestBid ? "Enchère actuelle" : "Prix de départ"}</p>
                <Price amount={current} currency={currency} className="text-2xl" />
                <p className="mt-1 text-xs text-muted">{auction.bidCount} offre{auction.bidCount > 1 ? "s" : ""}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">{ended ? "Clôturée" : "Fin dans"}</p>
                <AuctionTimer endsAt={auction.ends_at} className="text-lg font-semibold tabular-nums" />
              </div>
            </div>

            {auction.reserve_price != null && (
              <p className="mt-3 text-xs text-muted">
                {reserveMet ? "✓ Prix de réserve atteint" : "Prix de réserve non atteint"}
              </p>
            )}

            <div className="mt-5">
              {ended ? (
                <p className="text-sm text-muted">Cette enchère est terminée.</p>
              ) : isSeller ? (
                <p className="text-sm text-muted">Tu es le vendeur : tu ne peux pas enchérir.</p>
              ) : viewer ? (
                <BidForm auctionId={auction.id} minNextBid={auction.minNextBid} currency={currency} />
              ) : (
                <p className="text-sm text-muted">
                  <Link href="/login" className="underline underline-offset-4">Connecte-toi</Link> pour enchérir.
                </p>
              )}
            </div>
          </Card>

          {auction.bids.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold">Historique des offres</h2>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {auction.bids.map((b, i) => (
                  <li key={`${b.amount}-${b.created_at}`} className="flex items-center justify-between p-3 text-sm">
                    <span className="flex items-center gap-2">
                      <Avatar src={b.bidder?.avatarUrl} name={b.bidder?.name} size={24} />
                      {b.bidder?.name ?? "Enchérisseur"}
                      {i === 0 && <Badge tone="success">En tête</Badge>}
                    </span>
                    <span className="flex items-center gap-3">
                      <Price amount={b.amount} currency={currency} className="text-sm" />
                      <span className="text-xs text-muted">{formatDateTime(b.created_at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { listAuctions } from "@/lib/queries/auctions";
import { getSessionUser } from "@/lib/auth/session";
import { AuctionCard } from "@/components/auction/auction-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Enchères" };

export default async function AuctionsPage() {
  const [auctions, viewer] = await Promise.all([listAuctions(), getSessionUser()]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Enchères en cours</h1>
        {viewer && (
          <Link href="/auctions/new">
            <Button size="sm">Lancer une enchère</Button>
          </Link>
        )}
      </div>

      {auctions.length === 0 ? (
        <EmptyState title="Aucune enchère en cours." description="Reviens bientôt, ou lance la tienne." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {auctions.map((a) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
      )}
    </main>
  );
}

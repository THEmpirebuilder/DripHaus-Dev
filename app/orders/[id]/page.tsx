import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTransactionById } from "@/lib/queries/transactions";
import { requireUser } from "@/lib/auth/session";
import { toImageUrls } from "@/lib/utils/media";
import { formatDate } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS } from "@/components/checkout/transaction-card";
import { DisputeForm } from "@/components/checkout/dispute-form";
import { getMyReviewForTransaction } from "@/lib/queries/reviews";
import { ReviewForm } from "@/components/review/review-form";
import { Rating } from "@/components/ui/rating";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Commande" };

const PAYOUT_STATUS: Record<string, string> = {
  pending: "En attente",
  released: "Versé au vendeur",
  held: "Retenu",
  refunded: "Remboursé",
};

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const tx = await getTransactionById(id);
  if (!tx) notFound(); // RLS masque les transactions dont on n'est pas partie prenante

  const isBuyer = tx.buyer_user_id === user.authId;
  const cover = toImageUrls(tx.article?.images ?? [])[0];
  const paymentStatus = PAYMENT_STATUS[tx.payment_status];
  const canDispute = !tx.dispute && ["paid", "held"].includes(tx.payment_status);

  const myReview = await getMyReviewForTransaction(tx.id, user.authId);
  const canReview = !myReview && ["paid", "held"].includes(tx.payment_status);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Commande</h1>
      <p className="mt-1 text-sm text-muted">{formatDate(tx.created_at)}</p>

      <Card className="mt-6">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-elevated">
            {cover && <Image src={cover} alt="" fill sizes="64px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            {tx.article ? (
              <Link href={`/article/${tx.article.id}`} className="font-medium hover:underline">
                {tx.article.title}
              </Link>
            ) : (
              <span className="font-medium">Article</span>
            )}
            <p className="text-sm text-muted">
              {isBuyer ? `Vendeur : ${tx.seller?.name ?? "—"}` : `Acheteur : ${tx.buyer?.name ?? "—"}`}
            </p>
          </div>
        </div>

        <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <Row label="Montant">
            <Price amount={tx.amount} currency={tx.currency} className="text-sm" />
          </Row>
          <Row label="Commission plateforme">
            <Price amount={tx.platform_fee} currency={tx.currency} className="text-sm" />
          </Row>
          <Row label="Statut du paiement">
            {paymentStatus ? <Badge tone={paymentStatus.tone}>{paymentStatus.label}</Badge> : tx.payment_status}
          </Row>
          <Row label="Versement vendeur">
            <span className="text-muted">{PAYOUT_STATUS[tx.payout_status] ?? tx.payout_status}</span>
          </Row>
        </dl>
      </Card>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Litige</h2>
        {tx.dispute ? (
          <Card>
            <div className="flex items-center gap-2">
              <Badge tone="warning">Litige {tx.dispute.status}</Badge>
            </div>
            {tx.dispute.description && <p className="mt-2 text-sm">{tx.dispute.description}</p>}
          </Card>
        ) : canDispute ? (
          <Card>
            <DisputeForm transactionId={tx.id} />
          </Card>
        ) : (
          <p className="text-sm text-muted">
            Aucun litige. Tu pourras en ouvrir un une fois le paiement encaissé.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Avis</h2>
        {myReview ? (
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Ton avis</span>
              <Rating value={myReview.rating} />
            </div>
            {myReview.comment && <p className="mt-2 text-sm">{myReview.comment}</p>}
          </Card>
        ) : canReview ? (
          <Card>
            <p className="mb-3 text-sm text-muted">
              Note {isBuyer ? "le vendeur" : "l'acheteur"} pour cette transaction.
            </p>
            <ReviewForm transactionId={tx.id} />
          </Card>
        ) : (
          <p className="text-sm text-muted">Les avis seront disponibles une fois le paiement encaissé.</p>
        )}
      </section>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

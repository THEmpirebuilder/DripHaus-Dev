import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getArticleById } from "@/lib/queries/articles";
import { requireUser } from "@/lib/auth/session";
import { toImageUrls } from "@/lib/utils/media";
import { formatMoney } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { CheckoutForm } from "@/components/checkout/checkout-form";

type Props = { params: Promise<{ articleId: string }> };

export const metadata = { title: "Paiement" };

export default async function CheckoutPage({ params }: Props) {
  const { articleId } = await params;
  const user = await requireUser();
  const article = await getArticleById(articleId);
  if (!article) notFound();

  if (article.status !== "active" || article.seller_user_id === user.authId) {
    redirect(`/article/${articleId}`);
  }

  const cover = toImageUrls(article.images)[0];

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Paiement</h1>

      <Card className="mt-6">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-elevated">
            {cover && <Image src={cover} alt="" fill sizes="64px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{article.title}</p>
            {article.seller && <p className="text-sm text-muted">{article.seller.name}</p>}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted">Total</span>
          <span className="text-lg font-semibold">{formatMoney(article.price, article.currency)}</span>
        </div>
      </Card>

      <div className="mt-6">
        <CheckoutForm articleId={articleId} />
      </div>
    </main>
  );
}

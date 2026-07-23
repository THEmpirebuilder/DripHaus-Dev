import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/queries/articles";
import { getSessionUser } from "@/lib/auth/session";
import { getMyBoutiques } from "@/lib/queries/boutiques";
import { toImageUrls } from "@/lib/utils/media";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { archiveArticleAction } from "@/lib/actions/articles";

type Props = { params: Promise<{ id: string }> };

const CONDITION_LABELS: Record<string, string> = {
  new: "Neuf",
  very_good: "Très bon état",
  good: "Bon état",
  fair: "État correct",
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const article = await getArticleById(id);
  return { title: article?.title ?? "Article introuvable" };
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  const viewer = await getSessionUser();
  let isOwner = article.seller_user_id === viewer?.authId;
  if (!isOwner && viewer && article.seller_boutique_id) {
    const boutiques = await getMyBoutiques(viewer.authId);
    isOwner = boutiques.some((b) => b.id === article.seller_boutique_id);
  }

  const images = toImageUrls(article.images);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Galerie */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-elevated">
            {images[0] ? (
              <Image src={images[0]} alt={article.title} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">Sans photo</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((url) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                  <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Détails */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold">{article.title}</h1>
            {article.status !== "active" && (
              <Badge tone={article.status === "sold" ? "neutral" : "info"}>
                {article.status === "sold" ? "Vendu" : article.status === "reserved" ? "Réservé" : "Brouillon"}
              </Badge>
            )}
          </div>

          <div className="mt-2">
            <Price amount={article.price} currency={article.currency} className="text-2xl" />
          </div>

          {article.seller && (
            <Link href={article.seller.href} className="mt-4 inline-flex items-center gap-2 text-sm hover:underline">
              <Avatar src={article.seller.avatarUrl} name={article.seller.name} size={28} />
              {article.seller.name}
            </Link>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {article.condition && <Field label="État" value={CONDITION_LABELS[article.condition]} />}
            {article.categoryName && <Field label="Catégorie" value={article.categoryName} />}
            {article.brand && <Field label="Marque" value={article.brand} />}
            {article.size && <Field label="Taille" value={article.size} />}
            {article.color && <Field label="Couleur" value={article.color} />}
            {article.location && <Field label="Localisation" value={article.location} />}
          </dl>

          {article.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed">{article.description}</p>
          )}

          <div className="mt-8 flex gap-3">
            {isOwner ? (
              <>
                <Link href={`/article/${article.id}/edit`}>
                  <Button variant="outline">Modifier</Button>
                </Link>
                <form action={archiveArticleAction}>
                  <input type="hidden" name="article_id" value={article.id} />
                  <Button type="submit" variant="ghost">Archiver</Button>
                </form>
              </>
            ) : (
              article.status === "active" && (
                <p className="text-sm text-muted">Le paiement sécurisé arrive bientôt.</p>
              )
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

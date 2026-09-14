import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleById, listArticles } from "@/lib/queries/articles";
import { getSessionUser } from "@/lib/auth/session";
import { getMyBoutiques } from "@/lib/queries/boutiques";
import { toImageUrls } from "@/lib/utils/media";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "@/components/article/product-gallery";
import { ArticleGrid } from "@/components/article/article-grid";
import { HouseDiamond } from "@/components/brand/house-diamond";
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

  // Pièces similaires (même famille, hors article courant).
  const { items: relatedRaw } = await listArticles({
    categoryId: article.category_id ?? undefined,
    pageSize: 5,
  });
  const related = relatedRaw.filter((a) => a.id !== article.id).slice(0, 4);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-6 text-xs text-muted">
        <Link href="/marketplace" className="hover:text-accent">Marketplace</Link>
        {article.categoryName && <> <span className="mx-1.5">/</span> {article.categoryName}</>}
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={images} alt={article.title} />

        {/* Détails — colonne collante */}
        <div className="md:sticky md:top-6 md:self-start">
          <div className="flex items-start justify-between gap-3">
            {article.brand ? (
              <div className="flex items-center gap-2">
                <HouseDiamond brand={article.brand} size={8} showLabel />
              </div>
            ) : (
              <span />
            )}
            {article.status !== "active" && (
              <Badge tone={article.status === "sold" ? "neutral" : "info"}>
                {article.status === "sold" ? "Vendu" : article.status === "reserved" ? "Réservé" : "Brouillon"}
              </Badge>
            )}
          </div>

          {article.brand && <p className="u-label mt-2 text-[10px] text-accent">{article.brand}</p>}
          <h1 className="font-serif mt-1 text-3xl leading-tight">{article.title}</h1>

          <div className="mt-4">
            <Price amount={article.price} currency={article.currency} display className="text-4xl" />
          </div>

          {article.seller && (
            <Link href={article.seller.href} className="mt-5 inline-flex items-center gap-2.5 text-sm hover:text-accent">
              <Avatar src={article.seller.avatarUrl} name={article.seller.name} size={32} className={article.seller.kind === "boutique" ? "rounded-none" : ""} />
              <span className="font-medium">{article.seller.name}</span>
            </Link>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden border border-border bg-border text-sm">
            {article.condition && <Field label="État" value={CONDITION_LABELS[article.condition]} />}
            {article.categoryName && <Field label="Catégorie" value={article.categoryName} />}
            {article.brand && <Field label="Marque" value={article.brand} />}
            {article.size && <Field label="Taille" value={article.size} />}
            {article.color && <Field label="Couleur" value={article.color} />}
            {article.location && <Field label="Localisation" value={article.location} />}
          </dl>

          {article.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{article.description}</p>
          )}

          {/* Sceau d'authentification (argent) */}
          <div className="mt-6 flex items-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 34 34" aria-hidden><rect x="10" y="10" width="14" height="14" transform="rotate(45 17 17)" fill="none" stroke="var(--silver)" strokeWidth="1.6" /><path d="M13.5 17.2l2.4 2.4 4.6-4.8" fill="none" stroke="var(--silver)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="u-label text-[10px] text-silver-deep">Authentifié pièce par pièce</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {isOwner ? (
              <>
                <Link href={`/article/${article.id}/edit`}>
                  <Button variant="outline">Modifier</Button>
                </Link>
                {!article.is_auction && article.status === "active" && (
                  <Link href="/auctions/new">
                    <Button variant="outline">Mettre aux enchères</Button>
                  </Link>
                )}
                <form action={archiveArticleAction}>
                  <input type="hidden" name="article_id" value={article.id} />
                  <Button type="submit" variant="ghost">Archiver</Button>
                </form>
              </>
            ) : (
              article.status === "active" &&
              (article.is_auction ? (
                <p className="text-sm text-muted">Cet article est aux enchères.</p>
              ) : viewer ? (
                <Link href={`/checkout/${article.id}`} className="flex-1">
                  <Button className="w-full">Ajouter au panier</Button>
                </Link>
              ) : (
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">Connecte-toi pour acheter</Button>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-border pt-12">
          <div className="u-label mb-1.5 text-[11px] text-accent">Dans le même esprit</div>
          <h2 className="font-serif mb-8 text-2xl leading-none">Pièces similaires</h2>
          <ArticleGrid articles={related} emptyLabel="" />
        </section>
      )}
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="u-label text-[9px] text-muted">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

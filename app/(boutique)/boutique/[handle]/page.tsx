import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBoutiqueByHandle, getBoutiqueMembers } from "@/lib/queries/boutiques";
import { getArticlesBySeller } from "@/lib/queries/articles";
import { getSessionUser } from "@/lib/auth/session";
import { isFollowing } from "@/lib/queries/follows";
import { getReviewsAbout, getRatingSummary } from "@/lib/queries/reviews";
import { BoutiqueHeader } from "@/components/boutique/boutique-header";
import { ArticleGrid } from "@/components/article/article-grid";
import { ReviewList } from "@/components/review/review-list";
import { FollowButton } from "@/components/social/follow-button";
import { Rating } from "@/components/ui/rating";
import { Avatar } from "@/components/ui/avatar";
import { Monogram } from "@/components/brand/monogram";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  const boutique = await getBoutiqueByHandle(handle);
  return { title: boutique?.name ?? "Boutique introuvable" };
}

export default async function BoutiquePage({ params }: Props) {
  const { handle } = await params;
  const boutique = await getBoutiqueByHandle(handle);
  if (!boutique) notFound();

  const [members, articles, viewer, rating, reviews] = await Promise.all([
    getBoutiqueMembers(boutique.id),
    getArticlesBySeller({ boutiqueId: boutique.id }),
    getSessionUser(),
    getRatingSummary({ boutiqueId: boutique.id }),
    getReviewsAbout({ boutiqueId: boutique.id }),
  ]);
  const isMember = members.some((m) => m.user_id === viewer?.authId);
  const viewerFollows =
    viewer && !isMember ? await isFollowing(viewer.authId, { boutiqueId: boutique.id }) : false;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {/* Bandeau vitrine */}
      <div className="relative mb-8 h-44 overflow-hidden border border-border bg-surface-elevated">
        {boutique.cover_url ? (
          <>
            <Image src={boutique.cover_url} alt="" fill sizes="1024px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/45 to-transparent" />
          </>
        ) : (
          <div className="pointer-events-none absolute -right-8 -top-10 opacity-[0.07]">
            <Monogram size={240} />
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <BoutiqueHeader boutique={boutique} showStatus={isMember} />
        <div className="flex shrink-0 items-center gap-3">
          {viewer && !isMember && (
            <FollowButton target={{ boutiqueId: boutique.id }} initialFollowing={viewerFollows} />
          )}
          {isMember && (
            <Link href={`/boutique/${handle}/manage`} className="text-sm underline underline-offset-4">
              Gérer
            </Link>
          )}
        </div>
      </div>

      {members.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {members.map((m) => (
            <span key={m.user_id} className="inline-flex items-center gap-2 text-sm text-muted">
              <Avatar src={m.profile?.avatar_url} name={m.profile?.display_name} size={24} />
              {m.profile?.username ? (
                <Link href={`/u/${m.profile.username}`} className="hover:underline">
                  {m.profile.display_name ?? m.profile.username}
                </Link>
              ) : (
                m.profile?.display_name ?? "Membre"
              )}
            </span>
          ))}
        </div>
      )}

      {rating.count > 0 && <Rating value={rating.average} count={rating.count} className="mt-4" />}

      <section className="mt-10">
        <h2 className="t-h4 mb-4">Articles</h2>
        <ArticleGrid articles={articles} emptyLabel="Aucun article en vente pour le moment." />
      </section>

      <section className="mt-10">
        <h2 className="t-h4 mb-4">Avis</h2>
        <ReviewList reviews={reviews} />
      </section>
    </main>
  );
}

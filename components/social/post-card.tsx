import Link from "next/link";
import Image from "next/image";
import type { FeedPost } from "@/lib/queries/posts";
import { toImageUrls } from "@/lib/utils/media";
import { formatRelative } from "@/lib/utils/format";
import { Avatar } from "@/components/ui/avatar";
import { Price } from "@/components/ui/price";
import { LikeButton } from "@/components/social/like-button";

function VerifiedTick() {
  return (
    <span title="Boutique vérifiée" className="inline-flex" aria-label="Boutique vérifiée">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--silver)" strokeWidth="2" strokeLinejoin="round" aria-hidden>
        <path d="M12 2l2.4 1.8 3-.2 1 2.8 2.5 1.6-1 2.9 1 2.9-2.5 1.6-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8L3.1 18l1-2.9-1-2.9 2.5-1.6 1-2.8 3 .2z" />
        <path d="M8.6 12l2.2 2.2 4.6-4.6" stroke="var(--silver-deep)" />
      </svg>
    </span>
  );
}

/** Carte de post pour le feed — média en avant, façon réseau social. Le like est un îlot client. */
export function PostCard({ post }: { post: FeedPost }) {
  const media = toImageUrls(post.media);
  const article = post.article;
  const articleImg = article ? toImageUrls(article.images)[0] : null;
  const isBoutique = post.author?.kind === "boutique";
  const authorName = post.author?.name ?? "Utilisateur";
  const authorHref = post.author?.href ?? "#";

  return (
    <article className="group overflow-hidden border border-border bg-surface transition-shadow duration-200 hover:shadow-md">
      {/* En-tête */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <Link href={authorHref} className="shrink-0">
          <Avatar src={post.author?.avatarUrl} name={authorName} size={42} className={isBoutique ? "ring-1 ring-accent/40" : "ring-1 ring-border"} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link href={authorHref} className="truncate text-sm font-semibold hover:text-accent">{authorName}</Link>
            {isBoutique && <VerifiedTick />}
          </div>
          <p className="text-xs text-muted">
            {isBoutique ? "Boutique" : "Membre"} · {formatRelative(post.created_at)}
          </p>
        </div>
        <button type="button" aria-label="Plus d'options" className="shrink-0 rounded-full p-1 text-muted hover:text-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
        </button>
      </div>

      {/* Texte */}
      {post.content && (
        <p className="whitespace-pre-line px-4 pb-1 pt-3 text-[15px] leading-relaxed text-foreground">{post.content}</p>
      )}

      {/* Média */}
      {media.length > 0 ? (
        <div className={`mt-3 grid gap-0.5 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {media.slice(0, 4).map((url) => (
            <div key={url} className={`relative overflow-hidden bg-surface-elevated ${media.length === 1 ? "aspect-[4/5]" : "aspect-square"}`}>
              <Image src={url} alt="" fill sizes="(max-width:640px) 100vw, 600px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            </div>
          ))}
        </div>
      ) : articleImg ? (
        /* Fiche produit en héro « shoppable » (pas de média propre) */
        <Link href={`/article/${article!.id}`} className="relative mt-3 block aspect-[4/5] overflow-hidden bg-surface-elevated">
          <Image src={articleImg} alt={article!.title} fill sizes="(max-width:640px) 100vw, 600px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent p-4">
            <div className="min-w-0 text-paper">
              <p className="truncate text-sm font-medium">{article!.title}</p>
              <Price amount={article!.price} currency={article!.currency} display className="text-2xl text-paper" />
            </div>
            <span className="u-label shrink-0 rounded-[2px] bg-paper/95 px-3 py-2 text-[9.5px] text-ink">Voir la pièce</span>
          </div>
        </Link>
      ) : null}

      {/* Chip produit (si le post a déjà un média propre + une pièce liée) */}
      {media.length > 0 && article && (
        <Link href={`/article/${article.id}`} className="mx-4 mt-3 flex items-center gap-3 border border-border p-2.5 transition-colors hover:bg-surface-elevated">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-surface-elevated">
            {articleImg && <Image src={articleImg} alt="" fill sizes="48px" className="object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{article.title}</p>
            <Price amount={article.price} currency={article.currency} display className="text-base" />
          </div>
          <span className="u-label shrink-0 text-[9px] text-accent">Voir</span>
        </Link>
      )}

      {/* Barre d'engagement */}
      <div className="flex items-center gap-1 px-3 py-2.5">
        <LikeButton postId={post.id} initialLiked={post.viewerLiked} initialCount={post.likeCount} />
        <Link href={`/feed/${post.id}`} className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm text-muted transition-colors hover:bg-surface-elevated hover:text-foreground">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" />
          </svg>
          <span className="tabular-nums">{post.commentCount}</span>
        </Link>
        <Link href={`/feed/${post.id}`} aria-label="Partager" className="inline-flex items-center rounded-full px-2 py-1.5 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

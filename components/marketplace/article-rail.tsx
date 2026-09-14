import Link from "next/link";
import type { Tables } from "@/types/database";
import { ArticleCard } from "@/components/article/article-card";

/**
 * Ruban horizontal défilant d'articles, avec titre et lien « Tout voir »
 * optionnel à droite. Présentation pure (reçoit ses articles en props).
 * Utilisé pour les rubans par macro-catégorie et la « Sélection pour toi ».
 */
export function ArticleRail({
  title,
  eyebrow,
  seeAllHref,
  articles,
}: {
  title: string;
  eyebrow?: string;
  seeAllHref?: string;
  articles: Tables<"articles">[];
}) {
  if (articles.length === 0) return null;

  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <div className="u-label mb-1 text-[10px] text-accent">{eyebrow}</div>}
          <h2 className="t-h3 truncate">{title}</h2>
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="u-label group flex shrink-0 items-center gap-1 text-[10px] text-accent hover:underline"
          >
            Tout voir
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden>
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" />
            </svg>
          </Link>
        )}
      </div>

      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {articles.map((a) => (
          <div key={a.id} className="w-[44%] shrink-0 snap-start sm:w-[210px]">
            <ArticleCard article={a} />
          </div>
        ))}
      </div>
    </section>
  );
}

import type { Tables } from "@/types/database";
import { ArticleCard } from "@/components/article/article-card";
import { EmptyState } from "@/components/ui/empty-state";

/** Grille responsive d'articles avec état vide. Présentation pure. */
export function ArticleGrid({
  articles,
  emptyLabel = "Aucun article.",
}: {
  articles: Tables<"articles">[];
  emptyLabel?: string;
}) {
  if (articles.length === 0) {
    return <EmptyState title={emptyLabel} />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

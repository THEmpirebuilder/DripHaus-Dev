import {
  listArticles,
  getFamilyRails,
  getSelectionForYou,
  type ArticleSort,
} from "@/lib/queries/articles";
import { getCategories, getTopCategories, getCategoryById } from "@/lib/queries/categories";
import { Constants, type Enums } from "@/types/database";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { CategoryTiles } from "@/components/marketplace/category-tiles";
import { ArticleRail } from "@/components/marketplace/article-rail";
import { Pagination } from "@/components/marketplace/pagination";
import { ArticleGrid } from "@/components/article/article-grid";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Marketplace" };

type SearchParams = {
  q?: string;
  category?: string;
  genre?: string;
  condition?: string;
  sort?: string;
  page?: string;
};

const SORTS: ArticleSort[] = ["recent", "price_asc", "price_desc"];
const CONDITIONS = Constants.public.Enums.article_condition;
const GENDERS = Constants.public.Enums.article_gender;

/** Construit un href en conservant les filtres, pour une page donnée. */
function pageHref(sp: SearchParams, page: number): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.category) params.set("category", sp.category);
  if (sp.genre) params.set("genre", sp.genre);
  if (sp.condition) params.set("condition", sp.condition);
  if (sp.sort) params.set("sort", sp.sort);
  if (page > 0) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/marketplace?${qs}` : "/marketplace";
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const page = Math.max(0, Number(sp.page ?? 0) || 0);
  const sort = SORTS.includes(sp.sort as ArticleSort) ? (sp.sort as ArticleSort) : "recent";
  const condition = (CONDITIONS as readonly string[]).includes(sp.condition ?? "")
    ? (sp.condition as Enums<"article_condition">)
    : undefined;
  const genre = (GENDERS as readonly string[]).includes(sp.genre ?? "")
    ? (sp.genre as Enums<"article_gender">)
    : undefined;

  const [families, categories, activeCategory] = await Promise.all([
    getTopCategories(),
    getCategories(),
    sp.category ? getCategoryById(sp.category) : Promise.resolve(null),
  ]);

  // Vue « famille » : famille sélectionnée, sans recherche texte → on présente
  // un ruban défilant par macro-catégorie plutôt qu'une grille à plat.
  const isFamilyView = !!activeCategory && activeCategory.parent_id === null && !sp.q;

  const rails = isFamilyView ? await getFamilyRails(activeCategory!.id, { genre }) : [];

  // Vue normale (grille + pagination). « Sélection pour toi » uniquement sur
  // l'accueil du catalogue (pas de filtre, page 0).
  const showSelection = !isFamilyView && !sp.category && !sp.q && !genre && !condition && page === 0;
  const [selection, listing] = await Promise.all([
    showSelection ? getSelectionForYou() : Promise.resolve([]),
    isFamilyView
      ? Promise.resolve(null)
      : listArticles({ q: sp.q, categoryId: sp.category, genre, condition, sort, page }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <div className="u-label mb-1.5 text-[11px] text-accent">
          {activeCategory
            ? activeCategory.parent_id === null
              ? "Famille"
              : "Catégorie"
            : "Le catalogue"}
        </div>
        <h1 className="t-h1">{activeCategory ? activeCategory.name : "Marketplace"}</h1>
      </div>

      {/* Boutons des 5 familles (masqués pendant une recherche texte). */}
      {!sp.q && families.length > 0 && (
        <div className="mb-8">
          <CategoryTiles categories={families} activeId={activeCategory?.id ?? null} />
        </div>
      )}

      <FilterBar categories={categories} />

      {isFamilyView ? (
        <div className="mt-10 space-y-10">
          {rails.length > 0 ? (
            rails.map((rail) => (
              <ArticleRail
                key={rail.category.id}
                title={rail.category.name}
                seeAllHref={`/marketplace?category=${rail.category.id}${genre ? `&genre=${genre}` : ""}`}
                articles={rail.items}
              />
            ))
          ) : (
            <EmptyState title="Aucun article dans cette famille pour l'instant." />
          )}
        </div>
      ) : (
        <>
          {selection.length > 0 && (
            <div className="mt-10">
              <ArticleRail eyebrow="Rien que pour toi" title="Sélection pour toi" articles={selection} />
            </div>
          )}

          <div className="mt-10">
            <ArticleGrid
              articles={listing!.items}
              emptyLabel="Aucun article ne correspond à ta recherche."
            />
          </div>

          <Pagination
            page={page}
            prevHref={page > 0 ? pageHref(sp, page - 1) : null}
            nextHref={listing!.hasMore ? pageHref(sp, page + 1) : null}
          />
        </>
      )}
    </main>
  );
}

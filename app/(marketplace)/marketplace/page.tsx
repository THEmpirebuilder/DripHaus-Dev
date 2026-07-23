import { listArticles, type ArticleSort } from "@/lib/queries/articles";
import { getCategories } from "@/lib/queries/categories";
import { Constants, type Enums } from "@/types/database";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { Pagination } from "@/components/marketplace/pagination";
import { ArticleGrid } from "@/components/article/article-grid";

export const metadata = { title: "Marketplace" };

type SearchParams = {
  q?: string;
  category?: string;
  condition?: string;
  sort?: string;
  page?: string;
};

const SORTS: ArticleSort[] = ["recent", "price_asc", "price_desc"];
const CONDITIONS = Constants.public.Enums.article_condition;

/** Construit un href en conservant les filtres, pour une page donnée. */
function pageHref(sp: SearchParams, page: number): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.category) params.set("category", sp.category);
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
  const categories = await getCategories();

  const page = Math.max(0, Number(sp.page ?? 0) || 0);
  const sort = SORTS.includes(sp.sort as ArticleSort) ? (sp.sort as ArticleSort) : "recent";
  const condition = (CONDITIONS as readonly string[]).includes(sp.condition ?? "")
    ? (sp.condition as Enums<"article_condition">)
    : undefined;

  const { items, hasMore } = await listArticles({
    q: sp.q,
    categoryId: sp.category,
    condition,
    sort,
    page,
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Marketplace</h1>

      <FilterBar categories={categories} />

      <div className="mt-8">
        <ArticleGrid articles={items} emptyLabel="Aucun article ne correspond à ta recherche." />
      </div>

      <Pagination
        page={page}
        prevHref={page > 0 ? pageHref(sp, page - 1) : null}
        nextHref={hasMore ? pageHref(sp, page + 1) : null}
      />
    </main>
  );
}

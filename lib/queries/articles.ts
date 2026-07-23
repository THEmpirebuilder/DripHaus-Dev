import { createClient } from "@/lib/supabase/server";
import type { Tables, Enums } from "@/types/database";

export type Article = Tables<"articles">;

/** Vendeur résolu pour affichage (user OU boutique). */
export type SellerRef = {
  kind: "user" | "boutique";
  name: string;
  href: string;
  avatarUrl: string | null;
};

export type ArticleWithMeta = Article & {
  categoryName: string | null;
  seller: SellerRef | null;
};

/** Résout l'identité publique du vendeur d'un article (XOR user/boutique). */
async function resolveSeller(article: Article): Promise<SellerRef | null> {
  const supabase = await createClient();

  if (article.seller_user_id) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("user_id", article.seller_user_id)
      .maybeSingle();
    if (!data) return null;
    return {
      kind: "user",
      name: data.display_name ?? data.username ?? "Vendeur",
      href: data.username ? `/u/${data.username}` : "#",
      avatarUrl: data.avatar_url,
    };
  }

  if (article.seller_boutique_id) {
    const { data } = await supabase
      .from("boutiques")
      .select("name, handle, logo_url")
      .eq("id", article.seller_boutique_id)
      .maybeSingle();
    if (!data) return null;
    return { kind: "boutique", name: data.name, href: `/boutique/${data.handle}`, avatarUrl: data.logo_url };
  }

  return null;
}

/** Article complet (catégorie + vendeur résolu). RLS applique la visibilité. */
export async function getArticleById(id: string): Promise<ArticleWithMeta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, category:categories(name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { category, ...article } = data as Article & { category: { name: string } | null };
  const seller = await resolveSeller(article);
  return { ...article, categoryName: category?.name ?? null, seller };
}

/** Articles d'un vendeur donné (user OU boutique). */
export async function getArticlesBySeller(params: {
  userId?: string;
  boutiqueId?: string;
}): Promise<Article[]> {
  const supabase = await createClient();
  let query = supabase.from("articles").select("*").order("created_at", { ascending: false });

  if (params.userId) query = query.eq("seller_user_id", params.userId);
  else if (params.boutiqueId) query = query.eq("seller_boutique_id", params.boutiqueId);
  else return [];

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export type ArticleFilters = {
  q?: string;
  categoryId?: string;
  condition?: Enums<"article_condition">;
  sort?: "recent" | "price_asc" | "price_desc";
  limit?: number;
};

/**
 * Listing marketplace : articles publiés (`active`), avec filtres/tri.
 * La RLS élargit la visibilité au propriétaire, mais on cible `active` ici.
 */
export async function listArticles(filters: ArticleFilters = {}): Promise<Article[]> {
  const supabase = await createClient();
  let query = supabase.from("articles").select("*").eq("status", "active");

  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.condition) query = query.eq("condition", filters.condition);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  query = query.limit(filters.limit ?? 48);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

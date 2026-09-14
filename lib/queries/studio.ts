import { createClient } from "@/lib/supabase/server";
import { listArticles } from "@/lib/queries/articles";
import { firstImage, toImageUrls } from "@/lib/utils/media";
import { houseTier, type HouseTier } from "@/lib/utils/house-tier";
import type { Json } from "@/types/database";

/**
 * Lectures typées pour le Studio IA (couche 2, cf. CLAUDE.md §4). Les pages
 * appellent ces fonctions, jamais Supabase directement.
 *
 * NB — le solde de crédits (`studio_credit_ledger`) n'est pas encore lu ici :
 * la table arrive avec la migration 009 et n'est activée (octrois) qu'avec WB4.
 * À câbler après `types:gen`.
 */

/** Pièce réellement en vente, proposée pour « compléter le look » (famille L). */
export type MatchPiece = {
  id: string;
  title: string;
  brand: string | null;
  price: number;
  currency: string;
  image: string | null;
  size: string | null;
  tier: HouseTier;
};

/**
 * Suggestions de matching depuis l'inventaire LIVE — c'est le moat de la
 * famille L : les pièces proposées sont achetables. Ici, un échantillon réel
 * du catalogue actif ; l'Engine remplacera l'ordre par une recherche
 * vectorielle (Marqo-FashionSigLIP sur pgvector) une fois 009 appliquée.
 */
export async function getMatchingSuggestions(limit = 3): Promise<MatchPiece[]> {
  const { items } = await listArticles({ pageSize: limit });
  return items.map((a) => ({
    id: a.id,
    title: a.title,
    brand: a.brand,
    price: Number(a.price),
    currency: a.currency,
    image: firstImage(a.images),
    size: a.size,
    tier: houseTier(a.brand),
  }));
}

/**
 * Images déjà présentes sur DripHaus que l'utilisateur peut réutiliser comme
 * INPUT du Studio (famille A) : ses propres pièces + celles des boutiques dont
 * il est membre. Évite de re-téléverser une photo déjà en ligne.
 */
export async function getStudioSources(userId: string, limit = 12): Promise<string[]> {
  const supabase = await createClient();

  const { data: own } = await supabase
    .from("articles")
    .select("images")
    .eq("seller_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data: memberships } = await supabase
    .from("boutique_members")
    .select("boutique_id")
    .eq("user_id", userId);

  const boutiqueIds = (memberships ?? []).map((m) => m.boutique_id);
  let boutiqueArticles: { images: Json }[] = [];
  if (boutiqueIds.length > 0) {
    const { data } = await supabase
      .from("articles")
      .select("images")
      .in("seller_boutique_id", boutiqueIds)
      .order("created_at", { ascending: false })
      .limit(limit * 2);
    boutiqueArticles = data ?? [];
  }

  const urls: string[] = [];
  for (const a of [...(own ?? []), ...boutiqueArticles]) urls.push(...toImageUrls(a.images));
  return Array.from(new Set(urls)).slice(0, limit);
}
